/**
 * Replace variables in prompt template with actual values
 * Variables are in the format {{variable_name}}
 */
export function substitutePromptVariables(
  promptText: string,
  variables: Record<string, any>
): string {
  let result = promptText;

  for (const [key, value] of Object.entries(variables)) {
    const regex = new RegExp(`\\{\\{${key}\\}\\}`, 'g');
    result = result.replace(regex, String(value));
  }

  return result;
}

/**
 * Extract variable names from prompt template
 * Returns array of variable names found in {{variable_name}} format
 */
export function extractPromptVariables(promptText: string): string[] {
  const regex = /\{\{([^}]+)\}\}/g;
  const variables: string[] = [];
  let match;

  while ((match = regex.exec(promptText)) !== null) {
    if (!variables.includes(match[1])) {
      variables.push(match[1]);
    }
  }

  return variables;
}
