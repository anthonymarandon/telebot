"use strict";
/**
 * Fonctions utilitaires
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.stripAnsi = stripAnsi;
exports.cleanResponse = cleanResponse;
exports.splitMessage = splitMessage;
exports.normalizeForComparison = normalizeForComparison;
exports.isAuthorized = isAuthorized;
function stripAnsi(text) {
    return text
        .replace(/\x1b\[[0-9;]*[a-zA-Z]/g, '')
        .replace(/\x1b\].*?(\x07|\x1b\\)/g, '')
        .replace(/[\x00-\x08\x0b\x0c\x0e-\x1f\x7f]/g, '');
}
function isTableLine(line) {
    return /[┌┐└┘├┤┬┴┼╋┏┓┗┛┣┫┳┻╂]/.test(line) ||
        /^[│┃].*[│┃]$/.test(line.trim());
}
function cleanResponse(text) {
    const emojiRegex = /^(\p{Emoji_Presentation}|\p{Emoji}\uFE0F)/u;
    const borderRegex = /^[\s─━═░▒▓█▀▄⠋⠙⠹⠸⠼⠴⠦⠧⠇⠏◐◓◑◒●○◉◎⏺\-_=~`]*$/;
    let lines = text.split('\n')
        .filter(line => {
        if (isTableLine(line))
            return true;
        if (borderRegex.test(line))
            return false;
        return true;
    })
        .map(line => {
        if (isTableLine(line))
            return line;
        return line.replace(/^[│┃]\s*|\s*[│┃]$/g, '');
    })
        .map(line => {
        if (isTableLine(line))
            return line;
        return line.replace(/^[ \t]+/, '');
    })
        .map(line => {
        if (isTableLine(line))
            return line;
        return line.replace(/  +/g, ' ');
    });
    const result = [];
    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        const prevLine = lines[i - 1];
        if (emojiRegex.test(line) && prevLine && prevLine.trim() !== '') {
            if (!emojiRegex.test(prevLine)) {
                result.push('');
            }
        }
        result.push(line);
    }
    return result
        .join('\n')
        .replace(/\n{3,}/g, '\n\n')
        .trim();
}
function splitMessage(text, maxLen = 4000) {
    if (text.length <= maxLen)
        return [text];
    const chunks = [];
    let current = '';
    text.split('\n\n').forEach(para => {
        if ((current + para).length + 2 > maxLen) {
            if (current)
                chunks.push(current.trim());
            current = para;
        }
        else {
            current += (current ? '\n\n' : '') + para;
        }
    });
    if (current)
        chunks.push(current.trim());
    return chunks;
}
function normalizeForComparison(text) {
    return text.replace(/\s+/g, ' ').trim().toLowerCase();
}
function isAuthorized(uid, allowedUserId) {
    return !allowedUserId || String(uid) === allowedUserId;
}
