import { writeFile, mkdir } from 'node:fs/promises';
import { dirname } from 'node:path';
import { WordEntry } from "../types";
import { WORDS_FILE } from "../constants/words-file";

export async function saveToStore(store: Record<string, WordEntry>): Promise<void> {
  if (!store) return;
  await mkdir(dirname(WORDS_FILE), { recursive: true });
  await writeFile(WORDS_FILE, JSON.stringify(store, null, 2), 'utf8');
}