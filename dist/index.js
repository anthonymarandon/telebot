#!/usr/bin/env node
"use strict";
/**
 * Telebot - Bot Telegram pour Claude Code via tmux
 *
 * Monitoring basé sur le diff terminal (screen-based) :
 * - On envoie directement les nouvelles lignes du terminal
 * - Machine à états : idle / working / permission / asking
 * - Déduplication par processedIndex (pas de Set)
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
        lastPermHash: null,
        lastAskQuestion: null,
        inPlanMode: false,
        isYoloMode: false,
        userId: config.TELEGRAM_USER_ID || '',
        setupCode: config.SETUP_CODE || '',
    };
    // Monitoring state
    const monitoring = {
        lastLines: [],
        processedIndex: 0,
        claudeState: 'idle',
        stable: 0,
        flushed: false,
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
        { command: 'screen', description: 'Voir le terminal' },
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
    bot.onText(/\/screen/, msg => (0, commands_1.handleScreen)(msg, ctx));
    bot.onText(/\/stop/, msg => (0, commands_1.handleStop)(msg, ctx));
    bot.onText(/\/help/, msg => (0, commands_1.handleHelp)(msg, ctx));
    bot.onText(/\/config/, msg => (0, commands_1.handleConfig)(msg, ctx));
    bot.on('message', msg => (0, commands_1.handleMessage)(msg, ctx));
    // ===== MONITORING LOOP =====
    setInterval(async () => {
        try {
            if (!state.chatId || !(0, tmux_1.tmuxExists)()) {
                monitoring.synced = false;
                return;
            }
            const rawFull = (0, tmux_1.tmuxRead)();
            // Strip trailing empty lines (tmux pads with empty lines to fill pane height)
            const currentLines = rawFull.split('\n');
            while (currentLines.length > 0 && currentLines[currentLines.length - 1].trim() === '') {
                currentLines.pop();
            }
            // --- Safety: reset processedIndex if buffer shifted ---
            if (monitoring.processedIndex > currentLines.length) {
                monitoring.processedIndex = currentLines.length;
            }
            // --- Initial sync: mark all existing content as already processed ---
            if (!monitoring.synced) {
                monitoring.lastLines = currentLines;
                monitoring.processedIndex = currentLines.length;
                monitoring.synced = true;
                monitoring.claudeState = (0, parser_1.detectState)(currentLines);
                return;
            }
            // --- Detect if content changed ---
            const currentJoined = currentLines.join('\n');
            const contentChanged = currentJoined !== monitoring.lastLines.join('\n');
            if (contentChanged) {
                monitoring.stable = 0;
                monitoring.flushed = false;
                monitoring.lastLines = currentLines;
                // Send typing indicator (throttled to every 4s)
                const now = Date.now();
                if (now - monitoring.lastTyping > 4000) {
                    bot.sendChatAction(state.chatId, 'typing').catch(() => { });
                    monitoring.lastTyping = now;
                }
            }
            else {
                monitoring.stable++;
            }
            // --- State detection (runs every cycle) ---
            const newState = (0, parser_1.detectState)(currentLines);
            const prevState = monitoring.claudeState;
            // --- Handle state transitions ---
            // Permission dialog appeared
            if (!state.isYoloMode && newState === 'permission' && prevState !== 'permission') {
                await flushScreenDiff(currentLines, monitoring, state, bot);
                const perm = (0, parser_1.extractPermission)(currentLines);
                if (perm && state.lastPermHash === null) {
                    state.lastPermHash = perm.hash;
                    const ctxBlock = perm.context ? `\`\`\`\n${perm.context}\n\`\`\`\n\n` : '';
                    bot.sendMessage(state.chatId, '🔐 *Autorisation requise*\n\n' +
                        ctxBlock +
                        '*Réponds avec :*\n' +
                        '`1` → Oui (juste cette fois)\n' +
                        '`2` → Oui, toujours\n' +
                        '`3` → Non', { parse_mode: 'Markdown' });
                }
            }
            // Permission dialog disappeared
            if (prevState === 'permission' && newState !== 'permission') {
                state.lastPermHash = null;
            }
            // AskUserQuestion appeared
            if (newState === 'asking' && prevState !== 'asking') {
                await flushScreenDiff(currentLines, monitoring, state, bot);
                const askQuestion = (0, parser_1.extractAskQuestion)(currentLines);
                if (askQuestion && state.lastAskQuestion === null) {
                    state.lastAskQuestion = askQuestion;
                    let optionsText = askQuestion.options
                        .map(o => {
                        const desc = o.description ? `\n     _${o.description}_` : '';
                        return `\`${o.num}\` → ${o.label}${desc}`;
                    })
                        .join('\n');
                    const freeText = askQuestion.hasTypeOption
                        ? '\n\n💬 _Ou envoie du texte libre pour répondre._'
                        : '';
                    bot.sendMessage(state.chatId, `❓ *${askQuestion.header}*\n\n` +
                        `${askQuestion.question}\n\n` +
                        `${optionsText}${freeText}`, { parse_mode: 'Markdown' });
                }
            }
            // AskUserQuestion disappeared
            if (prevState === 'asking' && newState !== 'asking') {
                state.lastAskQuestion = null;
            }
            // Plan mode changes (check new lines only)
            if (contentChanged) {
                const newLines = currentLines.slice(monitoring.processedIndex);
                const planChange = (0, parser_1.detectPlanChange)(newLines);
                if (planChange === 'entered' && !state.inPlanMode) {
                    await flushScreenDiff(currentLines, monitoring, state, bot);
                    state.inPlanMode = true;
                    bot.sendMessage(state.chatId, '📋 *Mode Plan activé*\n\n' +
                        'Claude explore et conçoit une approche d\'implémentation.\n' +
                        'Le plan s\'affichera quand il sera prêt.', { parse_mode: 'Markdown' });
                }
                else if (planChange === 'exited' && state.inPlanMode) {
                    state.inPlanMode = false;
                    bot.sendMessage(state.chatId, '✅ *Mode Plan terminé*\n\nClaude reprend l\'exécution.', { parse_mode: 'Markdown' });
                }
            }
            // Update state
            monitoring.claudeState = newState;
            // --- Flush screen diff when content is stable ---
            if (monitoring.stable === STABILITY && !monitoring.flushed) {
                await flushScreenDiff(currentLines, monitoring, state, bot);
            }
        }
        catch (err) {
            console.error('Erreur monitoring:', err.message);
        }
    }, POLL_INTERVAL);
}
/**
 * Send new terminal lines as HTML <pre> blocks.
 * Applies 3 levels of trimming:
 * 1. Terminal chrome (trailing separators, empty prompt, hints)
 * 2. Interactive dialogs (permission/asking - sent via formatted messages instead)
 * 3. User prompt echoes (leading ❯ lines - user already knows what they typed)
 */
async function flushScreenDiff(currentLines, monitoring, state, bot) {
    if (monitoring.flushed)
        return;
    monitoring.flushed = true;
    // Get new lines since last processing
    const newLines = currentLines.slice(monitoring.processedIndex);
    if (newLines.length === 0) {
        monitoring.processedIndex = currentLines.length;
        return;
    }
    // 1. Trim terminal chrome from end
    let trimmed = (0, parser_1.trimTerminalChrome)(newLines);
    // 2. Trim trailing interactive dialog (permission/asking)
    trimmed = (0, parser_1.trimTrailingDialog)(trimmed);
    // 3. Trim user prompt echoes from the beginning (❯ followed by text)
    while (trimmed.length > 0 && /^\s*❯\s+./.test(trimmed[0])) {
        trimmed.shift();
    }
    if (trimmed.length === 0) {
        monitoring.processedIndex = currentLines.length;
        return;
    }
    // Escape HTML and send as <pre> chunks
    const escaped = (0, utils_1.escapeHtml)(trimmed.join('\n'));
    for (const chunk of (0, utils_1.splitMessage)(escaped, 4000, true)) {
        try {
            await bot.sendMessage(state.chatId, chunk, { parse_mode: 'HTML' });
        }
        catch (e) {
            console.error('Erreur envoi:', e.message);
        }
    }
    // Advance the processed index
    monitoring.processedIndex = currentLines.length;
}
main().catch(err => {
    console.error('❌ Erreur fatale:', err);
    process.exit(1);
});
