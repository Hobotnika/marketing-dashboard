export interface BrandVoiceProfile {
  // Identity
  brand_name: string;
  tagline: string | null;
  industry_expertise: string;

  // Core Voice
  tone: string;
  personality_traits: string[];

  // Examples (CRITICAL for AI training)
  example_short_form: string; // 1-2 sentences
  example_long_form: string;  // 2-3 paragraphs

  // Rules
  avoid: string[];
  signature_phrases: string[];

  // Preferences
  adapt_to_audience: boolean;
  demonstrate_expertise: boolean;
  maintain_authenticity: boolean;

  // Optional
  cta_style?: 'direct' | 'soft' | 'urgent';
}

/**
 * Inject brand voice variables into a prompt template
 */
export function injectBrandVoice(
  promptText: string,
  brandVoice: BrandVoiceProfile
): string {
  let result = promptText;

  // Replace simple string variables
  result = result.replace(/\{\{brand_name\}\}/g, brandVoice.brand_name);
  result = result.replace(/\{\{tagline\}\}/g, brandVoice.tagline || '');
  result = result.replace(/\{\{industry_expertise\}\}/g, brandVoice.industry_expertise);
  result = result.replace(/\{\{tone\}\}/g, brandVoice.tone);
  result = result.replace(/\{\{example_short_form\}\}/g, brandVoice.example_short_form);
  result = result.replace(/\{\{example_long_form\}\}/g, brandVoice.example_long_form);

  // Replace array variables (join with commas or newlines)
  result = result.replace(/\{\{personality_traits\}\}/g, brandVoice.personality_traits.join(', '));
  result = result.replace(/\{\{avoid\}\}/g, brandVoice.avoid.join(', '));
  result = result.replace(/\{\{signature_phrases\}\}/g, brandVoice.signature_phrases.join(', '));

  // Handle conditional blocks for signature_phrases
  const signaturePhrasesBlock = /\{\{#if signature_phrases\}\}([\s\S]*?)\{\{\/if\}\}/g;
  if (brandVoice.signature_phrases.length > 0) {
    result = result.replace(signaturePhrasesBlock, '$1');
    result = result.replace(/\{\{signature_phrases\}\}/g, brandVoice.signature_phrases.join('\n- '));
  } else {
    result = result.replace(signaturePhrasesBlock, '');
  }

  // Handle boolean preferences
  result = result.replace(/\{\{adapt_to_audience\}\}/g, brandVoice.adapt_to_audience.toString());
  result = result.replace(/\{\{demonstrate_expertise\}\}/g, brandVoice.demonstrate_expertise.toString());
  result = result.replace(/\{\{maintain_authenticity\}\}/g, brandVoice.maintain_authenticity.toString());

  return result;
}

/**
 * Validate brand voice profile
 */
export function validateBrandVoice(
  brandVoice: Partial<BrandVoiceProfile>
): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  // Required fields
  if (!brandVoice.brand_name || brandVoice.brand_name.trim() === '') {
    errors.push('Brand name is required');
  }

  if (!brandVoice.industry_expertise || brandVoice.industry_expertise.trim() === '') {
    errors.push('Industry expertise is required');
  }

  if (!brandVoice.tone || brandVoice.tone.trim() === '') {
    errors.push('Overall tone is required');
  }

  if (!brandVoice.personality_traits || brandVoice.personality_traits.length === 0) {
    errors.push('At least one personality trait is required');
  }

  // Validate examples with minimum lengths
  if (!brandVoice.example_short_form || brandVoice.example_short_form.length < 100) {
    errors.push('Short-form example must be at least 100 characters (1-2 sentences)');
  }

  if (!brandVoice.example_long_form || brandVoice.example_long_form.length < 300) {
    errors.push('Long-form example must be at least 300 characters (2-3 paragraphs)');
  }

  // Validate arrays
  if (!brandVoice.avoid) {
    errors.push('Avoid list is required');
  }

  if (!brandVoice.signature_phrases) {
    errors.push('Signature phrases are required');
  }

  // Validate booleans
  if (typeof brandVoice.adapt_to_audience !== 'boolean') {
    errors.push('Adapt to audience preference is required');
  }

  if (typeof brandVoice.demonstrate_expertise !== 'boolean') {
    errors.push('Demonstrate expertise preference is required');
  }

  if (typeof brandVoice.maintain_authenticity !== 'boolean') {
    errors.push('Maintain authenticity preference is required');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Get brand voice template for Meta Ads
 */
export function getMetaAdsBrandVoiceTemplate(): string {
  return `
BRAND VOICE GUIDELINES:
You are writing as: {{brand_name}}
Industry expertise: {{industry_expertise}}
Overall tone: {{tone}}
Personality: {{personality_traits}}

AVOID: {{avoid}}

EXAMPLE OF THIS BRAND'S WRITING STYLE:

Short-form:
{{example_short_form}}

Long-form:
{{example_long_form}}

CRITICAL: Write in this exact style. Sound like {{brand_name}}, not a generic AI copywriter.
Use similar sentence structure, word choice, and tone as the examples above.

{{#if signature_phrases}}
Signature phrases (use naturally when appropriate):
{{signature_phrases}}
{{/if}}
`;
}

/**
 * Get brand voice template for Google Ads
 */
export function getGoogleAdsBrandVoiceTemplate(): string {
  return `
BRAND VOICE:
Brand: {{brand_name}}
Tone: {{tone}}
Style: {{personality_traits}}

Headlines should sound like {{brand_name}}, not generic ads.
Reference the brand's short-form example: {{example_short_form}}
`;
}

/**
 * Parse brand voice from JSON string
 */
export function parseBrandVoice(json: string | null): BrandVoiceProfile | null {
  if (!json) return null;

  try {
    return JSON.parse(json) as BrandVoiceProfile;
  } catch (error) {
    console.error('Error parsing brand voice:', error);
    return null;
  }
}

/**
 * Convert brand voice to JSON string
 */
export function stringifyBrandVoice(brandVoice: BrandVoiceProfile): string {
  return JSON.stringify(brandVoice, null, 2);
}
