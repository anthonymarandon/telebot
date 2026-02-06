/**
 * Handlers des commandes Telegram
 */

import TelegramBot from 'node-telegram-bot-api';
import { BotContext } from './types';
import { isAuthorized } from './utils';
import { saveUserId, clearSetupCode } from './config';
import { tmuxKillAll, tmuxCreate, tmuxExists, tmuxSend, waitForClaude } from './tmux';

// /start
export async function handleStart(msg: TelegramBot.Message, ctx: BotContext): Promise<void> {
  const { bot, state } = ctx;

  if (!state.userId && state.setupCode) {
    bot.sendMessage(
      msg.chat.id,
      '🔧 *Configuration requise*\n\n' +
        'Envoyez le code à 8 chiffres affiché dans votre terminal pour activer le bot.',
      { parse_mode: 'Markdown' }
    );
    return;
  }

  if (!state.userId && !state.setupCode) {
    bot.sendMessage(
      msg.chat.id,
      '⚠️ *Bot non configuré*\n\n' +
        '💻 Sur ton ordinateur :\n' +
        '1. Lance `telebot`\n' +
        '2. Sélectionne "Réinitialiser la configuration"\n' +
        '3. Suis les instructions\n\n' +
        'Puis reviens ici ! 👋',
      { parse_mode: 'Markdown' }
    );
    return;
  }

  if (!isAuthorized(msg.from!.id, state.userId)) {
    bot.sendMessage(msg.chat.id, '❌ Non autorisé.');
    return;
  }

  state.chatId = msg.chat.id;

  const isFirstTime = state.sentResponses.size === 0;

  if (isFirstTime) {
    bot.sendMessage(
      state.chatId,
      '🤖 *Telebot actif !*\n\n' +
        'Tu peux maintenant utiliser Claude depuis ton téléphone.\n\n' +
        '📝 *Comment utiliser :*\n' +
        '• Envoie un message normal\n' +
        '• Claude te répond ici\n\n' +
        '⚡ *Commandes :*\n' +
        '`/restart` - Redémarrer Claude\n' +
        '`/yolo` - Mode sans permissions\n' +
        '`/help` - Aide complète',
      { parse_mode: 'Markdown' }
    );
  } else {
    bot.sendMessage(
      state.chatId,
      '🤖 *Session Claude active*\n\nTu peux continuer à envoyer des messages.',
      { parse_mode: 'Markdown' }
    );
  }
}

// /restart
export function handleRestart(msg: TelegramBot.Message, ctx: BotContext): void {
  const { bot, state } = ctx;

  if (!isAuthorized(msg.from!.id, state.userId)) return;

  tmuxKillAll();
  state.sentResponses.clear();
  state.lastPermHash = null;
  state.isYoloMode = false;

  bot.sendMessage(msg.chat.id, '🔄 Session terminée. Envoie un message pour redémarrer.');
}

// /yolo
export async function handleYolo(msg: TelegramBot.Message, ctx: BotContext): Promise<void> {
  const { bot, state } = ctx;

  if (!isAuthorized(msg.from!.id, state.userId)) return;

  state.sentResponses.clear();
  state.lastPermHash = null;
  state.isYoloMode = true;
  state.chatId = msg.chat.id;

  try {
    tmuxCreate(true);
  } catch (err) {
    bot.sendMessage(state.chatId, '❌ *Erreur* : impossible de lancer la session tmux.\n\nVérifie que `tmux` est installé sur ta machine.', { parse_mode: 'Markdown' });
    console.error('tmuxCreate error:', (err as Error).message);
    return;
  }
  bot.sendChatAction(state.chatId, 'typing').catch(() => {});
  await waitForClaude();

  bot.sendMessage(
    state.chatId,
    '⚡ *Mode YOLO activé*\n\nClaude fonctionne sans demander de permissions.\n\n⚠️ Toutes les commandes seront exécutées automatiquement.',
    { parse_mode: 'Markdown' }
  );
}

// /stop
export function handleStop(msg: TelegramBot.Message, ctx: BotContext): void {
  const { bot, state } = ctx;

  if (!isAuthorized(msg.from!.id, state.userId)) return;

  tmuxKillAll();
  state.sentResponses.clear();
  state.lastPermHash = null;
  state.isYoloMode = false;
  state.chatId = null;

  bot.sendMessage(msg.chat.id, '🛑 Session Claude arrêtée.');
}

// /help
export function handleHelp(msg: TelegramBot.Message, ctx: BotContext): void {
  const { bot, state } = ctx;

  if (!isAuthorized(msg.from!.id, state.userId)) return;

  bot.sendMessage(
    msg.chat.id,
    '🤖 *Telebot - Aide*\n\n' +
      '`/start` - Démarrer le bot\n' +
      '`/config` - Configurer le bot\n' +
      '`/restart` - Redémarrer Claude\n' +
      '`/yolo` - Mode sans permissions ⚡\n' +
      '`/stop` - Arrêter Claude\n' +
      '`/help` - Cette aide\n\n' +
      '💡 Envoie un message pour parler à Claude.',
    { parse_mode: 'Markdown' }
  );
}

// /config
export function handleConfig(msg: TelegramBot.Message, ctx: BotContext): void {
  const { bot, state } = ctx;

  if (!state.userId && state.setupCode) {
    bot.sendMessage(
      msg.chat.id,
      '🔧 *Configuration requise*\n\n' +
        '📱 *Étape 1* : Lance `telebot` sur ta machine\n\n' +
        '🔑 *Étape 2* : Entre le code à 8 chiffres affiché dans le terminal\n\n' +
        '✅ *Étape 3* : Tu pourras ensuite parler à Claude !',
      { parse_mode: 'Markdown' }
    );
  } else if (!state.userId && !state.setupCode) {
    bot.sendMessage(
      msg.chat.id,
      '⚠️ *Bot non configuré*\n\n' +
        '💻 Sur ton ordinateur :\n' +
        '1. Lance `telebot`\n' +
        '2. Sélectionne "Réinitialiser la configuration"\n\n' +
        '💡 Ton identifiant (si besoin) :\n`' +
        msg.from!.id +
        '`',
      { parse_mode: 'Markdown' }
    );
  } else if (isAuthorized(msg.from!.id, state.userId)) {
    bot.sendMessage(
      msg.chat.id,
      '✅ *Bot configuré*\n\n' +
        '👤 User ID : `' +
        state.userId +
        '`\n\n' +
        '💡 Tu peux envoyer des messages à Claude.',
      { parse_mode: 'Markdown' }
    );
  } else {
    bot.sendMessage(
      msg.chat.id,
      '❌ *Non autorisé*\n\n' + 'Ce bot est déjà configuré pour un autre utilisateur.',
      { parse_mode: 'Markdown' }
    );
  }
}

// Message handler
export async function handleMessage(msg: TelegramBot.Message, ctx: BotContext): Promise<void> {
  const { bot, state } = ctx;

  if (msg.text?.startsWith('/')) return;

  const uid = String(msg.from!.id);
  const text = msg.text?.trim();
  if (!text) return;

  // Setup code verification
  if (!state.userId && state.setupCode) {
    if (text === state.setupCode) {
      const saved = saveUserId(uid);
      if (saved) {
        clearSetupCode();
        state.userId = uid;
        state.setupCode = '';
        state.chatId = msg.chat.id;
        bot.sendMessage(
          state.chatId,
          '✅ *Configuration réussie !*\n\nVotre bot est maintenant actif.\nEnvoyez vos messages à Claude !',
          { parse_mode: 'Markdown' }
        );
      } else {
        bot.sendMessage(
          msg.chat.id,
          '❌ *Erreur*\n\n' +
            'Le code est correct mais la sauvegarde a échoué.\n\n' +
            '💡 Relance `telebot` sur ton ordinateur et réessaie.',
          { parse_mode: 'Markdown' }
        );
      }
    } else {
      bot.sendMessage(
        msg.chat.id,
        '🔧 *Configuration requise*\n\n' +
          'Envoyez le code à 8 chiffres affiché dans votre terminal.',
        { parse_mode: 'Markdown' }
      );
    }
    return;
  }

  if (!isAuthorized(msg.from!.id, state.userId)) {
    bot.sendMessage(msg.chat.id, '❌ Non autorisé.');
    return;
  }

  state.chatId = msg.chat.id;

  if (!tmuxExists()) {
    try {
      tmuxCreate();
    } catch (err) {
      bot.sendMessage(state.chatId!, '❌ *Erreur* : impossible de lancer la session tmux.\n\nVérifie que `tmux` est installé sur ta machine.', { parse_mode: 'Markdown' });
      console.error('tmuxCreate error:', (err as Error).message);
      return;
    }
    bot.sendChatAction(state.chatId!, 'typing').catch(() => {});
    const ready = await waitForClaude();
    if (!ready) {
      bot.sendMessage(state.chatId!, '⚠️ Claude met du temps à démarrer... Le message sera envoyé dès qu\'il est prêt.');
      await waitForClaude(30000);
    }
  }

  tmuxSend(text);
}
