import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { dirname, join } from 'node:path';

export type WordEntry = {
  /** Слово на китайском — совпадает с ключом в words.json */
  original: string;
  pinyin: string;
  translation: string;
  addedAt: string;
};

export type Word = WordEntry & { word: string };

/** A word as produced by the segmenter, before it is stored. */
export type NewWord = { word: string; pinyin: string; translation: string };

const FILE = join(process.env.WORDS_FILE ?? join(process.cwd(), 'data'), 'words.json');

let cache: Record<string, WordEntry> | null = null;

async function load(): Promise<Record<string, WordEntry>> {
  if (cache) return cache;
  try {
    cache = JSON.parse(await readFile(FILE, 'utf8')) as Record<string, WordEntry>;
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code !== 'ENOENT') throw err;
    cache = {};
  }
  return cache;
}

async function persist(): Promise<void> {
  if (!cache) return;
  await mkdir(dirname(FILE), { recursive: true });
  await writeFile(FILE, JSON.stringify(cache, null, 2), 'utf8');
}

/** Adds only words that are not in the store yet; returns the ones actually added. */
export async function addWords(words: NewWord[]): Promise<Word[]> {
  const store = await load();
  const added: Word[] = [];

  for (const w of words) {
    if (store[w.word]) continue;
    const entry: WordEntry = {
      original: w.word,
      pinyin: w.pinyin,
      translation: w.translation,
      addedAt: new Date().toISOString(),
    };
    store[w.word] = entry;
    added.push({ word: w.word, ...entry });
  }

  if (added.length > 0) await persist();
  return added;
}

export async function getAllWords(): Promise<Word[]> {
  const store = await load();
  return Object.entries(store).map(([word, entry]) => ({ word, ...entry }));
}

/** Set of Chinese words already in the store. */
export async function getKnownWords(): Promise<Set<string>> {
  return new Set(Object.keys(await load()));
}

export async function countWords(): Promise<number> {
  return Object.keys(await load()).length;
}
