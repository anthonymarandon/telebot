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
  previous: string;
  stable: number;
  processed: boolean;
  synced: boolean;
  lastTyping: number;
}

export interface PermissionDetection {
  type: 'perm' | 'yn';
  hash: string;
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
