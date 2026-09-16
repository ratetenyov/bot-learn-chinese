import { Context } from "telegraf";
import { describeWords, segmentChinese } from "../ai";
import { getKnownWords } from "./get-known-word";
import { NewWord, Word, WordEntry } from "../types";
import { loadFromStore } from "./load-from-store";
import { saveToStore } from './save-to-store';

/** Adds only words that are not in the store yet; returns the ones actually added. */
async function addWords(words: NewWord[]): Promise<Word[]> {
  const store = await loadFromStore();
  const added: Word[] = [];

  for (const w of words) {
    if (store[w.word]) continue;
    const addedAt = new Date().toISOString();
    const entry: WordEntry = {
      original: w.word,
      pinyin: w.pinyin,
      translation: w.translation,
      addedAt,
      stage: '1d',
      stageEnteredAt: addedAt,
    };
    store[w.word] = entry;
    added.push({ word: w.word, ...entry });
  }

  if (added.length > 0) await saveToStore(store);
  return added;
}

const HAS_CHINESE = /[一-鿿]/;

export async function handleAdd(ctx: Context, text: string) {
  if (!HAS_CHINESE.test(text)) {
    await ctx.reply('Не вижу китайских иероглифов в тексте.');
    return;
  }

  await ctx.sendChatAction('typing');
  
  try {
    const words = segmentChinese(text);
    if (words.length === 0) {
      await ctx.reply('Не удалось выделить ни одного слова.');
      return;
    }
    const known = await getKnownWords();

    const fresh = words.filter((w) => !known.has(w));
    if (fresh.length === 0) {
      await ctx.reply('Все слова уже есть в хранилище.');
      return;
    }
    const added = await addWords(await describeWords(fresh));
    if (added.length === 0) {
      await ctx.reply('Все слова уже есть в хранилище.');
      return;
    }
    await ctx.reply(
      `Добавлено (${added.length}):\n` +
        added.map((w) => `${w.word} — ${w.pinyin} — ${w.translation}`).join('\n')
    );
  } catch (err) {
    console.error('add error', err);
    await ctx.reply('Ошибка при разборе текста, попробуй ещё раз.');
  }
}