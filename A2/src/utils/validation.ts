import type { Priority, RecurrenceRule, TaskStatus } from '../models.js';
import { isIsoDate } from './date.js';

export function assertNonEmptyString(value: unknown, field: string, minLen = 1): asserts value is string {
  if (typeof value !== 'string' || value.trim().length < minLen) {
    throw new Error(`${field} must be at least ${minLen} characters`);
  }
}

export function assertStatus(value: unknown): asserts value is TaskStatus {
  if (value !== 'todo' && value !== 'in-progress' && value !== 'done') {
    throw new Error('Invalid status');
  }
}

export function assertPriority(value: unknown): asserts value is Priority {
  if (value !== 'low' && value !== 'medium' && value !== 'high') {
    throw new Error('Invalid priority');
  }
}

export function assertIsoDateOrEmpty(value: unknown, field: string): asserts value is string {
  if (typeof value !== 'string') throw new Error(`${field} must be a string`);
  if (value !== '' && !isIsoDate(value)) throw new Error(`${field} must be YYYY-MM-DD or empty`);
}

export function parseRecurrence(raw: string | undefined): RecurrenceRule | undefined {
  if (!raw) return undefined;
  const s = raw.trim();
  if (!s) return undefined;

  // Format: "daily:1" or "weekly:2" or "monthly:1" optionally with ";end=YYYY-MM-DD"
  // Examples: daily:1 ; weekly:2;end=2026-12-31
  const [main, ...rest] = s.split(';').map(x => x.trim()).filter(Boolean);
  const [freq, intervalStr] = main.split(':').map(x => x.trim());

  if (freq !== 'daily' && freq !== 'weekly' && freq !== 'monthly') {
    throw new Error('Invalid recurrence frequency (daily|weekly|monthly)');
  }

  const interval = Number(intervalStr);
  if (!Number.isFinite(interval) || interval < 1) {
    throw new Error('Recurrence interval must be a number >= 1');
  }

  const rule: RecurrenceRule = { frequency: freq, interval: Math.floor(interval) };

  for (const part of rest) {
    const [k, v] = part.split('=').map(x => x.trim());
    if (k === 'end' && v) {
      if (!isIsoDate(v)) throw new Error('Recurrence end must be YYYY-MM-DD');
      rule.endDate = v;
    }
  }

  return rule;
}
