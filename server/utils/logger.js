/**
 * Simple file-based logger for Walrus upload operations
 */
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const LOG_DIR = path.resolve(__dirname, '../logs');
const LOG_FILE = path.join(LOG_DIR, 'walrus_upload.log');

// Ensure log directory exists
await fs.mkdir(LOG_DIR, { recursive: true });

function formatTimestamp() {
  return new Date().toISOString();
}

function formatLog(level, message, data = null) {
  const timestamp = formatTimestamp();
  const dataStr = data ? ` | ${JSON.stringify(data)}` : '';
  return `[${timestamp}] [${level}] ${message}${dataStr}\n`;
}

async function writeLog(level, message, data = null) {
  try {
    const logLine = formatLog(level, message, data);
    await fs.appendFile(LOG_FILE, logLine, 'utf8');
  } catch (err) {
    // Fallback to console if file write fails
    console.error(`[Logger Error] Failed to write log: ${err.message}`);
    console.log(formatLog(level, message, data).trim());
  }
}

export const logger = {
  info: (message, data) => {
    console.log(`[INFO] ${message}`, data || '');
    return writeLog('INFO', message, data);
  },
  
  error: (message, data) => {
    console.error(`[ERROR] ${message}`, data || '');
    return writeLog('ERROR', message, data);
  },
  
  warn: (message, data) => {
    console.warn(`[WARN] ${message}`, data || '');
    return writeLog('WARN', message, data);
  },
  
  debug: (message, data) => {
    if (process.env.DEBUG) {
      console.debug(`[DEBUG] ${message}`, data || '');
      return writeLog('DEBUG', message, data);
    }
  }
};

export default logger;

