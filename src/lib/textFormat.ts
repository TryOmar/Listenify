// Utility to format transcript text with sentence-based line breaks
export function formatTranscriptWithLineBreaks(
  text: string,
  breakSentences: boolean,
  lineBreakStyle: 'single' | 'double'
): string {
  if (!breakSentences) return text;
  const breakChar = lineBreakStyle === 'single' ? '\n' : '\n\n';
  // Split by sentence endings (.!?) but keep the punctuation
  // Handles abbreviations and numbers naively, but works for most cases
  return text.replace(/([.!?])\s+/g, `$1${breakChar}`);
} 