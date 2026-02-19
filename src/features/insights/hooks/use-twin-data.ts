import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/src/services/supabase/client';
import { useUser } from '@/src/shared/hooks/use-user';

type PersonalityTraits = {
  openness: number;
  conscientiousness: number;
  extraversion: number;
  agreeableness: number;
  neuroticism: number;
};

type UseTwinDataReturn = {
  isLoading: boolean;
  personalityTraits: PersonalityTraits | null;
  summary: string | null;
  hasData: boolean;
  error: string | null;
  fetchSoulMd: () => Promise<string | null>;
};

export const useTwinData = (): UseTwinDataReturn => {
  const user = useUser((s) => s.user);
  const [isLoading, setIsLoading] = useState(true);
  const [personalityTraits, setPersonalityTraits] = useState<PersonalityTraits | null>(null);
  const [summary, setSummary] = useState<string | null>(null);
  const [hasData, setHasData] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const userId = user?.id;
    if (!userId) {
      setIsLoading(false);
      return;
    }

    const fetchPersonalityResults = async () => {
      setIsLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from('personality_results')
        .select('personality_traits, summary')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      setIsLoading(false);

      if (fetchError) {
        // PGRST116 = no rows found — not an error, just no data
        if (fetchError.code === 'PGRST116') {
          setHasData(false);
          return;
        }
        setError(fetchError.message);
        return;
      }

      if (data) {
        setPersonalityTraits(data.personality_traits as PersonalityTraits);
        setSummary(data.summary as string | null);
        setHasData(true);
      }
    };

    fetchPersonalityResults();
  }, [user?.id]);

  const fetchSoulMd = useCallback(async (): Promise<string | null> => {
    const userId = user?.id;
    if (!userId) {
      return null;
    }

    const { data, error: fetchError } = await supabase
      .from('openclaw_instances')
      .select('soul_md')
      .eq('user_id', userId)
      .single();

    if (fetchError || !data) {
      return null;
    }

    return (data.soul_md as string) ?? null;
  }, [user?.id]);

  return {
    isLoading,
    personalityTraits,
    summary,
    hasData,
    error,
    fetchSoulMd,
  };
};
