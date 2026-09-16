import { bot } from '../bot-init';
import { interruptSession } from '../utils/interrupt-session';
import { getAllWords } from '../utils/get-all-words';

bot.command('words', async (ctx) => {
  await interruptSession(ctx);
  const words = await getAllWords();
  if (words.length) {
    const lines = words
      .sort((a, b) => a.addedAt.localeCompare(b.addedAt))
      .map((w) => `${w.word} — ${w.pinyin} — ${w.translation}`);
    await ctx.reply(`В хранилище ${words.length}:\n${lines.join('\n')}`);
  } else {
    await ctx.reply('Хранилище пустое. Добавь слова через /add.');
  }
});
