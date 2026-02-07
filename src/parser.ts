/**
 * Parsing des réponses Claude et détection de permissions
 */

import { cleanResponse } from './utils';
import { AskUserQuestionInfo, AskOption } from './types';

// Patterns de progression Claude à ignorer
export const PROGRESS_PATTERNS: RegExp[] = [
  // ===== APPELS D'OUTILS =====
  /^Write\s*\(/i,
  /^Read\s*\(/i,
  /^Edit\s*\(/i,
  /^Bash\s*\(/i,
  /^Grep\s*\(/i,
  /^Glob\s*\(/i,
  /^Task\s*\(/i,
  /^WebFetch\s*\(/i,
  /^WebSearch\s*\(/i,
  /^TodoWrite\s*\(/i,
  /^TodoRead\s*\(/i,
  /^NotebookEdit\s*\(/i,

  // ===== RÉSULTATS D'OUTILS =====
  /^⎿/,
  /^…\s*\+\d+\s*lines/i,
  /^\.\.\.\s*\+\d+/i,

  // ===== MESSAGES DE PROGRESSION =====
  // Opérations fichiers
  /^Read \d+ files?/i,
  /^Reading /i,
  /^Wrote \d+ files?/i,
  /^Wrote to /i,
  /^Writing /i,
  /^Edit \d+ files?/i,
  /^Edited /i,
  /^Editing /i,
  /^Created /i,
  /^Creating /i,
  /^Deleted /i,
  /^Deleting /i,
  // Recherche
  /^Searching /i,
  /^Search(ed)? (for )?\d+/i,
  /^Found \d+/i,
  /^Glob /i,
  /^Grep /i,
  // Exécution
  /^Ran /i,
  /^Running /i,
  /^Executing /i,
  // Interface Claude
  /^\(ctrl\+/i,
  /^Update Todos/i,
  /^Task /i,
  /^Thinking/i,
  /^Processing/i,
  // Agents et outils
  /^Agent /i,
  /^Tool /i,
  /^Bash /i,
  /^WebFetch/i,
  /^WebSearch/i,
  // Plan mode
  /^Entered plan mode/i,
  /^Exited plan mode/i,
  /^Claude is now exploring/i,
];

export function isProgressMessage(text: string): boolean {
  const trimmed = text.trim();
  if (trimmed.length < 3) return true;
  return PROGRESS_PATTERNS.some(pattern => pattern.test(trimmed));
}

export function isValidResponse(text: string): boolean {
  const trimmed = text.trim();
  if (trimmed.length < 5) return false;
  if (/^[\s\p{Emoji}\p{P}]+$/u.test(trimmed)) return false;
  return !isProgressMessage(trimmed);
}

// Regex matching Claude Code response markers (⏺ older versions, ● v2.1+)
const RESPONSE_MARKER = /[⏺●]/;

export function extractResponses(text: string): string[] {
  const responses: string[] = [];
  let current: string[] = [];
  let inResp = false;

  text.split('\n').forEach(line => {
    if (RESPONSE_MARKER.test(line)) {
      if (current.length) {
        const cleaned = cleanResponse(current.join('\n'));
        if (cleaned && isValidResponse(cleaned)) {
          responses.push(cleaned);
        }
      }
      const afterMarker = line.split(RESPONSE_MARKER)[1]?.trim() || '';
      if (isProgressMessage(afterMarker)) {
        current = [];
        inResp = false;
      } else {
        current = [afterMarker];
        inResp = true;
      }
    } else if (inResp && (line.includes('❯') || line.startsWith('─────'))) {
      if (current.length) {
        const cleaned = cleanResponse(current.join('\n'));
        if (cleaned && isValidResponse(cleaned)) {
          responses.push(cleaned);
        }
      }
      current = [];
      inResp = false;
    } else if (inResp) {
      current.push(line);
    }
  });

  if (current.length) {
    const cleaned = cleanResponse(current.join('\n'));
    if (cleaned && isValidResponse(cleaned)) {
      responses.push(cleaned);
    }
  }

  return [...new Set(responses)];
}

export interface PermissionInfo {
  hash: string;
  context: string;
}

export function detectPermission(text: string): PermissionInfo | null {
  // Filter trailing empty lines before taking last 30
  const lines = text.split('\n').filter(l => l.trim() !== '');
  const last = lines.slice(-30).join('\n');
  // Strip spinner characters for stable matching
  const clean = last.replace(/[⠋⠙⠹⠸⠼⠴⠦⠧⠇⠏◐◓◑◒]/g, '');

  const isPerm =
    clean.includes('Do you want to proceed?') ||
    clean.includes('want to run') ||
    /\d+\.\s*(Yes|No|Oui|Non)/i.test(clean);

  const isAllow = clean.includes('Allow');
  const isYN = /\(y\/n\)|\(yes\/no\)/i.test(clean);

  if (!isPerm && !isAllow && !isYN) return null;

  // Extract command context from permission dialog
  const cleanLines = clean.split('\n').map(l => l.trim()).filter(
    l => l !== '' && !/^[─━═]+$/.test(l)
  );
  let context = '';

  for (let i = 0; i < cleanLines.length; i++) {
    const line = cleanLines[i];
    if (
      line.includes('Do you want to proceed?') ||
      line.includes('Allow') ||
      line.includes('want to run') ||
      /\(y\/n\)/i.test(line)
    ) {
      // Take the lines before the question as context (command info)
      const ctxLines = cleanLines.slice(Math.max(0, i - 4), i).filter(
        l => !l.startsWith('Esc ') && !l.startsWith('❯') && !l.match(/^\d+\./) && !/^[─━═]+$/.test(l)
      );
      context = ctxLines.join('\n');
      break;
    }
  }

  // Stable hash based on context (not raw text that may contain animations)
  const hash = `perm:${context.slice(0, 200)}`;
  return { hash, context };
}

// ===== PLAN MODE DETECTION =====

export function detectPlanMode(text: string): 'entered' | 'exited' | null {
  const lines = text.split('\n');
  const last = lines.slice(-40);

  for (let i = last.length - 1; i >= 0; i--) {
    const line = last[i].trim();
    if (/Entered plan mode/i.test(line)) return 'entered';
    if (/Exited plan mode/i.test(line)) return 'exited';
  }
  return null;
}

// ===== ASK USER QUESTION DETECTION =====

export function detectAskUserQuestion(text: string): AskUserQuestionInfo | null {
  const lines = text.split('\n');

  // Find footer: "Enter to select · ↑/↓ to navigate"
  const footerIdx = lines.findIndex(l =>
    l.includes('Enter to select') && l.includes('to navigate')
  );
  if (footerIdx === -1) return null;

  // Find ☐ header (search backwards from footer)
  let headerIdx = -1;
  for (let i = footerIdx - 1; i >= 0; i--) {
    if (/☐/.test(lines[i])) {
      headerIdx = i;
      break;
    }
  }
  if (headerIdx === -1) return null;

  const header = lines[headerIdx].replace(/.*☐\s*/, '').trim();

  // Find first numbered option
  let firstOptIdx = -1;
  for (let i = headerIdx + 1; i < footerIdx; i++) {
    if (/^\s*[❯]?\s*\d+\.\s/.test(lines[i])) {
      firstOptIdx = i;
      break;
    }
  }
  if (firstOptIdx === -1) return null;

  // Extract question text (between header and first option)
  const questionLines = lines.slice(headerIdx + 1, firstOptIdx).filter(l => l.trim());
  const question = questionLines.join('\n').trim();
  if (!question) return null;

  // Extract options (stop at separator ────)
  const options: AskOption[] = [];
  let cursorPos = 1;
  let i = firstOptIdx;

  while (i < footerIdx) {
    const line = lines[i];

    // Stop at separator line
    if (/^[─\s]{3,}$/.test(line.trim()) && line.includes('────')) break;

    const optMatch = line.match(/^\s*([❯])?\s*(\d+)\.\s+(.+)/);
    if (optMatch) {
      const num = parseInt(optMatch[2]);
      const isSelected = optMatch[1] === '❯';
      const label = optMatch[3].trim();

      if (isSelected) cursorPos = num;

      // Skip "Type something" (it's the auto-added "Other" option)
      if (/^type something/i.test(label)) {
        i++;
        continue;
      }

      // Check for description on next line (indented, not another option)
      let description = '';
      if (i + 1 < footerIdx) {
        const nextLine = lines[i + 1];
        if (/^\s{4,}/.test(nextLine) && !/^\s*[❯]?\s*\d+\./.test(nextLine)) {
          description = nextLine.trim();
          i++;
        }
      }

      options.push({ num, label, description });
    }
    i++;
  }

  if (options.length === 0) return null;

  // Check if "Type something" option exists
  const hasTypeOption = lines.slice(firstOptIdx, footerIdx).some(l =>
    /\d+\.\s+Type something/i.test(l)
  );

  return { header, question, options, hasTypeOption, cursorPos };
}
