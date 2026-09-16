import { readFile } from 'node:fs/promises';
import { WordEntry } from "../types";
import { WORDS_FILE } from "../constants/words-file";

let cache: Record<string, WordEntry> | null = null;

export async function loadFromStore(): Promise<Record<string, WordEntry>> {
  if (cache) return cache;
  try {
    cache = JSON.parse(await readFile(WORDS_FILE, 'utf8')) as Record<string, WordEntry>;
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code !== 'ENOENT') throw err;
    cache = {};
  }

  return cache;
}