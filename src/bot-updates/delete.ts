import { bot } from '../bot-init';
import { pendingDelete } from '../state';
import { interruptSession } from '../utils/interrupt-session';
import { handleDelete } from '../utils/handle-delete';

bot.command('delete', async (ctx) => {
  await interruptSession(ctx);
  const text = ctx.payload.trim();
  if (text) {
    await handleDelete(ctx, text);
  } else {
    pendingDelete.add(ctx.chat.id);
    await ctx.reply('Пришли иероглифы через запятую следующим сообщением — удалю их из словаря.');
  }
});
