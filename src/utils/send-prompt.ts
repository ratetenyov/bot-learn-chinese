import type { Context } from 'telegraf';
import type { ReviewSession } from '../types.js';

export async function sendPrompt(ctx: Context, session: ReviewSession): Promise<void> {
  const word = session.words[session.index];
  await ctx.reply(session.round === 1 ? word.word : word.translation);
}