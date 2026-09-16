import { message } from "telegraf/filters";
import { bot } from "../bot-init";
import { askAI } from "../ai";
import { handleAdd } from "../utils/handle-add";
import { reviewAnswer } from "../utils/review-answer";
import { pendingAdd, sessions } from "../state";

bot.on(message('text'), async (ctx) => {
  if (pendingAdd.delete(ctx.chat.id)) {
    await handleAdd(ctx, ctx.message.text.trim());
    return;
  }
  if (sessions.has(ctx.chat.id)) {
    try {
      await reviewAnswer({ ctx, text: ctx.message.text, sessions });
    } catch (err) {
      console.error('review error', err);
      await ctx.reply('Ошибка при проверке ответа, попробуй ещё раз.');
    }
    return;
  }

  await ctx.sendChatAction('typing');

  try {
    const answer = await askAI(ctx.chat.id, ctx.message.text);
    await ctx.reply(answer);
  } catch (err) {
    console.error('AI error', err);
    await ctx.reply('Ошибка при обращении к нейронке, попробуй ещё раз');
  }
});
