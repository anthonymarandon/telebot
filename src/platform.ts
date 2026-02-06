/**
 * Compatibilité cross-platform (macOS, Linux, Windows)
 */

import * as os from 'os';
import { execSync } from 'child_process';

export type Platform = 'darwin' | 'linux' | 'win32';

export const PLATFORM: Platform = process.platform as Platform;
export const IS_WINDOWS = PLATFORM === 'win32';
export const IS_MAC = PLATFORM === 'darwin';
export const IS_LINUX = PLATFORM === 'linux';

export function getHomeDir(): string {
  return process.env.HOME || process.env.USERPROFILE || os.homedir();
}

export function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export function killBotProcesses(): void {
  try {
    if (IS_WINDOWS) {
      execSync('taskkill /F /IM node.exe /FI "WINDOWTITLE eq bot.js" 2>nul', { stdio: 'ignore' });
    } else {
      // Use pgrep to find PIDs, then filter out our own PID to avoid self-kill
      const result = execSync('pgrep -f "node.*bot\\.js" 2>/dev/null || true', {
        encoding: 'utf8',
      });
      const myPid = String(process.pid);
      const pids = result
        .trim()
        .split('\n')
        .map(p => p.trim())
        .filter(p => p && p !== myPid);

      for (const pid of pids) {
        try {
          process.kill(parseInt(pid), 'SIGTERM');
        } catch {}
      }
    }
  } catch {}
}
