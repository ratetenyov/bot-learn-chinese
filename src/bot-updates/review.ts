import { bot } from '../bot-init';
import type { LearningInProgressStage } from '../types';
import { sessions } from '../state';
import { interruptSession } from '../utils/interrupt-session';
import { startSession } from '../utils/start-session';

bot.action('review-words', async (ctx) => {
  await ctx.answerCbQuery();
  await ctx.reply('Напиши review-1d / review-3d / review-7d / review-21d, когда будут готовы слова к повторению.');
});

bot.action('review-phrases', async (ctx) => {
  await ctx.answerCbQuery();
  await ctx.reply('Повторяем фразы');
});

bot.hears(/^review-(1d|3d|7d|21d)$/i, async (ctx) => {
  const stage = ctx.match[1].toLowerCase() as LearningInProgressStage;
  await startSession(ctx, stage);
});

bot.hears(/^stop-review$/i, async (ctx) => {
  if (sessions.has(ctx.chat.id)) {
    await interruptSession(ctx);
  } else {
    await ctx.reply('Нет активной сессии повторения.');
  }
});
