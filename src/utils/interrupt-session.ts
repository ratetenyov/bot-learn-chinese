import type { Context } from 'telegraf';
import { sessions, notified } from '../state';

/** Прерывает активную сессию повторения для этого чата, если она есть. */
export async function interruptSession(ctx: Context): Promise<void> {
  const chatId = ctx.chat?.id;
  if (chatId === undefined) return;
  const session = sessions.get(chatId);
  if (!session) return;
  sessions.delete(chatId);
  notified.delete(session.stage);
  const remaining = session.words.length - session.index;
  await ctx.reply(`Сессия повторения прервана, ${remaining} слов осталось в очереди.`);
}
