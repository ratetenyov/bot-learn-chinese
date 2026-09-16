import 'dotenv/config';
import { Telegraf } from "telegraf";

const token = process.env.BOT_TOKEN;

if (!token) {
  throw new Error('BOT_TOKEN is missing');
}

export const ownerId = Number(process.env.OWNER_ID);

if (!Number.isInteger(ownerId)) {
  throw new Error('OWNER_ID is missing or not a number');
}

export const bot = new Telegraf(token);

// Bot answers to the owner only
bot.use((ctx, next) => (ctx.from?.id === ownerId ? next() : undefined));

// Unhandled errors should not crash the process
bot.catch((err, ctx) => {
  console.error('Unhandled bot error', err);
  ctx.reply('Что-то пошло не так, попробуй ещё раз.').catch(() => {});
});
