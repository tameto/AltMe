export type Mood = 'great' | 'good' | 'neutral' | 'bad' | 'terrible';

export type JournalEntry = {
  id: string;
  userId: string;
  title: string | null;
  content: string;
  aiReflection: string | null;
  tags: string[];
  chatSessionId: string | null;
  createdAt: string;
  updatedAt: string;
};

export type MoodRecord = {
  id: string;
  userId: string;
  mood: Mood;
  note: string | null;
  recordedAt: string; // DATE
  createdAt: string;
};
