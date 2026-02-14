export type Mood = 'great' | 'good' | 'neutral' | 'bad' | 'terrible';

export type JournalEntry = {
  id: string;
  userId: string;
  content: string;
  aiReflection: string | null;
  mood: Mood | null;
  tags: string[];
  createdAt: string;
  updatedAt: string;
};

export type JournalEntryInput = {
  content: string;
  mood?: Mood;
  tags?: string[];
};

export type MoodRecord = {
  id: string;
  userId: string;
  mood: Mood;
  note: string | null;
  recordedAt: string;
  createdAt: string;
};

export type MoodRecordInput = {
  mood: Mood;
  note?: string;
};
