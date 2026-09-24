import { bot, ownerId } from './bot-init.js';
import type { LearningInProgressStage } from './types.js';
import { STAGES } from './constants/stages.js';
import { getDueWords } from './utils/get-due-words.js';
import { notified } from './state.js';
import './bot-updates/start.js';
import './bot-updates/review.js';
import './bot-updates/reset.js';
import './bot-updates/add.js';
import './bot-updates/words.js';
import './bot-updates/delete.js';
import './bot-updates/text.js';

bot.launch();

async function getWordsToReview(): Promise<void> {
  for (const stage of Object.keys(STAGES) as LearningInProgressStage[]) {
    if (notified.has(stage)) continue;
    const due = await getDueWords(stage);

    if (due.length > 0) {
      notified.add(stage);
      await bot.telegram.sendMessage(
        ownerId,
        `Пора повторить: ${stage} (${due.length} слов). Команда: review-${stage}`
      );
    }
  }
}

const POLL_INTERVAL_MS = 30 * 60 * 1000; // 30 min

setInterval(getWordsToReview, POLL_INTERVAL_MS);
getWordsToReview();

console.log('Bot started');
