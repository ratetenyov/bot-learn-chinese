import { LearningInProgressStage, Stage } from "../types";

const DAY_MS = 24 * 60 * 60 * 1000;

export const STAGES: Record<LearningInProgressStage, { interval: number; next: Stage }> = {
  '1d': { interval: DAY_MS, next: '3d' },
  '3d': { interval: 3 * DAY_MS, next: '7d' },
  '7d': { interval: 7 * DAY_MS, next: '21d' },
  '21d': { interval: 21 * DAY_MS, next: 'learned' },
} as const;