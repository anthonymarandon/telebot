#!/usr/bin/env node
/**
 * Telebot - Bot Telegram pour Claude Code via tmux
 */

import TelegramBot from 'node-telegram-bot-api';
import { AppState, MonitoringState, BotContext } from './types';
import { loadConfig, ensureSettings, CONFIG_FILE, TELEBOT_DIR } from './config';
import { tmuxExists, tmuxRead } from './tmux';
import { extractResponses, detectPermission, detectPlanMode, detectAskUserQuestion } from './parser';
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
    sentResponses: new Set<string>(),
    lastPermHash: null,
    lastAskQuestion: null,
    inPlanMode: false,
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
    try {
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

      // Permission detection - runs on every iteration (independent of stability)
      if (!state.isYoloMode) {
        const perm = detectPermission(current);
        if (perm && state.lastPermHash === null) {
          state.lastPermHash = 'sent';
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
        } else if (!perm && state.lastPermHash !== null) {
          // Permission dialog gone (user responded) - reset for next one
          state.lastPermHash = null;
        }
      }

      // Plan Mode detection
      const planStatus = detectPlanMode(current);
      if (planStatus === 'entered' && !state.inPlanMode) {
        state.inPlanMode = true;
        bot.sendMessage(
          state.chatId!,
          '📋 *Mode Plan activé*\n\n' +
            'Claude explore et conçoit une approche d\'implémentation.\n' +
            'Le plan s\'affichera quand il sera prêt.',
          { parse_mode: 'Markdown' }
        );
      } else if (planStatus === 'exited' && state.inPlanMode) {
        state.inPlanMode = false;
        bot.sendMessage(
          state.chatId!,
          '✅ *Mode Plan terminé*\n\nClaude reprend l\'exécution.',
          { parse_mode: 'Markdown' }
        );
      } else if (planStatus === null && state.inPlanMode) {
        // Plan mode indicators no longer visible (scrolled away) - keep state
      }

      // AskUserQuestion detection
      const askQuestion = detectAskUserQuestion(current);
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
      } else if (!askQuestion && state.lastAskQuestion !== null) {
        // Question answered/dismissed - reset
        state.lastAskQuestion = null;
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

      // Stable = process responses
      if (monitoring.stable === STABILITY && !monitoring.processed) {
        monitoring.processed = true;

        const responses = extractResponses(current);
        if (responses.length === 0 && current.length > 50) {
          const hasMarker = current.includes('⏺');
          const hasPrompt = current.includes('❯');
          console.log(`[monitoring] Contenu stable (${current.length} chars), 0 réponses extraites. Marqueur ⏺: ${hasMarker}, Prompt ❯: ${hasPrompt}`);
        }

        for (const resp of responses) {
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
      }
    } catch (err) {
      console.error('Erreur monitoring:', (err as Error).message);
    }
  }, POLL_INTERVAL);
}

main().catch(err => {
  console.error('❌ Erreur fatale:', err);
  process.exit(1);
});
