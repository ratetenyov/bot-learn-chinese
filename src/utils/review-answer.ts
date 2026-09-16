import { Context } from "telegraf";
import { Direction, ReviewSession } from "../types";
import { formatAnswer } from "./format-answer";
import { sendPrompt } from "./send-prompt";
import { checkAnswer } from "../ai";
import { loadFromStore } from "./load-from-store";
import { saveToStore } from "./save-to-store";
import { STAGES } from "../constants/stages";

async function advanceSession(ctx: Context, sessions: Map<number, ReviewSession>): Promise<void> {
    const session = sessions.get(ctx.chat!.id);
    if (!session) return;

    session.index += 1;
    
    if (session.index < session.words.length) {
        await sendPrompt(ctx, session);
        return;
    }
  if (session.round === 1) {
    session.round = 2;
    session.index = 0;
    await ctx.reply('Круг 2 — перевод → иероглиф');
    await sendPrompt(ctx, session);
    return;
  }
  sessions.delete(ctx.chat!.id);
  await ctx.reply(`Сессия завершена (${session.stage}).`);
}

export async function advanceStage(word: string): Promise<void> {
  const store = await loadFromStore();
  const entry = store[word];
  if (!entry || entry.stage === 'learned') return;
  entry.stage = STAGES[entry.stage].next;
  entry.stageEnteredAt = new Date().toISOString();
  await saveToStore(store);
}

export async function reviewAnswer({ctx, text, sessions}: {ctx: Context, text: string, sessions: Map<number, ReviewSession>}): Promise<void> {
  const session = sessions.get(ctx.chat!.id)!;
  const word = session.words[session.index];

  const normalized = text.trim().toLowerCase();

  if (normalized === 'no') {
    await ctx.reply(formatAnswer(word, session.round));
    await advanceSession(ctx, sessions);
    return;
  }

  const direction: Direction = session.round === 1 ? 'zh-to-ru' : 'ru-to-zh';
  const correct = await checkAnswer(word, text, direction);

  if (correct) {
    await ctx.reply(`correct (${word.pinyin})`);
    if (session.round === 2) await advanceStage(word.word);
  } else {
    await ctx.reply(`wrong\n${formatAnswer(word, session.round)}`);
  }
  await advanceSession(ctx, sessions);
}