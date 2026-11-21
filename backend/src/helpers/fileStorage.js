import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const DATA_DIR = path.join(__dirname, '..', '..', 'data');
export const EMAILS_FILE = path.join(DATA_DIR, 'emails.json');
export const SETTINGS_FILE = path.join(DATA_DIR, 'settings.json');
export const DOMAINS_FILE = path.join(DATA_DIR, 'domains.json');
export const MAILBOXES_FILE = path.join(DATA_DIR, 'mailboxes.json');
export const ATTACHMENTS_DIR = path.join(DATA_DIR, 'attachments');

// Ensure directories exist
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}
if (!fs.existsSync(ATTACHMENTS_DIR)) {
  fs.mkdirSync(ATTACHMENTS_DIR, { recursive: true });
}

/**
 * Low-level synchronous JSON file reader
 */
export function readJson(filePath, defaultValue = []) {
  try {
    if (!fs.existsSync(filePath)) {
      fs.writeFileSync(filePath, JSON.stringify(defaultValue, null, 2), 'utf-8');
      return defaultValue;
    }
    const content = fs.readFileSync(filePath, 'utf-8');
    return JSON.parse(content || '[]');
  } catch (err) {
    console.error(`[FileStorage] Error reading ${filePath}:`, err.message);
    return defaultValue;
  }
}

/**
 * Low-level atomic JSON file writer
 * Writes to a temporary file first and renames it atomically to eliminate
 * partial write corruption during concurrent requests or abrupt shutdowns.
 */
export function writeJson(filePath, data) {
  const dir = path.dirname(filePath);
  const tempFile = path.join(dir, `.tmp_${path.basename(filePath)}_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`);
  try {
    fs.writeFileSync(tempFile, JSON.stringify(data, null, 2), 'utf-8');
    fs.renameSync(tempFile, filePath);
    return true;
  } catch (err) {
    if (fs.existsSync(tempFile)) {
      try { fs.unlinkSync(tempFile); } catch (_) {}
    }
    console.error(`[FileStorage] Error writing ${filePath}:`, err.message);
    throw err;
  }
}
