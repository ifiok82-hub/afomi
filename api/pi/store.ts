import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';

export type ServerPaymentStatus =
  | 'PENDING'
  | 'APPROVED'
  | 'COMPLETED'
  | 'CANCELLED'
  | 'FAILED';

export interface ServerPaymentRecord {
  paymentId: string;
  txid?: string;
  amount: number;
  memo: string;
  metadata: Record<string, unknown>;
  status: ServerPaymentStatus;
  network: 'testnet';
  mode: 'pi-platform-api' | 'testnet-sandbox';
  userUid?: string;
  piUsername?: string;
  createdAt: string;
  updatedAt: string;
  errorReason?: string;
}

interface ServerDb {
  payments: ServerPaymentRecord[];
  adminPinHash: string;
  adminPinSalt: string;
  failedAttempts: number;
  lockUntil: number;
  deletedAccounts: { email?: string; piUsername?: string; deletedAt: string }[];
}

const DATA_DIR = path.resolve(process.cwd(), 'data');
const DB_FILE = path.resolve(DATA_DIR, 'afomi_server_db.json');

function hashPin(pin: string, salt: string): string {
  return crypto.scryptSync(pin, salt, 32).toString('hex');
}

function createInitialDb(): ServerDb {
  const defaultSalt = crypto.randomBytes(16).toString('hex');
  return {
    payments: [],
    adminPinSalt: defaultSalt,
    adminPinHash: hashPin('7777', defaultSalt),
    failedAttempts: 0,
    lockUntil: 0,
    deletedAccounts: [],
  };
}

export function readServerDb(): ServerDb {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    if (!fs.existsSync(DB_FILE)) {
      const initial = createInitialDb();
      fs.writeFileSync(DB_FILE, JSON.stringify(initial, null, 2), 'utf8');
      return initial;
    }
    const raw = fs.readFileSync(DB_FILE, 'utf8');
    const parsed = JSON.parse(raw) as Partial<ServerDb>;
    const initial = createInitialDb();
    return {
      payments: Array.isArray(parsed.payments) ? parsed.payments : [],
      adminPinHash: parsed.adminPinHash || initial.adminPinHash,
      adminPinSalt: parsed.adminPinSalt || initial.adminPinSalt,
      failedAttempts: typeof parsed.failedAttempts === 'number' ? parsed.failedAttempts : 0,
      lockUntil: typeof parsed.lockUntil === 'number' ? parsed.lockUntil : 0,
      deletedAccounts: Array.isArray(parsed.deletedAccounts) ? parsed.deletedAccounts : [],
    };
  } catch {
    return createInitialDb();
  }
}

export function writeServerDb(db: ServerDb): void {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2), 'utf8');
}

export function verifyPinOnServer(pin: string): {
  ok: boolean;
  locked: boolean;
  remainingSeconds: number;
  attemptsLeft: number;
  message: string;
} {
  const db = readServerDb();
  const now = Date.now();
  if (db.lockUntil > now) {
    const remainingSeconds = Math.ceil((db.lockUntil - now) / 1000);
    return {
      ok: false,
      locked: true,
      remainingSeconds,
      attemptsLeft: 0,
      message: `Too many attempts. Locked for ${remainingSeconds}s.`,
    };
  }

  const candidateHash = hashPin(pin, db.adminPinSalt);
  const a = Buffer.from(candidateHash, 'hex');
  const b = Buffer.from(db.adminPinHash, 'hex');
  const matches = a.length === b.length && crypto.timingSafeEqual(a, b);

  if (matches) {
    db.failedAttempts = 0;
    db.lockUntil = 0;
    writeServerDb(db);
    return { ok: true, locked: false, remainingSeconds: 0, attemptsLeft: 3, message: 'Verified' };
  }

  db.failedAttempts += 1;
  if (db.failedAttempts >= 3) {
    db.lockUntil = now + 60_000;
    db.failedAttempts = 0;
    writeServerDb(db);
    return {
      ok: false,
      locked: true,
      remainingSeconds: 60,
      attemptsLeft: 0,
      message: 'Too many attempts. Locked for 60 seconds.',
    };
  }

  writeServerDb(db);
  return {
    ok: false,
    locked: false,
    remainingSeconds: 0,
    attemptsLeft: 3 - db.failedAttempts,
    message: `Incorrect PIN. ${3 - db.failedAttempts} attempt(s) left.`,
  };
}

export function updatePinOnServer(newPin: string): { ok: boolean; message: string } {
  if (!/^\d{4}$/.test(newPin)) {
    return { ok: false, message: 'Admin PIN must be exactly 4 digits.' };
  }
  const db = readServerDb();
  const newSalt = crypto.randomBytes(16).toString('hex');
  db.adminPinSalt = newSalt;
  db.adminPinHash = hashPin(newPin, newSalt);
  db.failedAttempts = 0;
  db.lockUntil = 0;
  writeServerDb(db);
  return { ok: true, message: 'Admin PIN updated securely.' };
}

export function sanitizeString(input: unknown, maxLen = 200): string {
  if (typeof input !== 'string') return '';
  return input.replace(/[<>]/g, '').trim().slice(0, maxLen);
}
