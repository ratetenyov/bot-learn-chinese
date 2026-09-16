import { STAGES } from "../constants/stages";
import { LearningInProgressStage, Word } from "../types";
import { loadFromStore } from "./load-from-store";

/** Слова заданной стадии, для которых прошёл интервал повторения. */
export async function getDueWords(stage: LearningInProgressStage): Promise<Word[]> {
  const store = await loadFromStore();
  const { interval } = STAGES[stage];
  const now = Date.now();

  return Object.entries(store)
    .filter(([, entry]) => entry.stage === stage && now - Date.parse(entry.stageEnteredAt) >= interval)
    .map(([word, entry]) => ({ word, ...entry }));
}