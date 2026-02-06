/**
 * Opérations tmux pour contrôler Claude Code
 */

import { execSync } from 'child_process';
import { existsSync, writeFileSync, unlinkSync } from 'fs';
import { join } from 'path';
import { stripAnsi } from './utils';
import { buildInjectedContext, TELEBOT_DIR } from './config';

export const TMUX_SESSION = 'claude';
const CONTEXT_FILE = join(TELEBOT_DIR, '.context.md');

export function tmuxExists(): boolean {
  try {
    execSync(`tmux has-session -t ${TMUX_SESSION} 2>/dev/null`);
    return true;
  } catch {
    return false;
  }
}

export function tmuxKillAll(): void {
  try {
    const sessions = execSync('tmux list-sessions -F "#{session_name}" 2>/dev/null', {
      encoding: 'utf8',
    });
    sessions
      .split('\n')
      .filter(s => s.includes('claude'))
      .forEach(session => {
        try {
          execSync(`tmux kill-session -t ${session}`);
        } catch {}
      });
  } catch {}
}

export function tmuxCreate(yoloMode = false): void {
  tmuxKillAll();
  execSync(`tmux new-session -d -s ${TMUX_SESSION} -x 200 -y 50`);

  const context = buildInjectedContext();
  let systemPromptArg = '';

  if (context.trim()) {
    writeFileSync(CONTEXT_FILE, context);
    systemPromptArg = ` --system-prompt "${CONTEXT_FILE}"`;
  }

  const envVars = 'CLAUDE_CODE_ENABLE_PROMPT_SUGGESTION=false';
  const claudeCmd = yoloMode ? 'claude --dangerously-skip-permissions' : 'claude';
  const cmd = `${envVars} ${claudeCmd}${systemPromptArg}`;
  execSync(`tmux send-keys -t ${TMUX_SESSION} '${cmd}' Enter`);
}

export function cleanupContext(): void {
  if (existsSync(CONTEXT_FILE)) {
    try {
      unlinkSync(CONTEXT_FILE);
    } catch {}
  }
}

export function tmuxSend(text: string): void {
  const escaped = text.replace(/'/g, "'\\''");
  execSync(`tmux send-keys -t ${TMUX_SESSION} -l '${escaped}'`);
  execSync(`tmux send-keys -t ${TMUX_SESSION} Enter`);
}

export function tmuxRead(): string {
  try {
    const output = execSync(`tmux capture-pane -t ${TMUX_SESSION} -p -S -100`, {
      encoding: 'utf8',
    });
    return stripAnsi(output);
  } catch {
    return '';
  }
}

/**
 * Attend que Claude soit prêt (prompt ❯ détecté dans tmux)
 * Timeout après maxWait ms, polling toutes les interval ms
 */
export async function waitForClaude(maxWait = 30000, interval = 500): Promise<boolean> {
  const start = Date.now();
  while (Date.now() - start < maxWait) {
    const content = tmuxRead();
    if (content.includes('❯')) {
      return true;
    }
    await new Promise(r => setTimeout(r, interval));
  }
  return false;
}
