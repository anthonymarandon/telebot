"use strict";
/**
 * Fonctions utilitaires
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.stripAnsi = stripAnsi;
exports.escapeHtml = escapeHtml;
exports.splitMessage = splitMessage;
exports.isAuthorized = isAuthorized;
function stripAnsi(text) {
    return text
        .replace(/\x1b\[[0-9;]*[a-zA-Z]/g, '')
        .replace(/\x1b\].*?(\x07|\x1b\\)/g, '')
        .replace(/[\x00-\x08\x0b\x0c\x0e-\x1f\x7f]/g, '');
}
function escapeHtml(text) {
    return text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}
/**
 * Split a message into chunks that fit Telegram's limit.
 * When wrapPre is true, each chunk is wrapped in <pre>...</pre> and split by lines.
 */
function splitMessage(text, maxLen = 4000, wrapPre = false) {
    if (wrapPre) {
        // Reserve space for <pre> and </pre> tags (11 chars)
        const effectiveMax = maxLen - 11;
        const lines = text.split('\n');
        const chunks = [];
        let current = '';
        for (const line of lines) {
            if (current.length + line.length + 1 > effectiveMax && current) {
                chunks.push('<pre>' + current + '</pre>');
                current = line;
            }
            else {
                current += (current ? '\n' : '') + line;
            }
        }
        if (current)
            chunks.push('<pre>' + current + '</pre>');
        return chunks;
    }
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
function isAuthorized(uid, allowedUserId) {
    return !allowedUserId || String(uid) === allowedUserId;
}
