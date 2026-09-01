import 'dotenv/config';
import { Telegraf, Markup } from 'telegraf';

const token = process.env.BOT_TOKEN;

if (!token) {
  throw new Error('BOT_TOKEN is missing');
}

const bot = new Telegraf(token);

bot.start((ctx) => {
  ctx.reply(
    'Выберите действие',
    Markup.inlineKeyboard([
      [Markup.button.callback('Погода', 'weather')],
      [Markup.button.callback('Новости', 'news')],
    ])
  );
});

bot.action('weather', async (ctx) => {
  await ctx.answerCbQuery();
  await ctx.reply('Сегодня солнечно ☀️');
});

bot.action('news', async (ctx) => {
  await ctx.answerCbQuery();
  await ctx.reply('Пока новостей нет');
});

bot.on('text', (ctx) => {
  ctx.reply(`Ты написал: ${ctx.message.text}`);
});

bot.launch();

console.log('Bot started');