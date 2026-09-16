import OpenAI from 'openai';
import { Word, Direction } from './types';

const apiKey = process.env.OPENAI_API_KEY;

if (!apiKey || apiKey === 'sk-replace-me') {
  throw new Error('OPENAI_API_KEY is missing');
}

const client = new OpenAI({ apiKey });

const MODEL = process.env.OPENAI_MODEL ?? 'gpt-5-mini';

const SYSTEM_PROMPT = `Ты — репетитор китайского языка (путунхуа) для русскоязычного ученика.
Отвечай кратко и по делу. Когда приводишь китайский текст, давай пиньинь с тонами и перевод.
Если ученик пишет по-китайски с ошибками — мягко исправь и объясни почему.`;

type Msg = { role: 'user' | 'assistant'; content: string };

const MAX_TURNS = 10;
const history = new Map<number, Msg[]>();

export async function askAI(chatId: number, text: string): Promise<string> {
  const prev = history.get(chatId) ?? [];
  const messages = [...prev, { role: 'user' as const, content: text }];

  const res = await client.chat.completions.create({
    model: MODEL,
    reasoning_effort: 'minimal',
    verbosity: 'low',
    messages: [{ role: 'system', content: SYSTEM_PROMPT }, ...messages],
  });

  const reply = res.choices[0]?.message?.content?.trim() || '(пустой ответ)';

  history.set(
    chatId,
    [...messages, { role: 'assistant' as const, content: reply }].slice(-MAX_TURNS * 2)
  );

  return reply;
}

export function resetHistory(chatId: number): void {
  history.delete(chatId);
}

export type SegmentedWord = {
  word: string;
  pinyin: string;
  translation: string;
};

const HAN = /[一-鿿㐀-䶿]/;
const zhSegmenter = new Intl.Segmenter('zh', { granularity: 'word' });

/**
 * Splits Chinese text into words deterministically (ICU dictionary segmentation).
 * The same text always yields the same list, so /add is idempotent.
 */
export function segmentChinese(text: string): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const { segment, isWordLike } of zhSegmenter.segment(text)) {
    if (!isWordLike) continue;
    const w = segment.trim();
    if (!w || !HAN.test(w) || seen.has(w)) continue;
    seen.add(w);
    out.push(w);
  }
  return out;
}

const DESCRIBE_PROMPT = `Для каждого китайского слова из присланного JSON-массива верни пиньинь со знаками тонов и краткий перевод на русский.
Ответ — JSON вида {"words":[{"word":"中文","pinyin":"zhōngwén","translation":"китайский язык"}]}.
Не добавляй, не убирай и не меняй написание слов — верни ровно те же слова, что во входе.`;

/** Adds pinyin and translation to a list of Chinese words via the LLM. */
export async function describeWords(words: string[]): Promise<SegmentedWord[]> {
  if (words.length === 0) return [];

  const res = await client.chat.completions.create({
    model: MODEL,
    reasoning_effort: 'minimal',
    verbosity: 'low',
    response_format: { type: 'json_object' },
    messages: [
      { role: 'system', content: DESCRIBE_PROMPT },
      { role: 'user', content: JSON.stringify(words) },
    ],
  });

  const raw = res.choices[0]?.message?.content ?? '{}';
  const parsed = JSON.parse(raw) as { words?: unknown };
  const list = Array.isArray(parsed.words) ? parsed.words : [];

  const byWord = new Map<string, { pinyin: string; translation: string }>();
  for (const item of list) {
    if (!item || typeof item !== 'object') continue;
    const w = item as Record<string, unknown>;
    const word = typeof w.word === 'string' ? w.word.trim() : '';
    if (!word) continue;
    byWord.set(word, {
      pinyin: typeof w.pinyin === 'string' ? w.pinyin.trim() : '',
      translation: typeof w.translation === 'string' ? w.translation.trim() : '',
    });
  }

  // Слова и их порядок задаёт сегментатор, а не модель
  return words.map((word) => ({
    word,
    pinyin: byWord.get(word)?.pinyin ?? '',
    translation: byWord.get(word)?.translation ?? '',
  }));
}

/** Strips pinyin tone diacritics (macron/acute/grave/caron) while keeping ü's diaeresis. */
function stripTones(pinyin: string): string {
  return pinyin
    .normalize('NFD')
    .replace(/[́̀̄̌]/g, '')
    .normalize('NFC');
}

const CHECK_ANSWER_PROMPT = `Ты проверяешь ответ ученика в тренировке по китайскому языку.
Тебе дан JSON с полями word (иероглифы), pinyin (эталонный пиньинь БЕЗ тоновых знаков — тона в этой тренировке не проверяются вообще), translation (эталонный перевод на русский), direction и answer (ответ ученика).
Если direction = "zh-to-ru", ученику показали иероглифы word и он должен был назвать pinyin и translation — оба компонента обязательны.
Если direction = "ru-to-zh", ученику показали translation и он должен был назвать только иероглифы word — пиньинь в этом случае не требуется и не проверяется.
Перед сравнением мысленно убери тоновые знаки из пиньиня в ответе ученика, если они там есть, — сравнивай только буквы. Синонимичный перевод, мелкие опечатки и любая грамматическая форма перевода (число, падеж, род, время и т.п.) допустимы, если это та же лексема — например "некоторый" засчитывается за "некоторые", "играть" за "играю". Порядок компонентов в ответе не важен.
Ответ ученика верный только если присутствуют и правильны все обязательные для direction компоненты.
Выведи ровно JSON {"correct": true} или {"correct": false}, без пояснений.`;

/** Checks a user's training answer against the reference word via the LLM. */
export async function checkAnswer(word: Word, userAnswer: string, direction: Direction): Promise<boolean> {
  const res = await client.chat.completions.create({
    model: MODEL,
    reasoning_effort: 'minimal',
    verbosity: 'low',
    messages: [
      { role: 'system', content: CHECK_ANSWER_PROMPT },
      {
        role: 'user',
        content: JSON.stringify({
          word: word.word,
          pinyin: stripTones(word.pinyin),
          translation: word.translation,
          direction,
          answer: userAnswer,
        }),
      },
    ],
  });

  const raw = res.choices[0]?.message?.content ?? '';
  const match = raw.match(/"correct"\s*:\s*(true|false)/i);
  return match?.[1].toLowerCase() === 'true';
}
