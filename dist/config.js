"use strict";
/**
 * Gestion de la configuration (config.env + skills)
 */
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.USER_CONTEXT = exports.SKILLS_CONFIG = exports.SKILLS_DIR = exports.CLAUDE_DIR = exports.CONFIG_FILE = exports.TELEBOT_DIR = void 0;
exports.loadConfig = loadConfig;
exports.saveUserId = saveUserId;
exports.clearSetupCode = clearSetupCode;
exports.loadSkillsConfig = loadSkillsConfig;
exports.saveSkillsConfig = saveSkillsConfig;
exports.readSkillContent = readSkillContent;
exports.buildInjectedContext = buildInjectedContext;
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const platform_1 = require("./platform");
// Paths
exports.TELEBOT_DIR = process.env.TELEBOT_DIR || path.join((0, platform_1.getHomeDir)(), '.telebot');
exports.CONFIG_FILE = path.join(exports.TELEBOT_DIR, 'config.env');
exports.CLAUDE_DIR = path.join(exports.TELEBOT_DIR, '.claude');
exports.SKILLS_DIR = path.join(exports.CLAUDE_DIR, 'skills');
exports.SKILLS_CONFIG = path.join(exports.CLAUDE_DIR, 'skills.json');
exports.USER_CONTEXT = path.join(exports.TELEBOT_DIR, 'CLAUDE.md');
function loadConfig() {
    const config = {};
    if (fs.existsSync(exports.CONFIG_FILE)) {
        const content = fs.readFileSync(exports.CONFIG_FILE, 'utf8');
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
function saveUserId(uid) {
    try {
        if (!fs.existsSync(exports.CONFIG_FILE)) {
            console.error(`❌ Fichier config introuvable: ${exports.CONFIG_FILE}`);
            return false;
        }
        let content = fs.readFileSync(exports.CONFIG_FILE, 'utf8');
        if (content.match(/^TELEGRAM_USER_ID=/m)) {
            content = content.replace(/^TELEGRAM_USER_ID=.*/m, `TELEGRAM_USER_ID=${uid}`);
        }
        else {
            content += `\nTELEGRAM_USER_ID=${uid}`;
        }
        fs.writeFileSync(exports.CONFIG_FILE, content);
        console.log(`✅ User ID enregistré: ${uid}`);
        const verify = fs.readFileSync(exports.CONFIG_FILE, 'utf8');
        if (verify.includes(`TELEGRAM_USER_ID=${uid}`)) {
            console.log('✅ Vérification OK');
            return true;
        }
        else {
            console.error('❌ Échec de vérification');
            return false;
        }
    }
    catch (err) {
        console.error(`❌ Erreur saveUserId: ${err.message}`);
        return false;
    }
}
function clearSetupCode() {
    try {
        if (!fs.existsSync(exports.CONFIG_FILE))
            return false;
        let content = fs.readFileSync(exports.CONFIG_FILE, 'utf8');
        content = content.replace(/^SETUP_CODE=.*\n?/m, '');
        content = content.replace(/\n$/g, '') + '\n';
        fs.writeFileSync(exports.CONFIG_FILE, content);
        console.log('✅ Code de setup supprimé');
        return true;
    }
    catch (err) {
        console.error(`❌ Erreur clearSetupCode: ${err.message}`);
        return false;
    }
}
// Skills management
function loadSkillsConfig() {
    if (!fs.existsSync(exports.SKILLS_CONFIG)) {
        return { skills: [] };
    }
    try {
        const content = fs.readFileSync(exports.SKILLS_CONFIG, 'utf8');
        return JSON.parse(content);
    }
    catch {
        return { skills: [] };
    }
}
function saveSkillsConfig(config) {
    try {
        if (!fs.existsSync(exports.CLAUDE_DIR)) {
            fs.mkdirSync(exports.CLAUDE_DIR, { recursive: true });
        }
        fs.writeFileSync(exports.SKILLS_CONFIG, JSON.stringify(config, null, 2));
        return true;
    }
    catch {
        return false;
    }
}
function readSkillContent(skillName) {
    const skillFile = path.join(exports.SKILLS_DIR, skillName, 'SKILL.md');
    if (!fs.existsSync(skillFile)) {
        const legacyFile = path.join(exports.SKILLS_DIR, `${skillName}.md`);
        if (fs.existsSync(legacyFile)) {
            return fs.readFileSync(legacyFile, 'utf8');
        }
        return null;
    }
    return fs.readFileSync(skillFile, 'utf8');
}
function buildInjectedContext() {
    const parts = [];
    // Contexte utilisateur
    if (fs.existsSync(exports.USER_CONTEXT)) {
        parts.push(fs.readFileSync(exports.USER_CONTEXT, 'utf8'));
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
