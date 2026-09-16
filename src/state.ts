import type { LearningInProgressStage, ReviewSession } from './types';

// Активные сессии повторения и стадии, по которым уже отправлено уведомление
export const sessions = new Map<number, ReviewSession>();
export const notified = new Set<LearningInProgressStage>();

// Чаты, ожидающие китайский текст следующим сообщением для /add
export const pendingAdd = new Set<number>();
