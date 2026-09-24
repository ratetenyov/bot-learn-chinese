import { bot } from '../bot-init';
import { interruptSession } from '../utils/interrupt-session';
import { getWordsMessage } from '../utils/get-words-message';

bot.command('words', async (ctx) => {
  await interruptSession(ctx);
  await ctx.reply(await getWordsMessage());
});
