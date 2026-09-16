import { loadFromStore } from "./load-from-store";

export async function getKnownWords(): Promise<Set<string>> {
  return new Set(Object.keys(await loadFromStore()));
}
