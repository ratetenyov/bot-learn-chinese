export type Stage = '1d' | '3d' | '7d' | '21d' | 'learned';

export type LearningInProgressStage = Exclude<Stage, 'learned'>

export type WordEntry = {
  /** Слово на китайском — совпадает с ключом в words.json */
  original: string;
  pinyin: string;
  translation: string;
  addedAt: string;
  /** Текущая стадия интервального повторения */
  stage: Stage;
  /** Когда слово попало в текущую стадию (ISO) */
  stageEnteredAt: string;
};

export type Word = WordEntry & { word: string };

export type ReviewSession = {
  stage: LearningInProgressStage;
  round: 1 | 2;
  words: Word[];
  index: number;
};

export type NewWord = { word: string; pinyin: string; translation: string };

export type Direction = 'zh-to-ru' | 'ru-to-zh';