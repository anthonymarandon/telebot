/**
 * Types et interfaces pour Telebot
 */

import TelegramBot from 'node-telegram-bot-api';

export interface TelebotConfig {
  TELEGRAM_BOT_TOKEN: string;
  TELEGRAM_USER_ID?: string;
  SETUP_CODE?: string;
}

export interface AskOption {
  num: number;
  label: string;
  description: string;
}

export interface AskUserQuestionInfo {
  header: string;
  question: string;
  options: AskOption[];
  hasTypeOption: boolean;
  cursorPos: number;
}

export type ClaudeState = 'idle' | 'working' | 'permission' | 'asking';

export interface AppState {
  chatId: number | null;
  sentResponses: Set<string>;
  lastPermHash: string | null;
  lastAskQuestion: AskUserQuestionInfo | null;
  inPlanMode: boolean;
  isYoloMode: boolean;
  userId: string;
  setupCode: string;
}

export interface MonitoringState {
  /** Lines from last tmux read (split by \n) */
  lastLines: string[];
  /** Number of lines already processed */
  processedIndex: number;
  /** Current detected state of Claude */
  claudeState: ClaudeState;
  /** Stability counter (how many polls content unchanged) */
  stable: number;
  /** Whether current stable content has been flushed */
  flushed: boolean;
  /** Whether initial sync is done */
  synced: boolean;
  /** Timestamp of last typing indicator sent */
  lastTyping: number;
}

export interface BotContext {
  bot: TelegramBot;
  state: AppState;
  monitoring: MonitoringState;
  config: TelebotConfig;
}

export type CommandHandler = (
  msg: TelegramBot.Message,
  ctx: BotContext
) => void | Promise<void>;

export interface UserSkill {
  name: string;
  description: string;
  enabled: boolean;
  content: string;
}

export interface SkillsConfig {
  skills: UserSkill[];
}
