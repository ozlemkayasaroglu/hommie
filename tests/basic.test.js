import { describe, expect, it } from 'vitest';
import { buildFallbackPriceEstimate, parseJsonResponse } from '../api/_lib/ai.js';
import { extractFirstJsonArray } from '../api/_lib/json.js';
import { validateCreatePayload, getRoomColor, buildSearchUrl, isOfficialItem } from '../api/_lib/validation.js';

describe('validation', () => {
  it('accepts a valid create payload', () => {
    const payload = validateCreatePayload({
      name: 'Büyük salon bitkisi',
      room: 'Salon',
      type: 'Alınacak',
      priority: 2,
      status: 'Başlamadı',
      note: 'Güzel bir dekoratif bitki.'
    });

    expect(payload.name).toBe('Büyük salon bitkisi');
    expect(payload.room).toBe('Salon');
    expect(payload.priority).toBe(2);
  });

  it('invalid room is rejected', () => {
    expect(() => validateCreatePayload({
      name: 'Test',
      room: 'Not valid',
      type: 'Alınacak',
      priority: 1,
      status: 'Başlamadı',
      note: 'Test'
    })).toThrow();
  });
});

describe('json parser', () => {
  it('parses fenced JSON arrays', () => {
    const text = '```json\n[{"id":1,"name":"test"}]\n```';
    expect(extractFirstJsonArray(text)).toEqual([{ id: 1, name: 'test' }]);
  });

  it('parses plain JSON object', () => {
    const text = '{"ok":true,"items":[1,2,3]}';
    expect(parseJsonResponse(text)).toEqual({ ok: true, items: [1, 2, 3] });
  });
});

describe('official business and helpers', () => {
  it('detects official items', () => {
    expect(isOfficialItem({ type: 'Resmi iş' })).toBe(true);
    expect(isOfficialItem({ type: 'Alınacak', name: 'İnternet aboneliği' })).toBe(true);
  });

  it('returns room colors', () => {
    expect(getRoomColor('Salon')).toBe('#FF8A3D');
    expect(getRoomColor('Genel')).toBe('#8B5CF6');
  });

  it('builds shopping URLs', () => {
    expect(buildSearchUrl('bitki', 'Akakçe')).toContain('akakce');
    expect(buildSearchUrl('bitki', 'Trendyol')).toContain('trendyol');
  });
});

describe('fallback pricing', () => {
  it('creates a realistic AI-style estimate', () => {
    const result = buildFallbackPriceEstimate({ id: '1', name: 'Büyük salon bitkisi', room: 'Salon', priority: 2 });
    expect(result.range).toMatch(/₺/);
    expect(result.tip.length).toBeLessThanOrEqual(120);
    expect(result.when).toMatch(/\d{4}-\d{2}-\d{2}/);
  });
});
