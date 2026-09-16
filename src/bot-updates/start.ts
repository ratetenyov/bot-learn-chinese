import { Markup } from 'telegraf';
import { bot } from '../bot-init';
import { interruptSession } from '../utils/interrupt-session';

bot.start(async (ctx) => {
  await interruptSession(ctx);
  await ctx.reply(
    'Выберите действие',
    Markup.inlineKeyboard([
      [Markup.button.callback('复习单词', 'review-words')],
      [Markup.button.callback('复习句子', 'review-phrases')],
    ])
  );
});
