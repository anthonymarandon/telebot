/**
 * Parsing des réponses Claude et détection d'état terminal
 *
 * Architecture : on détecte l'état de Claude en analysant les dernières lignes
 * du terminal tmux. Le contenu est envoyé par diff (nouvelles lignes uniquement).
 */

import { ClaudeState, AskUserQuestionInfo, AskOption } from './types';

// Prompt marker: Claude is idle and waiting for input
const PROMPT_MARKER = '❯';

// Spinner characters (indicate Claude is working)
const SPINNER_CHARS = /[⠋⠙⠹⠸⠼⠴⠦⠧⠇⠏◐◓◑◒]/;

// Response markers (used in detectState for idle detection)
const RESPONSE_MARKER = /[⏺●]/;

// ===== STATE DETECTION =====

/**
 * Detect Claude's current state by analyzing the last lines of the terminal.
 * Priority order: permission > asking > idle > working
 */
export function detectState(lines: string[]): ClaudeState {
  const last30 = lines.slice(-30);
  const joined = last30.join('\n');

  // 1. Permission dialog? (highest priority - needs user action)
  if (isPermissionDialog(joined)) return 'permission';

  // 2. AskUserQuestion? (interactive menu visible)
  if (isAskDialog(last30)) return 'asking';

  // 3. Idle? (prompt visible, Claude waiting for input)
  for (let i = lines.length - 1; i >= Math.max(0, lines.length - 5); i--) {
    const line = lines[i].trim();
    if (line === '') continue;
    if (line.includes(PROMPT_MARKER) && !RESPONSE_MARKER.test(line)) return 'idle';
    break;
  }

  // 4. Default: working
  return 'working';
}

/**
 * Detect if plan mode was entered or exited in new lines
 */
export function detectPlanChange(newLines: string[]): 'entered' | 'exited' | null {
  for (let i = newLines.length - 1; i >= 0; i--) {
    const line = newLines[i].trim();
    if (/Entered plan mode/i.test(line)) return 'entered';
    if (/Exited plan mode/i.test(line)) return 'exited';
  }
  return null;
}

// ===== TERMINAL CHROME TRIMMING =====

/**
 * Trim terminal "chrome" lines from the end of a diff block.
 * Removes trailing separators (───), empty prompt (❯), and hints (? for shortcuts).
 */
export function trimTerminalChrome(lines: string[]): string[] {
  const result = [...lines];

  while (result.length > 0) {
    const last = result[result.length - 1].trim();
    if (
      last === '' ||
      /^[─━═]+$/.test(last) ||
      last === PROMPT_MARKER ||
      /^\?\s+for shortcuts/i.test(last) ||
      /^Esc\s/i.test(last) ||
      SPINNER_CHARS.test(last) && last.replace(SPINNER_CHARS, '').trim() === ''
    ) {
      result.pop();
    } else {
      break;
    }
  }

  return result;
}

// ===== PERMISSION DETECTION =====

export interface PermissionInfo {
  hash: string;
  context: string;
}

function isPermissionDialog(text: string): boolean {
  const clean = text.replace(SPINNER_CHARS, '');
  return (
    clean.includes('Do you want to proceed?') ||
    clean.includes('want to run') ||
    /\d+\.\s*(Yes|No|Oui|Non)/i.test(clean) ||
    clean.includes('Allow') ||
    /\(y\/n\)|\(yes\/no\)/i.test(clean)
  );
}

export function extractPermission(lines: string[]): PermissionInfo | null {
  const last30 = lines.slice(-30).filter(l => l.trim() !== '');
  const joined = last30.join('\n');
  const clean = joined.replace(SPINNER_CHARS, '');

  if (!isPermissionDialog(clean)) return null;

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
      const ctxLines = cleanLines.slice(Math.max(0, i - 4), i).filter(
        l => !l.startsWith('Esc ') && !l.startsWith('❯') && !l.match(/^\d+\./) && !/^[─━═]+$/.test(l)
      );
      context = ctxLines.join('\n');
      break;
    }
  }

  const hash = `perm:${context.slice(0, 200)}`;
  return { hash, context };
}

// ===== ASK USER QUESTION DETECTION =====

function isAskDialog(lines: string[]): boolean {
  return lines.some(l => l.includes('Enter to select') && l.includes('to navigate'));
}

export function extractAskQuestion(lines: string[]): AskUserQuestionInfo | null {
  const footerIdx = lines.findIndex(l =>
    l.includes('Enter to select') && l.includes('to navigate')
  );
  if (footerIdx === -1) return null;

  let headerIdx = -1;
  for (let i = footerIdx - 1; i >= 0; i--) {
    if (/☐/.test(lines[i])) {
      headerIdx = i;
      break;
    }
  }
  if (headerIdx === -1) return null;

  const header = lines[headerIdx].replace(/.*☐\s*/, '').trim();

  let firstOptIdx = -1;
  for (let i = headerIdx + 1; i < footerIdx; i++) {
    if (/^\s*[❯]?\s*\d+\.\s/.test(lines[i])) {
      firstOptIdx = i;
      break;
    }
  }
  if (firstOptIdx === -1) return null;

  const questionLines = lines.slice(headerIdx + 1, firstOptIdx).filter(l => l.trim());
  const question = questionLines.join('\n').trim();
  if (!question) return null;

  const options: AskOption[] = [];
  let cursorPos = 1;
  let i = firstOptIdx;

  while (i < footerIdx) {
    const line = lines[i];
    if (/^[─\s]{3,}$/.test(line.trim()) && line.includes('────')) break;

    const optMatch = line.match(/^\s*([❯])?\s*(\d+)\.\s+(.+)/);
    if (optMatch) {
      const num = parseInt(optMatch[2]);
      const isSelected = optMatch[1] === '❯';
      const label = optMatch[3].trim();

      if (isSelected) cursorPos = num;

      if (/^type something/i.test(label)) { i++; continue; }

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

  const hasTypeOption = lines.slice(firstOptIdx, footerIdx).some(l =>
    /\d+\.\s+Type something/i.test(l)
  );

  return { header, question, options, hasTypeOption, cursorPos };
}
