import type { Word } from "../types";

export function formatAnswer(word: Word, round: 1 | 2): string {
  return round === 1 ? `${word.translation} (${word.pinyin})` : `${word.word} (${word.pinyin})`;
}