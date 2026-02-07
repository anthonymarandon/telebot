#!/usr/bin/env node
/**
 * Telebot - Bot Telegram pour Claude Code via tmux
 *
 * Monitoring basé sur le diff terminal (screen-based) :
 * - On envoie directement les nouvelles lignes du terminal
 * - Machine à états : idle / working / permission / asking
 * - Déduplication par processedIndex (pas de Set)
 */

import TelegramBot from 'node-telegram-bot-api';
import { AppState, MonitoringState, BotContext } from './types';
import { loadConfig, ensureSettings, CONFIG_FILE, TELEBOT_DIR } from './config';
import { tmuxExists, tmuxRead } from './tmux';
import {
  detectState,
  detectPlanChange,
  trimTerminalChrome,
  extractPermission,
  extractAskQuestion,
} from './parser';
import { escapeHtml, splitMessage } from './utils';
import {
  handleStart,
  handleRestart,
  handleYolo,
  handleStop,
  handleHelp,
  handleConfig,
  handleScreen,
  handleMessage,
} from './commands';
import { existsSync, readFileSync, writeFileSync, unlinkSync } from 'fs';
import path from 'path';
import { killBotProcesses, sleep } from './platform';

// Constants
const POLL_INTERVAL = 500;
const STABILITY = 2;
const PID_FILE = path.join(TELEBOT_DIR, 'bot.pid');

// ===== PROTECTION INSTANCE UNIQUE =====
async function ensureSingleInstance(): Promise<void> {
  killBotProcesses();
  await sleep(500);
  writeFileSync(PID_FILE, process.pid.toString());

  const cleanup = () => {
    try {
      if (existsSync(PID_FILE)) {
        const savedPid = readFileSync(PID_FILE, 'utf8').trim();
        if (savedPid === process.pid.toString()) {
          unlinkSync(PID_FILE);
        }
      }
    } catch {}
  };

  process.on('exit', cleanup);
  process.on('SIGINT', () => { cleanup(); process.exit(0); });
  process.on('SIGTERM', () => { cleanup(); process.exit(0); });
}

// ===== MAIN =====
async function main(): Promise<void> {
  await ensureSingleInstance();
  console.log(`🔒 Instance unique (PID ${process.pid})`);

  ensureSettings();
  const config = loadConfig();
  const TOKEN = config.TELEGRAM_BOT_TOKEN;

  if (!TOKEN) {
    console.error(`❌ TELEGRAM_BOT_TOKEN manquant dans ${CONFIG_FILE}`);
    process.exit(1);
  }

  // Application state
  const state: AppState = {
    chatId: null,
    lastPermHash: null,
    lastAskQuestion: null,
    inPlanMode: false,
    isYoloMode: false,
    userId: config.TELEGRAM_USER_ID || '',
    setupCode: config.SETUP_CODE || '',
  };

  // Monitoring state
  const monitoring: MonitoringState = {
    lastLines: [],
    processedIndex: 0,
    claudeState: 'idle',
    stable: 0,
    flushed: false,
    synced: false,
    lastTyping: 0,
  };

  const bot = new TelegramBot(TOKEN, { polling: true });

  bot.on('polling_error', err => {
    console.error('Erreur polling Telegram:', (err as Error).message);
  });

  const ctx: BotContext = {
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
  console.log(`Config: ${CONFIG_FILE}`);
  console.log('Bot démarré');

  // Command handlers
  bot.onText(/\/start/, msg => handleStart(msg, ctx));
  bot.onText(/\/restart/, msg => handleRestart(msg, ctx));
  bot.onText(/\/yolo/, msg => handleYolo(msg, ctx));
  bot.onText(/\/screen/, msg => handleScreen(msg, ctx));
  bot.onText(/\/stop/, msg => handleStop(msg, ctx));
  bot.onText(/\/help/, msg => handleHelp(msg, ctx));
  bot.onText(/\/config/, msg => handleConfig(msg, ctx));

  bot.on('message', msg => handleMessage(msg, ctx));

  // ===== MONITORING LOOP =====
  setInterval(async () => {
    try {
      if (!state.chatId || !tmuxExists()) {
        monitoring.synced = false;
        return;
      }

      const rawFull = tmuxRead();
      // Strip trailing empty lines (tmux pads with empty lines to fill pane height)
      const currentLines = rawFull.split('\n');
      while (currentLines.length > 0 && currentLines[currentLines.length - 1].trim() === '') {
        currentLines.pop();
      }

      // --- Initial sync: mark all existing content as already processed ---
      if (!monitoring.synced) {
        monitoring.lastLines = currentLines;
        monitoring.processedIndex = currentLines.length;
        monitoring.synced = true;
        monitoring.claudeState = detectState(currentLines);
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
          bot.sendChatAction(state.chatId, 'typing').catch(() => {});
          monitoring.lastTyping = now;
        }
      } else {
        monitoring.stable++;
      }

      // --- State detection (runs every cycle) ---
      const newState = detectState(currentLines);
      const prevState = monitoring.claudeState;

      // --- Handle state transitions ---

      // Permission dialog appeared
      if (!state.isYoloMode && newState === 'permission' && prevState !== 'permission') {
        await flushScreenDiff(currentLines, monitoring, state, bot);

        const perm = extractPermission(currentLines);
        if (perm && state.lastPermHash === null) {
          state.lastPermHash = perm.hash;
          const ctxBlock = perm.context ? `\`\`\`\n${perm.context}\n\`\`\`\n\n` : '';
          bot.sendMessage(
            state.chatId!,
            '🔐 *Autorisation requise*\n\n' +
              ctxBlock +
              '*Réponds avec :*\n' +
              '`1` → Oui (juste cette fois)\n' +
              '`2` → Oui, toujours\n' +
              '`3` → Non',
            { parse_mode: 'Markdown' }
          );
        }
      }

      // Permission dialog disappeared
      if (prevState === 'permission' && newState !== 'permission') {
        state.lastPermHash = null;
      }

      // AskUserQuestion appeared
      if (newState === 'asking' && prevState !== 'asking') {
        await flushScreenDiff(currentLines, monitoring, state, bot);

        const askQuestion = extractAskQuestion(currentLines);
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

          bot.sendMessage(
            state.chatId!,
            `❓ *${askQuestion.header}*\n\n` +
              `${askQuestion.question}\n\n` +
              `${optionsText}${freeText}`,
            { parse_mode: 'Markdown' }
          );
        }
      }

      // AskUserQuestion disappeared
      if (prevState === 'asking' && newState !== 'asking') {
        state.lastAskQuestion = null;
      }

      // Plan mode changes (check new lines only)
      if (contentChanged) {
        const newLines = currentLines.slice(monitoring.processedIndex);
        const planChange = detectPlanChange(newLines);

        if (planChange === 'entered' && !state.inPlanMode) {
          await flushScreenDiff(currentLines, monitoring, state, bot);
          state.inPlanMode = true;
          bot.sendMessage(
            state.chatId!,
            '📋 *Mode Plan activé*\n\n' +
              'Claude explore et conçoit une approche d\'implémentation.\n' +
              'Le plan s\'affichera quand il sera prêt.',
            { parse_mode: 'Markdown' }
          );
        } else if (planChange === 'exited' && state.inPlanMode) {
          state.inPlanMode = false;
          bot.sendMessage(
            state.chatId!,
            '✅ *Mode Plan terminé*\n\nClaude reprend l\'exécution.',
            { parse_mode: 'Markdown' }
          );
        }
      }

      // Update state
      monitoring.claudeState = newState;

      // --- Flush screen diff when content is stable ---
      if (monitoring.stable === STABILITY && !monitoring.flushed) {
        await flushScreenDiff(currentLines, monitoring, state, bot);
      }
    } catch (err) {
      console.error('Erreur monitoring:', (err as Error).message);
    }
  }, POLL_INTERVAL);
}

/**
 * Send new terminal lines as HTML <pre> blocks.
 * Trims terminal chrome (separators, empty prompt, hints) from the end.
 */
async function flushScreenDiff(
  currentLines: string[],
  monitoring: MonitoringState,
  state: AppState,
  bot: TelegramBot
): Promise<void> {
  if (monitoring.flushed) return;
  monitoring.flushed = true;

  // Get new lines since last processing
  const newLines = currentLines.slice(monitoring.processedIndex);
  if (newLines.length === 0) {
    monitoring.processedIndex = currentLines.length;
    return;
  }

  // Trim terminal chrome from end
  const trimmed = trimTerminalChrome(newLines);
  if (trimmed.length === 0) {
    monitoring.processedIndex = currentLines.length;
    return;
  }

  // Escape HTML and send as <pre> chunks
  const escaped = escapeHtml(trimmed.join('\n'));
  for (const chunk of splitMessage(escaped, 4000, true)) {
    try {
      await bot.sendMessage(state.chatId!, chunk, { parse_mode: 'HTML' });
    } catch (e) {
      console.error('Erreur envoi:', (e as Error).message);
    }
  }

  // Advance the processed index
  monitoring.processedIndex = currentLines.length;
}

main().catch(err => {
  console.error('❌ Erreur fatale:', err);
  process.exit(1);
});
