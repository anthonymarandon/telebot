"use strict";
/**
 * Parsing des réponses Claude et détection de permissions
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.PROGRESS_PATTERNS = void 0;
exports.isProgressMessage = isProgressMessage;
exports.isValidResponse = isValidResponse;
exports.extractResponses = extractResponses;
exports.detectPermission = detectPermission;
const utils_1 = require("./utils");
// Patterns de progression Claude à ignorer
exports.PROGRESS_PATTERNS = [
    // ===== APPELS D'OUTILS =====
    /^Write\s*\(/i,
    /^Read\s*\(/i,
    /^Edit\s*\(/i,
    /^Bash\s*\(/i,
    /^Grep\s*\(/i,
    /^Glob\s*\(/i,
    /^Task\s*\(/i,
    /^WebFetch\s*\(/i,
    /^WebSearch\s*\(/i,
    /^TodoWrite\s*\(/i,
    /^TodoRead\s*\(/i,
    /^NotebookEdit\s*\(/i,
    // ===== RÉSULTATS D'OUTILS =====
    /^⎿/,
    /^…\s*\+\d+\s*lines/i,
    /^\.\.\.\s*\+\d+/i,
    // ===== MESSAGES DE PROGRESSION =====
    // Opérations fichiers
    /^Read \d+ files?/i,
    /^Reading /i,
    /^Wrote \d+ files?/i,
    /^Wrote to /i,
    /^Writing /i,
    /^Edit \d+ files?/i,
    /^Edited /i,
    /^Editing /i,
    /^Created /i,
    /^Creating /i,
    /^Deleted /i,
    /^Deleting /i,
    // Recherche
    /^Searching /i,
    /^Search(ed)? (for )?\d+/i,
    /^Found \d+/i,
    /^Glob /i,
    /^Grep /i,
    // Exécution
    /^Ran /i,
    /^Running /i,
    /^Executing /i,
    // Interface Claude
    /^\(ctrl\+/i,
    /^Update Todos/i,
    /^Task /i,
    /^Thinking/i,
    /^Processing/i,
    // Agents et outils
    /^Agent /i,
    /^Tool /i,
    /^Bash /i,
    /^WebFetch/i,
    /^WebSearch/i,
];
function isProgressMessage(text) {
    const trimmed = text.trim();
    if (trimmed.length < 3)
        return true;
    return exports.PROGRESS_PATTERNS.some(pattern => pattern.test(trimmed));
}
function isValidResponse(text) {
    const trimmed = text.trim();
    if (trimmed.length < 5)
        return false;
    if (/^[\s\p{Emoji}\p{P}]+$/u.test(trimmed))
        return false;
    return !isProgressMessage(trimmed);
}
function extractResponses(text) {
    const responses = [];
    let current = [];
    let inResp = false;
    text.split('\n').forEach(line => {
        if (line.includes('⏺')) {
            if (current.length) {
                const cleaned = (0, utils_1.cleanResponse)(current.join('\n'));
                if (cleaned && isValidResponse(cleaned)) {
                    responses.push(cleaned);
                }
            }
            const afterMarker = line.split('⏺')[1]?.trim() || '';
            if (isProgressMessage(afterMarker)) {
                current = [];
                inResp = false;
            }
            else {
                current = [afterMarker];
                inResp = true;
            }
        }
        else if (inResp && (line.includes('❯') || line.startsWith('─────'))) {
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
    });
    if (current.length) {
        const cleaned = (0, utils_1.cleanResponse)(current.join('\n'));
        if (cleaned && isValidResponse(cleaned)) {
            responses.push(cleaned);
        }
    }
    return [...new Set(responses)];
}
function detectPermission(text) {
    const last = text.split('\n').slice(-30).join('\n');
    if (last.includes('Do you want to proceed?') ||
        last.includes('want to run') ||
        last.includes('Allow') ||
        /\d+\.\s*(Yes|No|Oui|Non)/i.test(last)) {
        return `perm:${last.slice(-200)}`;
    }
    if (/\(y\/n\)|\(yes\/no\)/i.test(last)) {
        return `yn:${last.slice(-200)}`;
    }
    return null;
}
