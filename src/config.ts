/**
 * Gestion de la configuration (config.env + skills)
 */

import * as fs from 'fs';
import * as path from 'path';
import { TelebotConfig, SkillsConfig, UserSkill } from './types';
import { getHomeDir } from './platform';

// Paths
export const TELEBOT_DIR = process.env.TELEBOT_DIR || path.join(getHomeDir(), '.telebot');
export const CONFIG_FILE = path.join(TELEBOT_DIR, 'config.env');
export const CLAUDE_DIR = path.join(TELEBOT_DIR, '.claude');
export const SKILLS_DIR = path.join(CLAUDE_DIR, 'skills');
export const SKILLS_CONFIG = path.join(CLAUDE_DIR, 'skills.json');
export const USER_CONTEXT = path.join(TELEBOT_DIR, 'CLAUDE.md');
const SETTINGS_FILE = path.join(CLAUDE_DIR, 'settings.json');
const SETTINGS_DEFAULT = path.join(TELEBOT_DIR, 'settings.json.default');

export function loadConfig(): TelebotConfig {
  const config: Record<string, string> = {};

  if (fs.existsSync(CONFIG_FILE)) {
    const content = fs.readFileSync(CONFIG_FILE, 'utf8');
    content.split('\n').forEach(line => {
      line = line.trim();
      if (line && !line.startsWith('#') && line.includes('=')) {
        const [key, ...vals] = line.split('=');
        config[key.trim()] = vals.join('=').trim();
      }
    });
  }

  return {
    TELEGRAM_BOT_TOKEN: config.TELEGRAM_BOT_TOKEN || '',
    TELEGRAM_USER_ID: config.TELEGRAM_USER_ID || undefined,
    SETUP_CODE: config.SETUP_CODE || undefined,
  };
}

/**
 * Ensures .claude/settings.json exists.
 * Copies from settings.json.default if missing.
 */
export function ensureSettings(): void {
  if (fs.existsSync(SETTINGS_FILE)) return;

  if (!fs.existsSync(CLAUDE_DIR)) {
    fs.mkdirSync(CLAUDE_DIR, { recursive: true });
  }

  if (fs.existsSync(SETTINGS_DEFAULT)) {
    fs.copyFileSync(SETTINGS_DEFAULT, SETTINGS_FILE);
    console.log(`✅ Permissions créées: ${SETTINGS_FILE}`);
  } else {
    console.warn(`⚠️  settings.json.default introuvable: ${SETTINGS_DEFAULT}`);
  }
}

export function saveUserId(uid: string): boolean {
  try {
    if (!fs.existsSync(CONFIG_FILE)) {
      console.error(`❌ Fichier config introuvable: ${CONFIG_FILE}`);
      return false;
    }

    let content = fs.readFileSync(CONFIG_FILE, 'utf8');

    if (content.match(/^TELEGRAM_USER_ID=/m)) {
      content = content.replace(/^TELEGRAM_USER_ID=.*/m, `TELEGRAM_USER_ID=${uid}`);
    } else {
      content += `\nTELEGRAM_USER_ID=${uid}`;
    }

    fs.writeFileSync(CONFIG_FILE, content);
    console.log(`✅ User ID enregistré: ${uid}`);

    const verify = fs.readFileSync(CONFIG_FILE, 'utf8');
    if (verify.includes(`TELEGRAM_USER_ID=${uid}`)) {
      console.log('✅ Vérification OK');
      return true;
    } else {
      console.error('❌ Échec de vérification');
      return false;
    }
  } catch (err) {
    console.error(`❌ Erreur saveUserId: ${(err as Error).message}`);
    return false;
  }
}

export function clearSetupCode(): boolean {
  try {
    if (!fs.existsSync(CONFIG_FILE)) return false;

    let content = fs.readFileSync(CONFIG_FILE, 'utf8');
    content = content.replace(/^SETUP_CODE=.*\n?/m, '');
    content = content.replace(/\n$/g, '') + '\n';

    fs.writeFileSync(CONFIG_FILE, content);
    console.log('✅ Code de setup supprimé');
    return true;
  } catch (err) {
    console.error(`❌ Erreur clearSetupCode: ${(err as Error).message}`);
    return false;
  }
}

// Skills management

export function loadSkillsConfig(): SkillsConfig {
  if (!fs.existsSync(SKILLS_CONFIG)) {
    return { skills: [] };
  }
  try {
    const content = fs.readFileSync(SKILLS_CONFIG, 'utf8');
    return JSON.parse(content);
  } catch {
    return { skills: [] };
  }
}

export function saveSkillsConfig(config: SkillsConfig): boolean {
  try {
    if (!fs.existsSync(CLAUDE_DIR)) {
      fs.mkdirSync(CLAUDE_DIR, { recursive: true });
    }
    fs.writeFileSync(SKILLS_CONFIG, JSON.stringify(config, null, 2));
    return true;
  } catch {
    return false;
  }
}

export function readSkillContent(skillName: string): string | null {
  const skillFile = path.join(SKILLS_DIR, skillName, 'SKILL.md');
  if (!fs.existsSync(skillFile)) {
    const legacyFile = path.join(SKILLS_DIR, `${skillName}.md`);
    if (fs.existsSync(legacyFile)) {
      return fs.readFileSync(legacyFile, 'utf8');
    }
    return null;
  }
  return fs.readFileSync(skillFile, 'utf8');
}

export function buildInjectedContext(): string {
  const parts: string[] = [];

  // Contexte utilisateur
  if (fs.existsSync(USER_CONTEXT)) {
    parts.push(fs.readFileSync(USER_CONTEXT, 'utf8'));
  }

  // Skills actifs
  const config = loadSkillsConfig();
  const activeSkills = config.skills.filter(s => s.enabled);

  if (activeSkills.length > 0) {
    parts.push('\n---\n\n# Skills actifs\n');
    for (const skill of activeSkills) {
      const content = readSkillContent(skill.name);
      if (content) {
        parts.push(`\n## /${skill.name}\n\n${content}`);
      }
    }
  }

  return parts.join('\n');
}
