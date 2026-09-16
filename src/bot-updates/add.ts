import { bot } from '../bot-init';
import { pendingAdd } from '../state';
import { interruptSession } from '../utils/interrupt-session';
import { handleAdd } from '../utils/handle-add';

bot.command('add', async (ctx) => {
  await interruptSession(ctx);
  const text = ctx.payload.trim();
  if (text) {
    await handleAdd(ctx, text);
  } else {
    pendingAdd.add(ctx.chat.id);
    await ctx.reply('Пришли китайский текст следующим сообщением — разберу на слова.');
  }
});
