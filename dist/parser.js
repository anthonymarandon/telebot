"use strict";
/**
 * Parsing des réponses Claude et détection d'état terminal
 *
 * Architecture : on détecte l'état de Claude en analysant les dernières lignes
 * du terminal tmux. Les réponses sont extraites uniquement depuis les nouvelles
 * lignes (diff) pour éviter les doublons.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.detectState = detectState;
exports.detectPlanChange = detectPlanChange;
exports.extractResponses = extractResponses;
exports.extractPermission = extractPermission;
exports.extractAskQuestion = extractAskQuestion;
const utils_1 = require("./utils");
// ===== RESPONSE MARKERS =====
// Claude Code uses ⏺ (older) or ● (v2.1+) to mark response starts
const RESPONSE_MARKER = /[⏺●]/;
// Prompt marker: Claude is idle and waiting for input
const PROMPT_MARKER = '❯';
// Spinner characters (indicate Claude is working)
const SPINNER_CHARS = /[⠋⠙⠹⠸⠼⠴⠦⠧⠇⠏◐◓◑◒]/;
// ===== PROGRESS PATTERNS (tool calls, status messages) =====
const PROGRESS_PATTERNS = [
    // Tool calls
    /^(Write|Read|Edit|Bash|Grep|Glob|Task|WebFetch|WebSearch|TodoWrite|TodoRead|NotebookEdit)\s*\(/i,
    // Tool results
    /^⎿/,
    /^…\s*\+\d+\s*lines/i,
    /^\.\.\.\s*\+\d+/i,
    // File operations
    /^(Read|Wrote|Writing|Edit(ed|ing)?|Creat(ed|ing)|Delet(ed|ing)|Reading)\s+\d*\s*(files?|to\s)/i,
    // Search
    /^(Searching|Search(ed)?|Found|Glob|Grep)\s/i,
    // Execution
    /^(Ran|Running|Executing)\s/i,
    // UI
    /^\(ctrl\+/i,
    /^Update Todos/i,
    /^(Task|Thinking|Processing|Agent|Tool|Bash|WebFetch|WebSearch)\s/i,
    // Plan mode markers
    /^Entered plan mode/i,
    /^Exited plan mode/i,
    /^Claude is now exploring/i,
];
function isProgressMessage(text) {
    const trimmed = text.trim();
    if (trimmed.length < 3)
        return true;
    return PROGRESS_PATTERNS.some(p => p.test(trimmed));
}
function isValidResponse(text) {
    const trimmed = text.trim();
    if (trimmed.length < 5)
        return false;
    if (/^[\s\p{Emoji}\p{P}]+$/u.test(trimmed))
        return false;
    return !isProgressMessage(trimmed);
}
// ===== STATE DETECTION =====
/**
 * Detect Claude's current state by analyzing the last lines of the terminal.
 * Priority order: permission > asking > idle > working
 */
function detectState(lines) {
    const last30 = lines.slice(-30);
    const joined = last30.join('\n');
    // 1. Permission dialog? (highest priority - needs user action)
    if (isPermissionDialog(joined))
        return 'permission';
    // 2. AskUserQuestion? (interactive menu visible)
    if (isAskDialog(last30))
        return 'asking';
    // 3. Idle? (prompt visible, Claude waiting for input)
    // Check last few non-empty lines for the prompt marker
    for (let i = lines.length - 1; i >= Math.max(0, lines.length - 5); i--) {
        const line = lines[i].trim();
        if (line === '')
            continue;
        if (line.includes(PROMPT_MARKER) && !RESPONSE_MARKER.test(line))
            return 'idle';
        break; // Only check the last non-empty line
    }
    // 4. Default: working
    return 'working';
}
/**
 * Detect if plan mode was entered or exited in new lines
 */
function detectPlanChange(newLines) {
    for (let i = newLines.length - 1; i >= 0; i--) {
        const line = newLines[i].trim();
        if (/Entered plan mode/i.test(line))
            return 'entered';
        if (/Exited plan mode/i.test(line))
            return 'exited';
    }
    return null;
}
// ===== RESPONSE EXTRACTION (diff-based) =====
/**
 * Extract Claude's text responses from a set of lines.
 * Only processes the provided lines (caller should pass only new lines).
 */
function extractResponses(lines) {
    const responses = [];
    let current = [];
    let inResp = false;
    for (const line of lines) {
        if (RESPONSE_MARKER.test(line)) {
            // Flush previous response
            if (current.length) {
                const cleaned = (0, utils_1.cleanResponse)(current.join('\n'));
                if (cleaned && isValidResponse(cleaned)) {
                    responses.push(cleaned);
                }
            }
            const afterMarker = line.split(RESPONSE_MARKER)[1]?.trim() || '';
            if (isProgressMessage(afterMarker)) {
                current = [];
                inResp = false;
            }
            else {
                current = [afterMarker];
                inResp = true;
            }
        }
        else if (inResp && (line.includes(PROMPT_MARKER) || line.startsWith('─────'))) {
            // End of response
            if (current.length) {
                const cleaned = (0, utils_1.cleanResponse)(current.join('\n'));
                if (cleaned && isValidResponse(cleaned)) {
                    responses.push(cleaned);
                }
            }
            current = [];
            inResp = false;
        }
        else if (inResp) {
            current.push(line);
        }
    }
    // Flush remaining
    if (current.length) {
        const cleaned = (0, utils_1.cleanResponse)(current.join('\n'));
        if (cleaned && isValidResponse(cleaned)) {
            responses.push(cleaned);
        }
    }
    return responses;
}
function isPermissionDialog(text) {
    const clean = text.replace(SPINNER_CHARS, '');
    return (clean.includes('Do you want to proceed?') ||
        clean.includes('want to run') ||
        /\d+\.\s*(Yes|No|Oui|Non)/i.test(clean) ||
        clean.includes('Allow') ||
        /\(y\/n\)|\(yes\/no\)/i.test(clean));
}
function extractPermission(lines) {
    const last30 = lines.slice(-30).filter(l => l.trim() !== '');
    const joined = last30.join('\n');
    const clean = joined.replace(SPINNER_CHARS, '');
    if (!isPermissionDialog(clean))
        return null;
    // Extract context lines before the permission question
    const cleanLines = clean.split('\n').map(l => l.trim()).filter(l => l !== '' && !/^[─━═]+$/.test(l));
    let context = '';
    for (let i = 0; i < cleanLines.length; i++) {
        const line = cleanLines[i];
        if (line.includes('Do you want to proceed?') ||
            line.includes('Allow') ||
            line.includes('want to run') ||
            /\(y\/n\)/i.test(line)) {
            const ctxLines = cleanLines.slice(Math.max(0, i - 4), i).filter(l => !l.startsWith('Esc ') && !l.startsWith('❯') && !l.match(/^\d+\./) && !/^[─━═]+$/.test(l));
            context = ctxLines.join('\n');
            break;
        }
    }
    const hash = `perm:${context.slice(0, 200)}`;
    return { hash, context };
}
// ===== ASK USER QUESTION DETECTION =====
function isAskDialog(lines) {
    return lines.some(l => l.includes('Enter to select') && l.includes('to navigate'));
}
function extractAskQuestion(lines) {
    // Find footer
    const footerIdx = lines.findIndex(l => l.includes('Enter to select') && l.includes('to navigate'));
    if (footerIdx === -1)
        return null;
    // Find ☐ header (backwards from footer)
    let headerIdx = -1;
    for (let i = footerIdx - 1; i >= 0; i--) {
        if (/☐/.test(lines[i])) {
            headerIdx = i;
            break;
        }
    }
    if (headerIdx === -1)
        return null;
    const header = lines[headerIdx].replace(/.*☐\s*/, '').trim();
    // Find first numbered option
    let firstOptIdx = -1;
    for (let i = headerIdx + 1; i < footerIdx; i++) {
        if (/^\s*[❯]?\s*\d+\.\s/.test(lines[i])) {
            firstOptIdx = i;
            break;
        }
    }
    if (firstOptIdx === -1)
        return null;
    // Question text between header and first option
    const questionLines = lines.slice(headerIdx + 1, firstOptIdx).filter(l => l.trim());
    const question = questionLines.join('\n').trim();
    if (!question)
        return null;
    // Extract options
    const options = [];
    let cursorPos = 1;
    let i = firstOptIdx;
    while (i < footerIdx) {
        const line = lines[i];
        if (/^[─\s]{3,}$/.test(line.trim()) && line.includes('────'))
            break;
        const optMatch = line.match(/^\s*([❯])?\s*(\d+)\.\s+(.+)/);
        if (optMatch) {
            const num = parseInt(optMatch[2]);
            const isSelected = optMatch[1] === '❯';
            const label = optMatch[3].trim();
            if (isSelected)
                cursorPos = num;
            // Skip "Type something" (auto-added "Other" option)
            if (/^type something/i.test(label)) {
                i++;
                continue;
            }
            // Check for description on next line
            let description = '';
            if (i + 1 < footerIdx) {
                const nextLine = lines[i + 1];
                if (/^\s{4,}/.test(nextLine) && !/^\s*[❯]?\s*\d+\./.test(nextLine)) {
                    description = nextLine.trim();
                    i++;
                }
            }
            options.push({ num, label, description });
        }
        i++;
    }
    if (options.length === 0)
        return null;
    const hasTypeOption = lines.slice(firstOptIdx, footerIdx).some(l => /\d+\.\s+Type something/i.test(l));
    return { header, question, options, hasTypeOption, cursorPos };
}
