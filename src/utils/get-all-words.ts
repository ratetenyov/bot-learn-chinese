import { Word } from "../types";
import { loadFromStore } from "./load-from-store";

export async function getAllWords(): Promise<Word[]> {
  const store = await loadFromStore();
  return Object.entries(store).map(([word, entry]) => ({ word, ...entry }));
}