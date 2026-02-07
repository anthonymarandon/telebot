"use strict";
/**
 * Opérations tmux pour contrôler Claude Code
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.TMUX_SESSION = void 0;
exports.tmuxExists = tmuxExists;
exports.tmuxKillAll = tmuxKillAll;
exports.tmuxCreate = tmuxCreate;
exports.cleanupContext = cleanupContext;
exports.tmuxSend = tmuxSend;
exports.tmuxSendKey = tmuxSendKey;
exports.tmuxSelectOption = tmuxSelectOption;
exports.tmuxRead = tmuxRead;
exports.waitForClaude = waitForClaude;
const child_process_1 = require("child_process");
const fs_1 = require("fs");
const path_1 = require("path");
const utils_1 = require("./utils");
const config_1 = require("./config");
exports.TMUX_SESSION = 'claude';
const CONTEXT_FILE = (0, path_1.join)(config_1.TELEBOT_DIR, '.context.md');
function tmuxExists() {
    try {
        (0, child_process_1.execSync)(`tmux has-session -t ${exports.TMUX_SESSION} 2>/dev/null`);
        return true;
    }
    catch {
        return false;
    }
}
function tmuxKillAll() {
    try {
        const sessions = (0, child_process_1.execSync)('tmux list-sessions -F "#{session_name}" 2>/dev/null', {
            encoding: 'utf8',
        });
        sessions
            .split('\n')
            .filter(s => s.includes('claude'))
            .forEach(session => {
            try {
                (0, child_process_1.execSync)(`tmux kill-session -t ${session}`);
            }
            catch { }
        });
    }
    catch { }
}
function tmuxCreate(yoloMode = false) {
    tmuxKillAll();
    // -u forces UTF-8 (required for Claude Code's Unicode markers like ⏺ and ❯)
    (0, child_process_1.execSync)(`tmux -u new-session -d -s ${exports.TMUX_SESSION} -x 200 -y 50`);
    const context = (0, config_1.buildInjectedContext)();
    let systemPromptArg = '';
    if (context.trim()) {
        (0, fs_1.writeFileSync)(CONTEXT_FILE, context);
        systemPromptArg = ` --system-prompt "${CONTEXT_FILE}"`;
    }
    const envVars = 'LANG=C.UTF-8 CLAUDE_CODE_ENABLE_PROMPT_SUGGESTION=false';
    const claudeCmd = yoloMode ? 'claude --dangerously-skip-permissions' : 'claude';
    const cmd = `${envVars} ${claudeCmd}${systemPromptArg}`;
    (0, child_process_1.execSync)(`tmux send-keys -t ${exports.TMUX_SESSION} '${cmd}' Enter`);
}
function cleanupContext() {
    if ((0, fs_1.existsSync)(CONTEXT_FILE)) {
        try {
            (0, fs_1.unlinkSync)(CONTEXT_FILE);
        }
        catch { }
    }
}
function tmuxSend(text) {
    const escaped = text.replace(/'/g, "'\\''");
    (0, child_process_1.execSync)(`tmux send-keys -t ${exports.TMUX_SESSION} -l '${escaped}'`);
    (0, child_process_1.execSync)(`tmux send-keys -t ${exports.TMUX_SESSION} Enter`);
}
/**
 * Send raw key presses to tmux (for TUI menu navigation)
 * Accepts tmux key names: Down, Up, Enter, Escape, etc.
 */
function tmuxSendKey(...keys) {
    for (const key of keys) {
        (0, child_process_1.execSync)(`tmux send-keys -t ${exports.TMUX_SESSION} ${key}`);
    }
}
/**
 * Navigate a TUI menu and select an option.
 * Moves from cursorPos to targetOption using Up/Down, then presses Enter.
 */
function tmuxSelectOption(targetOption, cursorPos) {
    const delta = targetOption - cursorPos;
    const key = delta > 0 ? 'Down' : 'Up';
    const steps = Math.abs(delta);
    for (let i = 0; i < steps; i++) {
        tmuxSendKey(key);
    }
    tmuxSendKey('Enter');
}
function tmuxRead() {
    try {
        const output = (0, child_process_1.execSync)(`tmux capture-pane -t ${exports.TMUX_SESSION} -p -S -`, {
            encoding: 'utf8',
        });
        return (0, utils_1.stripAnsi)(output);
    }
    catch {
        return '';
    }
}
/**
 * Attend que Claude soit prêt (prompt ❯ détecté dans tmux)
 * Timeout après maxWait ms, polling toutes les interval ms
 */
async function waitForClaude(maxWait = 30000, interval = 500) {
    const start = Date.now();
    while (Date.now() - start < maxWait) {
        const content = tmuxRead();
        if (content.includes('❯')) {
            return true;
        }
        await new Promise(r => setTimeout(r, interval));
    }
    return false;
}
