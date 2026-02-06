#!/usr/bin/env node
"use strict";
/**
 * Telebot - Bot Telegram pour Claude Code via tmux
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const node_telegram_bot_api_1 = __importDefault(require("node-telegram-bot-api"));
const config_1 = require("./config");
const tmux_1 = require("./tmux");
const parser_1 = require("./parser");
const utils_1 = require("./utils");
const commands_1 = require("./commands");
const fs_1 = require("fs");
const path_1 = __importDefault(require("path"));
const platform_1 = require("./platform");
// Constants
const POLL_INTERVAL = 500;
const STABILITY = 2;
const PID_FILE = path_1.default.join(config_1.TELEBOT_DIR, 'bot.pid');
// ===== PROTECTION INSTANCE UNIQUE =====
async function ensureSingleInstance() {
    (0, platform_1.killBotProcesses)();
    await (0, platform_1.sleep)(500);
    (0, fs_1.writeFileSync)(PID_FILE, process.pid.toString());
    const cleanup = () => {
        try {
            if ((0, fs_1.existsSync)(PID_FILE)) {
                const savedPid = (0, fs_1.readFileSync)(PID_FILE, 'utf8').trim();
                if (savedPid === process.pid.toString()) {
                    (0, fs_1.unlinkSync)(PID_FILE);
                }
            }
        }
        catch { }
    };
    process.on('exit', cleanup);
    process.on('SIGINT', () => { cleanup(); process.exit(0); });
    process.on('SIGTERM', () => { cleanup(); process.exit(0); });
}
// ===== MAIN =====
async function main() {
    await ensureSingleInstance();
    console.log(`🔒 Instance unique (PID ${process.pid})`);
    (0, config_1.ensureSettings)();
    const config = (0, config_1.loadConfig)();
    const TOKEN = config.TELEGRAM_BOT_TOKEN;
    if (!TOKEN) {
        console.error(`❌ TELEGRAM_BOT_TOKEN manquant dans ${config_1.CONFIG_FILE}`);
        process.exit(1);
    }
    // Application state
    const state = {
        chatId: null,
        sentResponses: new Set(),
        lastPermHash: null,
        isYoloMode: false,
        userId: config.TELEGRAM_USER_ID || '',
        setupCode: config.SETUP_CODE || '',
    };
    // Monitoring state
    const monitoring = {
        previous: '',
        stable: 0,
        processed: false,
        synced: false,
        lastTyping: 0,
    };
    const bot = new node_telegram_bot_api_1.default(TOKEN, { polling: true });
    bot.on('polling_error', err => {
        console.error('Erreur polling Telegram:', err.message);
    });
    const ctx = {
        bot,
        state,
        monitoring,
        config,
    };
    const commands = [
        { command: 'start', description: 'Démarrer le bot' },
        { command: 'config', description: 'Configurer le bot' },
        { command: 'restart', description: 'Redémarrer Claude' },
        { command: 'yolo', description: 'Mode sans permissions ⚡' },
        { command: 'stop', description: 'Arrêter la session Claude' },
        { command: 'help', description: 'Aide' },
    ];
    bot.setMyCommands(commands);
    console.log(`Config: ${config_1.CONFIG_FILE}`);
    console.log('Bot démarré');
    // Command handlers
    bot.onText(/\/start/, msg => (0, commands_1.handleStart)(msg, ctx));
    bot.onText(/\/restart/, msg => (0, commands_1.handleRestart)(msg, ctx));
    bot.onText(/\/yolo/, msg => (0, commands_1.handleYolo)(msg, ctx));
    bot.onText(/\/stop/, msg => (0, commands_1.handleStop)(msg, ctx));
    bot.onText(/\/help/, msg => (0, commands_1.handleHelp)(msg, ctx));
    bot.onText(/\/config/, msg => (0, commands_1.handleConfig)(msg, ctx));
    bot.on('message', msg => (0, commands_1.handleMessage)(msg, ctx));
    // Monitoring loop
    setInterval(async () => {
        try {
            if (!state.chatId || !(0, tmux_1.tmuxExists)()) {
                monitoring.synced = false;
                return;
            }
            const current = (0, tmux_1.tmuxRead)();
            // Initial sync
            if (!monitoring.synced) {
                (0, parser_1.extractResponses)(current).forEach(r => state.sentResponses.add((0, utils_1.normalizeForComparison)(r)));
                monitoring.synced = true;
                monitoring.previous = current;
                return;
            }
            // Permission detection - runs on every iteration (independent of stability)
            if (!state.isYoloMode) {
                const perm = (0, parser_1.detectPermission)(current);
                if (perm && state.lastPermHash === null) {
                    state.lastPermHash = 'sent';
                    const ctxBlock = perm.context ? `\`\`\`\n${perm.context}\n\`\`\`\n\n` : '';
                    bot.sendMessage(state.chatId, '🔐 *Autorisation requise*\n\n' +
                        ctxBlock +
                        '*Réponds avec :*\n' +
                        '`1` → Oui (juste cette fois)\n' +
                        '`2` → Oui, toujours\n' +
                        '`3` → Non', { parse_mode: 'Markdown' });
                }
                else if (!perm && state.lastPermHash !== null) {
                    // Permission dialog gone (user responded) - reset for next one
                    state.lastPermHash = null;
                }
            }
            // Content changed
            if (current !== monitoring.previous) {
                monitoring.stable = 0;
                monitoring.processed = false;
                monitoring.previous = current;
                const now = Date.now();
                if (now - monitoring.lastTyping > 4000) {
                    bot.sendChatAction(state.chatId, 'typing').catch(() => { });
                    monitoring.lastTyping = now;
                }
                return;
            }
            monitoring.stable++;
            // Stable = process responses
            if (monitoring.stable === STABILITY && !monitoring.processed) {
                monitoring.processed = true;
                const responses = (0, parser_1.extractResponses)(current);
                if (responses.length === 0 && current.length > 50) {
                    const hasMarker = current.includes('⏺');
                    const hasPrompt = current.includes('❯');
                    console.log(`[monitoring] Contenu stable (${current.length} chars), 0 réponses extraites. Marqueur ⏺: ${hasMarker}, Prompt ❯: ${hasPrompt}`);
                }
                for (const resp of responses) {
                    const normalized = (0, utils_1.normalizeForComparison)(resp);
                    if (resp && !state.sentResponses.has(normalized)) {
                        state.sentResponses.add(normalized);
                        for (const chunk of (0, utils_1.splitMessage)(resp)) {
                            try {
                                await bot.sendMessage(state.chatId, chunk);
                            }
                            catch (e) {
                                console.error('Erreur envoi:', e.message);
                            }
                        }
                    }
                }
            }
        }
        catch (err) {
            console.error('Erreur monitoring:', err.message);
        }
    }, POLL_INTERVAL);
}
main().catch(err => {
    console.error('❌ Erreur fatale:', err);
    process.exit(1);
});
