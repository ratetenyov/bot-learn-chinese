import { bot } from '../bot-init';
import { resetHistory } from '../ai';
import { interruptSession } from '../utils/interrupt-session';

bot.command('reset', async (ctx) => {
  await interruptSession(ctx);
  resetHistory(ctx.chat.id);
  await ctx.reply('История диалога очищена 🧹');
});
