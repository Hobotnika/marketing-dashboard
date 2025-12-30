import type { Avatar, AvatarPersonaData } from '@/types/avatar';

/**
 * Generate rating prompt for a specific avatar
 */
export function getAvatarRatingPrompt(
  avatarName: string,
  personaData: AvatarPersonaData,
  adCopy: string
): string {
  return `Pretend you are ${personaData.prompt_persona}

You are now part of a panel of prospects reviewing ads as a focus group.
Your job is to give your honest opinion about how this ad makes you feel
and what it could do better.

CRITICAL: Stay in character. Respond as ${avatarName}, not as a generic AI.
Reference your specific struggles, goals, and fears when evaluating this ad.

For context on your role:
- Age: ${personaData.demographics.age}
- Gender: ${personaData.demographics.gender}
- Income: ${personaData.demographics.income}
- Key Struggles: ${personaData.psychographics.struggles.join(', ')}
- Key Goals: ${personaData.psychographics.goals.join(', ')}
- Key Fears: ${personaData.psychographics.fears.join(', ')}

When you review this ad, answer these questions from YOUR perspective:
1. Does it relate to you personally?
2. Does it address YOUR needs and struggles?
3. What about it appeals to YOU specifically?
4. What about it turns YOU off?
5. What do you wish the ad said that would make YOU buy now?
6. How could this ad get YOUR attention better?

Do NOT use generic copywriting advice. Stick to your persona and critique
based on your own desires, challenges, fears, and goals.

Here is the ad to review:

${adCopy}

Provide your raw, personal feedback as ${avatarName}:`;
}

/**
 * Simple sentiment analysis based on keyword matching
 */
export function analyzeSentiment(feedback: string): 'positive' | 'mixed' | 'negative' {
  const lowerFeedback = feedback.toLowerCase();

  const positiveWords = [
    'love', 'great', 'perfect', 'excellent', 'amazing',
    'definitely', 'would buy', 'resonates', 'appeals', 'convincing',
    'compelling', 'speaks to me', 'addresses my', 'hits home',
    'relates to me', 'exactly what', 'right on', 'this is what',
  ];

  const negativeWords = [
    'confusing', 'boring', 'generic', 'not relevant', 'turns me off',
    'wouldn\'t buy', 'doesn\'t address', 'missing', 'lacks',
    'doesn\'t speak', 'doesn\'t resonate', 'vague', 'unclear',
    'not convincing', 'skeptical', 'concerned', 'worried about',
  ];

  const positiveCount = positiveWords.filter(w => lowerFeedback.includes(w)).length;
  const negativeCount = negativeWords.filter(w => lowerFeedback.includes(w)).length;

  if (positiveCount > negativeCount + 2) return 'positive';
  if (negativeCount > positiveCount + 2) return 'negative';
  return 'mixed';
}
