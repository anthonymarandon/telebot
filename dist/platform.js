"use strict";
/**
 * Compatibilité cross-platform (macOS, Linux, Windows)
 */
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.IS_LINUX = exports.IS_MAC = exports.IS_WINDOWS = exports.PLATFORM = void 0;
exports.getHomeDir = getHomeDir;
exports.sleep = sleep;
exports.killBotProcesses = killBotProcesses;
const os = __importStar(require("os"));
const child_process_1 = require("child_process");
exports.PLATFORM = process.platform;
exports.IS_WINDOWS = exports.PLATFORM === 'win32';
exports.IS_MAC = exports.PLATFORM === 'darwin';
exports.IS_LINUX = exports.PLATFORM === 'linux';
function getHomeDir() {
    return process.env.HOME || process.env.USERPROFILE || os.homedir();
}
function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}
function killBotProcesses() {
    try {
        if (exports.IS_WINDOWS) {
            (0, child_process_1.execSync)('taskkill /F /IM node.exe /FI "WINDOWTITLE eq bot.js" 2>nul', { stdio: 'ignore' });
        }
        else {
            // Use pgrep to find PIDs, then filter out our own PID to avoid self-kill
            const result = (0, child_process_1.execSync)('pgrep -f "node.*bot\\.js" 2>/dev/null || true', {
                encoding: 'utf8',
            });
            const myPid = String(process.pid);
            const pids = result
                .trim()
                .split('\n')
                .map(p => p.trim())
                .filter(p => p && p !== myPid);
            for (const pid of pids) {
                try {
                    process.kill(parseInt(pid), 'SIGTERM');
                }
                catch { }
            }
        }
    }
    catch { }
}
