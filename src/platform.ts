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
      execSync('pkill -f "node.*bot\\.js" 2>/dev/null || true', { stdio: 'ignore' });
    }
  } catch {}
}
