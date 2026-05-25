import { describe, it, expect } from 'vitest';
import { parseCSV, parseJSON, resolveTraits } from '../utils/importParser';
import type { Trait } from '../types';

const traits: Trait[] = [
  { id: 't1', label: 'Goalkeeper', color: '#ff0' },
  { id: 't2', label: 'Defender', color: '#00f' },
  { id: 't3', label: 'Midfielder', color: '#0f0' },
  { id: 't4', label: 'Forward', color: '#f00' },
];

describe('resolveTraits', () => {
  it('resolves trait labels to IDs (case-insensitive)', () => {
    expect(resolveTraits(['goalkeeper', 'DEFENDER'], traits)).toEqual(['t1', 't2']);
  });

  it('filters out unrecognized trait labels', () => {
    expect(resolveTraits(['Goalkeeper', 'Unknown'], traits)).toEqual(['t1']);
  });

  it('returns empty array for no matches', () => {
    expect(resolveTraits(['foo', 'bar'], traits)).toEqual([]);
  });
});

describe('parseCSV', () => {
  describe('matrix format (exported from app)', () => {
    it('parses header + x marks into correct player traits', () => {
      const csv = `name,Goalkeeper,Defender,Midfielder,Forward
Alice,x,,,x
Bob,,x,x,
Carol,,,x,`;

      const result = parseCSV(csv, traits);
      expect(result).toHaveLength(3);
      expect(result[0]).toEqual({ name: 'Alice', traits: ['t1', 't4'] });
      expect(result[1]).toEqual({ name: 'Bob', traits: ['t2', 't3'] });
      expect(result[2]).toEqual({ name: 'Carol', traits: ['t3'] });
    });

    it('handles case-insensitive header matching', () => {
      const csv = `name,goalkeeper,defender
Alice,x,x`;
      const result = parseCSV(csv, traits);
      expect(result[0].traits).toEqual(['t1', 't2']);
    });

    it('skips empty lines', () => {
      const csv = `name,Goalkeeper,Defender
Alice,x,x

Bob,,x`;
      const result = parseCSV(csv, traits);
      expect(result).toHaveLength(2);
    });
  });

  describe('simple format (name, trait1, trait2, ...)', () => {
    it('parses simple CSV with trait labels', () => {
      const csv = `Alice, Goalkeeper, Forward
Bob, Defender`;
      const result = parseCSV(csv, traits);
      expect(result).toHaveLength(2);
      expect(result[0]).toEqual({ name: 'Alice', traits: ['t1', 't4'] });
      expect(result[1]).toEqual({ name: 'Bob', traits: ['t2'] });
    });

    it('handles unknown trait labels gracefully', () => {
      const csv = `Alice, Goalkeeper, Striker`;
      const result = parseCSV(csv, traits);
      expect(result[0]).toEqual({ name: 'Alice', traits: ['t1'] });
    });
  });
});

describe('parseJSON', () => {
  it('parses JSON array with trait labels', () => {
    const json = JSON.stringify([
      { name: 'Alice', traits: ['Goalkeeper', 'Forward'] },
      { name: 'Bob', traits: ['Defender'] },
    ]);
    const result = parseJSON(json, traits);
    expect(result).toHaveLength(2);
    expect(result[0]).toEqual({ name: 'Alice', traits: ['t1', 't4'] });
    expect(result[1]).toEqual({ name: 'Bob', traits: ['t2'] });
  });

  it('throws for non-array JSON', () => {
    expect(() => parseJSON('{"name":"test"}', traits)).toThrow('JSON must be an array');
  });

  it('handles missing fields gracefully', () => {
    const json = JSON.stringify([{ name: 'Alice' }, { traits: ['Goalkeeper'] }]);
    const result = parseJSON(json, traits);
    expect(result[0]).toEqual({ name: 'Alice', traits: [] });
    expect(result[1]).toEqual({ name: '', traits: ['t1'] });
  });
});
