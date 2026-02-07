"use strict";
/**
 * Handlers des commandes Telegram
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.handleStart = handleStart;
exports.handleRestart = handleRestart;
exports.handleYolo = handleYolo;
exports.handleStop = handleStop;
exports.handleHelp = handleHelp;
exports.handleConfig = handleConfig;
exports.handleScreen = handleScreen;
exports.handleMessage = handleMessage;
const utils_1 = require("./utils");
const config_1 = require("./config");
const tmux_1 = require("./tmux");
const platform_1 = require("./platform");
// /start
async function handleStart(msg, ctx) {
    const { bot, state } = ctx;
    if (!state.userId && state.setupCode) {
        bot.sendMessage(msg.chat.id, '🔧 *Configuration requise*\n\n' +
            'Envoyez le code à 8 chiffres affiché dans votre terminal pour activer le bot.', { parse_mode: 'Markdown' });
        return;
    }
    if (!state.userId && !state.setupCode) {
        bot.sendMessage(msg.chat.id, '⚠️ *Bot non configuré*\n\n' +
            '💻 Sur ton ordinateur :\n' +
            '1. Lance `telebot`\n' +
            '2. Sélectionne "Réinitialiser la configuration"\n' +
            '3. Suis les instructions\n\n' +
            'Puis reviens ici ! 👋', { parse_mode: 'Markdown' });
        return;
    }
    if (!(0, utils_1.isAuthorized)(msg.from.id, state.userId)) {
        bot.sendMessage(msg.chat.id, '❌ Non autorisé.');
        return;
    }
    state.chatId = msg.chat.id;
    const isFirstTime = !(0, tmux_1.tmuxExists)();
    if (isFirstTime) {
        bot.sendMessage(state.chatId, '🤖 *Telebot actif !*\n\n' +
            'Tu peux maintenant utiliser Claude depuis ton téléphone.\n\n' +
            '📝 *Comment utiliser :*\n' +
            '• Envoie un message normal\n' +
            '• Claude te répond ici\n\n' +
            '⚡ *Commandes :*\n' +
            '`/restart` - Redémarrer Claude\n' +
            '`/yolo` - Mode sans permissions\n' +
            '`/help` - Aide complète', { parse_mode: 'Markdown' });
    }
    else {
        bot.sendMessage(state.chatId, '🤖 *Session Claude active*\n\nTu peux continuer à envoyer des messages.', { parse_mode: 'Markdown' });
    }
}
// /restart
function handleRestart(msg, ctx) {
    const { bot, state, monitoring } = ctx;
    if (!(0, utils_1.isAuthorized)(msg.from.id, state.userId))
        return;
    (0, tmux_1.tmuxKillAll)();
    state.lastPermHash = null;
    state.lastAskQuestion = null;
    state.inPlanMode = false;
    state.isYoloMode = false;
    monitoring.synced = false;
    monitoring.processedIndex = 0;
    monitoring.lastLines = [];
    bot.sendMessage(msg.chat.id, '🔄 Session terminée. Envoie un message pour redémarrer.');
}
// /yolo
async function handleYolo(msg, ctx) {
    const { bot, state } = ctx;
    if (!(0, utils_1.isAuthorized)(msg.from.id, state.userId))
        return;
    state.lastPermHash = null;
    state.lastAskQuestion = null;
    state.inPlanMode = false;
    state.isYoloMode = true;
    state.chatId = msg.chat.id;
    try {
        (0, tmux_1.tmuxCreate)(true);
    }
    catch (err) {
        bot.sendMessage(state.chatId, '❌ *Erreur* : impossible de lancer la session tmux.\n\nVérifie que `tmux` est installé sur ta machine.', { parse_mode: 'Markdown' });
        console.error('tmuxCreate error:', err.message);
        return;
    }
    bot.sendChatAction(state.chatId, 'typing').catch(() => { });
    await (0, tmux_1.waitForClaude)();
    bot.sendMessage(state.chatId, '⚡ *Mode YOLO activé*\n\nClaude fonctionne sans demander de permissions.\n\n⚠️ Toutes les commandes seront exécutées automatiquement.', { parse_mode: 'Markdown' });
}
// /stop
function handleStop(msg, ctx) {
    const { bot, state, monitoring } = ctx;
    if (!(0, utils_1.isAuthorized)(msg.from.id, state.userId))
        return;
    (0, tmux_1.tmuxKillAll)();
    state.lastPermHash = null;
    state.lastAskQuestion = null;
    state.inPlanMode = false;
    state.isYoloMode = false;
    state.chatId = null;
    monitoring.synced = false;
    monitoring.processedIndex = 0;
    monitoring.lastLines = [];
    bot.sendMessage(msg.chat.id, '🛑 Session Claude arrêtée.');
}
// /help
function handleHelp(msg, ctx) {
    const { bot, state } = ctx;
    if (!(0, utils_1.isAuthorized)(msg.from.id, state.userId))
        return;
    bot.sendMessage(msg.chat.id, '🤖 *Telebot - Aide*\n\n' +
        '`/start` - Démarrer le bot\n' +
        '`/config` - Configurer le bot\n' +
        '`/restart` - Redémarrer Claude\n' +
        '`/yolo` - Mode sans permissions ⚡\n' +
        '`/screen` - Voir le terminal\n' +
        '`/stop` - Arrêter Claude\n' +
        '`/help` - Cette aide\n\n' +
        '💡 Envoie un message pour parler à Claude.', { parse_mode: 'Markdown' });
}
// /config
function handleConfig(msg, ctx) {
    const { bot, state } = ctx;
    if (!state.userId && state.setupCode) {
        bot.sendMessage(msg.chat.id, '🔧 *Configuration requise*\n\n' +
            '📱 *Étape 1* : Lance `telebot` sur ta machine\n\n' +
            '🔑 *Étape 2* : Entre le code à 8 chiffres affiché dans le terminal\n\n' +
            '✅ *Étape 3* : Tu pourras ensuite parler à Claude !', { parse_mode: 'Markdown' });
    }
    else if (!state.userId && !state.setupCode) {
        bot.sendMessage(msg.chat.id, '⚠️ *Bot non configuré*\n\n' +
            '💻 Sur ton ordinateur :\n' +
            '1. Lance `telebot`\n' +
            '2. Sélectionne "Réinitialiser la configuration"\n\n' +
            '💡 Ton identifiant (si besoin) :\n`' +
            msg.from.id +
            '`', { parse_mode: 'Markdown' });
    }
    else if ((0, utils_1.isAuthorized)(msg.from.id, state.userId)) {
        bot.sendMessage(msg.chat.id, '✅ *Bot configuré*\n\n' +
            '👤 User ID : `' +
            state.userId +
            '`\n\n' +
            '💡 Tu peux envoyer des messages à Claude.', { parse_mode: 'Markdown' });
    }
    else {
        bot.sendMessage(msg.chat.id, '❌ *Non autorisé*\n\n' + 'Ce bot est déjà configuré pour un autre utilisateur.', { parse_mode: 'Markdown' });
    }
}
// /screen
function handleScreen(msg, ctx) {
    const { bot, state } = ctx;
    if (!(0, utils_1.isAuthorized)(msg.from.id, state.userId))
        return;
    if (!(0, tmux_1.tmuxExists)()) {
        bot.sendMessage(msg.chat.id, '⚠️ Aucune session Claude active.');
        return;
    }
    const content = (0, tmux_1.tmuxRead)();
    if (!content.trim()) {
        bot.sendMessage(msg.chat.id, '⚠️ Terminal vide.');
        return;
    }
    // Send as HTML <pre> block, split if too long for Telegram
    const escaped = (0, utils_1.escapeHtml)(content);
    for (const chunk of (0, utils_1.splitMessage)(escaped, 4000, true)) {
        bot.sendMessage(msg.chat.id, chunk, { parse_mode: 'HTML' });
    }
}
// Message handler
async function handleMessage(msg, ctx) {
    const { bot, state } = ctx;
    if (msg.text?.startsWith('/'))
        return;
    const uid = String(msg.from.id);
    const text = msg.text?.trim();
    if (!text)
        return;
    // Setup code verification
    if (!state.userId && state.setupCode) {
        if (text === state.setupCode) {
            const saved = (0, config_1.saveUserId)(uid);
            if (saved) {
                (0, config_1.clearSetupCode)();
                state.userId = uid;
                state.setupCode = '';
                state.chatId = msg.chat.id;
                bot.sendMessage(state.chatId, '✅ *Configuration réussie !*\n\nVotre bot est maintenant actif.\nEnvoyez vos messages à Claude !', { parse_mode: 'Markdown' });
            }
            else {
                bot.sendMessage(msg.chat.id, '❌ *Erreur*\n\n' +
                    'Le code est correct mais la sauvegarde a échoué.\n\n' +
                    '💡 Relance `telebot` sur ton ordinateur et réessaie.', { parse_mode: 'Markdown' });
            }
        }
        else {
            bot.sendMessage(msg.chat.id, '🔧 *Configuration requise*\n\n' +
                'Envoyez le code à 8 chiffres affiché dans votre terminal.', { parse_mode: 'Markdown' });
        }
        return;
    }
    if (!(0, utils_1.isAuthorized)(msg.from.id, state.userId)) {
        bot.sendMessage(msg.chat.id, '❌ Non autorisé.');
        return;
    }
    state.chatId = msg.chat.id;
    if (!(0, tmux_1.tmuxExists)()) {
        try {
            (0, tmux_1.tmuxCreate)();
        }
        catch (err) {
            bot.sendMessage(state.chatId, '❌ *Erreur* : impossible de lancer la session tmux.\n\nVérifie que `tmux` est installé sur ta machine.', { parse_mode: 'Markdown' });
            console.error('tmuxCreate error:', err.message);
            return;
        }
        bot.sendChatAction(state.chatId, 'typing').catch(() => { });
        const ready = await (0, tmux_1.waitForClaude)();
        if (!ready) {
            bot.sendMessage(state.chatId, '⚠️ Claude met du temps à démarrer... Le message sera envoyé dès qu\'il est prêt.');
            await (0, tmux_1.waitForClaude)(30000);
        }
    }
    // Handle AskUserQuestion response
    if (state.lastAskQuestion) {
        const ask = state.lastAskQuestion;
        const num = parseInt(text);
        // Valid option number
        const validNums = ask.options.map(o => o.num);
        if (!isNaN(num) && validNums.includes(num)) {
            (0, tmux_1.tmuxSelectOption)(num, ask.cursorPos);
            state.lastAskQuestion = null;
            return;
        }
        // Free text response → select "Type something" option, then type
        if (ask.hasTypeOption) {
            // "Type something" is the option right after the last real option
            const typeOptionNum = Math.max(...validNums) + 1;
            (0, tmux_1.tmuxSelectOption)(typeOptionNum, ask.cursorPos);
            await (0, platform_1.sleep)(300);
            (0, tmux_1.tmuxSend)(text);
            state.lastAskQuestion = null;
            return;
        }
        // No type option and invalid number - inform user
        bot.sendMessage(state.chatId, `⚠️ Choisis un numéro parmi : ${validNums.join(', ')}`);
        return;
    }
    (0, tmux_1.tmuxSend)(text);
}
