#!/usr/bin/env node
"use strict";
/**
 * Telebot - Bot Telegram pour Claude Code via tmux
 *
 * Monitoring basé sur le diff de lignes :
 * - On ne traite que les NOUVELLES lignes à chaque cycle
 * - Machine à états : idle / working / permission / asking
 * - Anti-spam : chaque réponse n'est envoyée qu'une seule fois
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
            const raw = (0, tmux_1.tmuxRead)();
            const currentLines = raw.split('\n');
            // --- Initial sync: mark all existing content as already processed ---
            if (!monitoring.synced) {
                // Index all existing responses so we don't re-send them
                (0, parser_1.extractResponses)(currentLines).forEach(r => state.sentResponses.add((0, utils_1.normalizeForComparison)(r)));
                monitoring.lastLines = currentLines;
                monitoring.processedIndex = currentLines.length;
                monitoring.synced = true;
                monitoring.claudeState = (0, parser_1.detectState)(currentLines);
                return;
            }
            // --- Detect if content changed ---
            const contentChanged = raw !== monitoring.lastLines.join('\n');
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
                // Flush any pending responses first
                await flushNewResponses(currentLines, monitoring, state, bot);
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
                await flushNewResponses(currentLines, monitoring, state, bot);
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
                    await flushNewResponses(currentLines, monitoring, state, bot);
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
            // --- Flush responses when content is stable ---
            if (monitoring.stable === STABILITY && !monitoring.flushed) {
                await flushNewResponses(currentLines, monitoring, state, bot);
            }
        }
        catch (err) {
            console.error('Erreur monitoring:', err.message);
        }
    }, POLL_INTERVAL);
}
/**
 * Extract and send only NEW responses (lines after processedIndex).
 * Updates processedIndex after processing.
 */
async function flushNewResponses(currentLines, monitoring, state, bot) {
    if (monitoring.flushed)
        return;
    monitoring.flushed = true;
    // Get new lines since last processing
    const newLines = currentLines.slice(monitoring.processedIndex);
    if (newLines.length === 0)
        return;
    const responses = (0, parser_1.extractResponses)(newLines);
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
    // Advance the processed index
    monitoring.processedIndex = currentLines.length;
}
main().catch(err => {
    console.error('❌ Erreur fatale:', err);
    process.exit(1);
});
