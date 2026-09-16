import type { Context } from 'telegraf';
import type { ReviewSession, Stage } from '../types';
import { sessions, notified } from '../state';
import { getDueWords } from './get-due-words';
import { sendPrompt } from './send-prompt';
import { interruptSession } from './interrupt-session';

export async function startSession(ctx: Context, stage: Exclude<Stage, 'learned'>): Promise<void> {
  await interruptSession(ctx);
  const due = await getDueWords(stage);
  if (due.length === 0) {
    await ctx.reply(`Нет слов, готовых к повторению в ${stage}.`);
    return;
  }
  const session: ReviewSession = { stage, round: 1, words: due, index: 0 };
  sessions.set(ctx.chat!.id, session);
  notified.delete(stage);
  await ctx.reply(`Начинаем повторение (${stage}), круг 1 — иероглиф → перевод. Слов: ${due.length}`);
  await sendPrompt(ctx, session);
}
