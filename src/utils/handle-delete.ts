import { Context } from 'telegraf';
import { loadFromStore } from './load-from-store';
import { saveToStore } from './save-to-store';
import { getWordsMessage } from './get-words-message';

export async function handleDelete(ctx: Context, text: string) {
  const words = text
    .split(',')
    .map((w) => w.trim())
    .filter(Boolean);

  if (words.length === 0) {
    await ctx.reply('Не вижу слов для удаления. Пример: /delete 你好, 谢谢');
    return;
  }

  try {
    const store = await loadFromStore();
    const deleted: string[] = [];
    const missing: string[] = [];

    for (const word of words) {
      if (store[word]) {
        delete store[word];
        deleted.push(word);
      } else {
        missing.push(word);
      }
    }

    if (deleted.length > 0) await saveToStore(store);

    const report = [
      deleted.length > 0 ? `Удалено (${deleted.length}): ${deleted.join(', ')}` : 'Ничего не удалено.',
      missing.length > 0 ? `Не найдено: ${missing.join(', ')}` : '',
    ].filter(Boolean);

    await ctx.reply(`${report.join('\n')}\n\n${await getWordsMessage()}`);
  } catch (err) {
    console.error('delete error', err);
    await ctx.reply('Ошибка при удалении слов, попробуй ещё раз.');
  }
}
