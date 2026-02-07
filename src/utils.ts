/**
 * Fonctions utilitaires
 */

export function stripAnsi(text: string): string {
  return text
    .replace(/\x1b\[[0-9;]*[a-zA-Z]/g, '')
    .replace(/\x1b\].*?(\x07|\x1b\\)/g, '')
    .replace(/[\x00-\x08\x0b\x0c\x0e-\x1f\x7f]/g, '');
}

export function escapeHtml(text: string): string {
  return text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

/**
 * Split a message into chunks that fit Telegram's limit.
 * When wrapPre is true, each chunk is wrapped in <pre>...</pre> and split by lines.
 */
export function splitMessage(text: string, maxLen = 4000, wrapPre = false): string[] {
  if (wrapPre) {
    // Reserve space for <pre> and </pre> tags (11 chars)
    const effectiveMax = maxLen - 11;
    const lines = text.split('\n');
    const chunks: string[] = [];
    let current = '';

    for (const line of lines) {
      if (current.length + line.length + 1 > effectiveMax && current) {
        chunks.push('<pre>' + current + '</pre>');
        current = line;
      } else {
        current += (current ? '\n' : '') + line;
      }
    }

    if (current) chunks.push('<pre>' + current + '</pre>');
    return chunks;
  }

  if (text.length <= maxLen) return [text];

  const chunks: string[] = [];
  let current = '';

  text.split('\n\n').forEach(para => {
    if ((current + para).length + 2 > maxLen) {
      if (current) chunks.push(current.trim());
      current = para;
    } else {
      current += (current ? '\n\n' : '') + para;
    }
  });

  if (current) chunks.push(current.trim());
  return chunks;
}

export function isAuthorized(uid: number | string, allowedUserId: string): boolean {
  return !allowedUserId || String(uid) === allowedUserId;
}
