import type { ChatMessage } from '@/src/shared/types/chat';
import type { PersonalityResult } from '@/src/shared/types/user';

/**
 * Build system prompt based on user's personality profile.
 * TODO: Task #21 で本実装する
 */
export function buildSystemPrompt(profile: PersonalityResult | null): string {
  const basePrompt = `You are AltMe, the user's AI twin — a second version of themselves.
You mirror their personality, communication style, and thought patterns.
Be helpful, proactive, and speak in their preferred style.`;

  if (!profile) return basePrompt;

  return `${basePrompt}

User's personality profile:
- Summary: ${profile.summary}
${profile.detailedAnalysis ? `- Detailed analysis: ${profile.detailedAnalysis}` : ''}
${profile.personalityTraits ? `- Openness: ${profile.personalityTraits.openness}, Conscientiousness: ${profile.personalityTraits.conscientiousness}, Extraversion: ${profile.personalityTraits.extraversion}, Agreeableness: ${profile.personalityTraits.agreeableness}, Neuroticism: ${profile.personalityTraits.neuroticism}` : ''}

Match this communication style in your responses.`;
}

/**
 * Send a message to the AI via Supabase Edge Function.
 * TODO: Task #19 で本実装する
 */
export async function sendMessage(
  messages: ChatMessage[],
  systemPrompt: string,
): Promise<string> {
  // TODO: Call Supabase Edge Function that proxies to OpenAI
  console.log('Sending message via Edge Function proxy');
  console.log('System prompt length:', systemPrompt.length);
  console.log('Message count:', messages.length);

  return 'This is a placeholder response. OpenAI API integration via Supabase Edge Function coming soon.';
}
