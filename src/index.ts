import 'dotenv/config';
import { Telegraf, Markup, Context } from 'telegraf';
import { askAI, resetHistory, segmentChinese, describeWords } from './ai.js';
import { addWords, getAllWords, getKnownWords } from './store.js';

const HAS_CHINESE = /[一-鿿]/;

const token = process.env.BOT_TOKEN;

if (!token) {
  throw new Error('BOT_TOKEN is missing');
}

const ownerId = Number(process.env.OWNER_ID);

if (!Number.isInteger(ownerId)) {
  throw new Error('OWNER_ID is missing or not a number');
}

const bot = new Telegraf(token);

// Бот отвечает только владельцу
bot.use((ctx, next) => (ctx.from?.id === ownerId ? next() : undefined));

bot.start((ctx) => {
  ctx.reply(
    'Выберите действие',
    Markup.inlineKeyboard([
      [Markup.button.callback('复习单词', 'review-words')],
      [Markup.button.callback('复习句子', 'review-phrases')],
    ])
  );

});

bot.action('review-words', async (ctx) => {
  await ctx.answerCbQuery();
  await ctx.reply('Повторяем слова');
});

bot.action('review-phrases', async (ctx) => {
  await ctx.answerCbQuery();
  await ctx.reply('Повторяем фразы');
});

bot.command('reset', (ctx) => {
  resetHistory(ctx.chat.id);
  ctx.reply('История диалога очищена 🧹');
});

// Чаты, ожидающие китайский текст следующим сообщением для /add
const pendingAdd = new Set<number>();

bot.command('add', async (ctx) => {
  const text = ctx.payload.trim();
  if (!text) {
    pendingAdd.add(ctx.chat.id);
    await ctx.reply('Пришли китайский текст следующим сообщением — разберу на слова.');
    return;
  }
  await handleAdd(ctx, text);
});

bot.command('words', async (ctx) => {
  const words = await getAllWords();
  if (words.length === 0) {
    await ctx.reply('Хранилище пустое. Добавь слова через /add.');
    return;
  }
  const lines = words
    .sort((a, b) => a.addedAt.localeCompare(b.addedAt))
    .map((w) => `${w.word} — ${w.pinyin} — ${w.translation}`);
  await ctx.reply(`В хранилище ${words.length}:\n${lines.join('\n')}`);
});

async function handleAdd(ctx: Context, text: string) {
  if (!HAS_CHINESE.test(text)) {
    await ctx.reply('Не вижу китайских иероглифов в тексте.');
    return;
  }
  await ctx.sendChatAction('typing');
  try {
    const words = segmentChinese(text);
    if (words.length === 0) {
      await ctx.reply('Не удалось выделить ни одного слова.');
      return;
    }
    const known = await getKnownWords();
    const fresh = words.filter((w) => !known.has(w));
    if (fresh.length === 0) {
      await ctx.reply('Все слова уже есть в хранилище.');
      return;
    }
    const added = await addWords(await describeWords(fresh));
    if (added.length === 0) {
      await ctx.reply('Все слова уже есть в хранилище.');
      return;
    }
    await ctx.reply(
      `Добавлено (${added.length}):\n` +
        added.map((w) => `${w.word} — ${w.pinyin} — ${w.translation}`).join('\n')
    );
  } catch (err) {
    console.error('add error', err);
    await ctx.reply('Ошибка при разборе текста, попробуй ещё раз.');
  }
}

bot.on('text', async (ctx) => {
  if (pendingAdd.delete(ctx.chat.id)) {
    await handleAdd(ctx, ctx.message.text.trim());
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

bot.launch();

console.log('Bot started');