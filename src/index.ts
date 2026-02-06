#!/usr/bin/env node
/**
 * Telebot - Bot Telegram pour Claude Code via tmux
 */

import TelegramBot from 'node-telegram-bot-api';
import { AppState, MonitoringState, BotContext } from './types';
import { loadConfig, CONFIG_FILE, TELEBOT_DIR } from './config';
import { tmuxExists, tmuxRead } from './tmux';
import { extractResponses, detectPermission } from './parser';
import { splitMessage, normalizeForComparison } from './utils';
import {
  handleStart,
  handleRestart,
  handleYolo,
  handleStop,
  handleHelp,
  handleConfig,
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

  const config = loadConfig();
  const TOKEN = config.TELEGRAM_BOT_TOKEN;

  if (!TOKEN) {
    console.error(`❌ TELEGRAM_BOT_TOKEN manquant dans ${CONFIG_FILE}`);
    process.exit(1);
  }

  // Application state
  const state: AppState = {
    chatId: null,
    sentResponses: new Set<string>(),
    lastPermHash: null,
    isYoloMode: false,
    userId: config.TELEGRAM_USER_ID || '',
    setupCode: config.SETUP_CODE || '',
  };

  // Monitoring state
  const monitoring: MonitoringState = {
    previous: '',
    stable: 0,
    processed: false,
    synced: false,
    lastTyping: 0,
  };

  const bot = new TelegramBot(TOKEN, { polling: true });

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
  bot.onText(/\/stop/, msg => handleStop(msg, ctx));
  bot.onText(/\/help/, msg => handleHelp(msg, ctx));
  bot.onText(/\/config/, msg => handleConfig(msg, ctx));

  bot.on('message', msg => handleMessage(msg, ctx));

  // Monitoring loop
  setInterval(async () => {
    if (!state.chatId || !tmuxExists()) {
      monitoring.synced = false;
      return;
    }

    const current = tmuxRead();

    // Initial sync
    if (!monitoring.synced) {
      extractResponses(current).forEach(r => state.sentResponses.add(normalizeForComparison(r)));
      monitoring.synced = true;
      monitoring.previous = current;
      return;
    }

    // Content changed
    if (current !== monitoring.previous) {
      monitoring.stable = 0;
      monitoring.processed = false;
      monitoring.previous = current;

      const now = Date.now();
      if (now - monitoring.lastTyping > 4000) {
        bot.sendChatAction(state.chatId, 'typing').catch(() => {});
        monitoring.lastTyping = now;
      }
      return;
    }

    monitoring.stable++;

    // Stable = process
    if (monitoring.stable === STABILITY && !monitoring.processed) {
      monitoring.processed = true;

      for (const resp of extractResponses(current)) {
        const normalized = normalizeForComparison(resp);
        if (resp && !state.sentResponses.has(normalized)) {
          state.sentResponses.add(normalized);
          for (const chunk of splitMessage(resp)) {
            try {
              await bot.sendMessage(state.chatId!, chunk);
            } catch (e) {
              console.error('Erreur envoi:', (e as Error).message);
            }
          }
        }
      }

      if (!state.isYoloMode) {
        const perm = detectPermission(current);
        if (perm && perm !== state.lastPermHash) {
          state.lastPermHash = perm;
          bot.sendMessage(
            state.chatId!,
            '🔐 *Autorisation requise*\n\n' +
              'Claude veut exécuter une action.\n\n' +
              '*Réponds avec :*\n' +
              '`1` → Oui (juste cette fois)\n' +
              '`2` → Oui, toujours\n' +
              '`3` → Non',
            { parse_mode: 'Markdown' }
          );
        }
      }
    }
  }, POLL_INTERVAL);
}

main().catch(err => {
  console.error('❌ Erreur fatale:', err);
  process.exit(1);
});
