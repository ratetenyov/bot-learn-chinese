import { loadFromStore } from "./load-from-store";

export async function countWords(): Promise<number> {
  return Object.keys(await loadFromStore()).length;
}