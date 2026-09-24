import { getAllWords } from './get-all-words';

/** Полный список слов из хранилища — общий ответ для /words и /delete. */
export async function getWordsMessage(): Promise<string> {
  const words = await getAllWords();
  if (!words.length) return 'Хранилище пустое. Добавь слова через /add.';
  const lines = words
    .sort((a, b) => a.addedAt.localeCompare(b.addedAt))
    .map((w) => `${w.word} — ${w.pinyin} — ${w.translation}`);
  return `В хранилище ${words.length}:\n${lines.join('\n')}`;
}
