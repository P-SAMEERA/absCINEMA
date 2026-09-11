/**
 * Automatically converts casually written scripts or pasted dialog into standard screenplay format.
 * Example:
 *   rishi: where are you going?
 *   veda (whispering): home
 *   rishi looks at her.
 * ->
 *   RISHI
 *   Where are you going?
 *
 *   VEDA
 *   (whispering)
 *   Home.
 *
 *   Rishi looks at her.
 */
export function autoFormatScreenplay(input: string): string {
  const lines = input.split(/\r?\n/);
  const formatted: string[] = [];

  // Match pattern: "character: dialogue" or "character (paren): dialogue"
  const casualDialogueRegex = /^([a-zA-Z0-9\s_'.-]+?)(?:\s*\((.+?)\))?\s*:\s*(.+)$/;
  // Match informal scene heading without period or dashes: e.g. "ext bus stop evening"
  const casualHeadingRegex = /^(INT|EXT|INT\/EXT|EXT\/INT)\s+([^-\n]+?)(?:\s*[-—]\s*|\s+)(DAY|NIGHT|EVENING|DAWN|DUSK|AFTERNOON|MORNING)$/i;

  for (let i = 0; i < lines.length; i++) {
    const raw = lines[i];
    const trimmed = raw.trim();

    if (!trimmed) {
      if (formatted.length > 0 && formatted[formatted.length - 1] !== '') {
        formatted.push('');
      }
      continue;
    }

    // 1. Casual Heading match
    const headingMatch = trimmed.match(casualHeadingRegex);
    if (headingMatch) {
      const env = headingMatch[1].toUpperCase() + '.';
      const loc = headingMatch[2].toUpperCase().trim();
      const time = headingMatch[3].toUpperCase().trim();
      formatted.push(`${env} ${loc} - ${time}`);
      formatted.push('');
      continue;
    }

    // 2. Casual Dialogue match
    const dialogueMatch = trimmed.match(casualDialogueRegex);
    if (dialogueMatch) {
      const charName = dialogueMatch[1].trim().toUpperCase();
      const paren = dialogueMatch[2]?.trim();
      const text = dialogueMatch[3]?.trim();

      formatted.push(charName);
      if (paren) {
        formatted.push(`(${paren})`);
      }
      if (text) {
        formatted.push(text);
      }
      formatted.push('');
      continue;
    }

    // 3. Keep existing valid screenplay elements or clean capitalized headings
    if (trimmed.startsWith('INT.') || trimmed.startsWith('EXT.') || trimmed.startsWith('INT/EXT.')) {
      formatted.push(trimmed.toUpperCase());
      formatted.push('');
      continue;
    }

    if (trimmed.toUpperCase().endsWith('CUT TO:') || trimmed.toUpperCase().startsWith('FADE IN:')) {
      formatted.push(trimmed.toUpperCase());
      formatted.push('');
      continue;
    }

    // Regular action sentence
    formatted.push(trimmed);
  }

  return formatted.join('\n').replace(/\n{3,}/g, '\n\n').trim();
}
