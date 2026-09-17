/**
 * Convert plain text content to HTML paragraphs.
 * Content in DB uses \n (newline) as paragraph separator.
 * Also handles content that already has HTML tags.
 */
export function contentToHtml(content: string): string {
  if (!content) return '';

  // If content already has HTML tags (<p>, <h1>, <br>, etc.), return as-is
  if (/<[a-z][\s\S]*>/i.test(content)) {
    return content;
  }

  // Split by newlines, wrap non-empty lines in <p> tags
  const paragraphs = content
    .split(/\n/)
    .map(line => line.trim())
    .filter(line => line.length > 0);

  if (paragraphs.length === 0) return content;

  return paragraphs
    .map(p => `<p style="margin-bottom: 1em; text-indent: 2em;">${p}</p>`)
    .join('');
}
