import type { Trait } from '../types';

export interface ParsedPlayer {
  name: string;
  traits: string[];
}

export interface ParsedPlayerWithUnresolved {
  name: string;
  traits: string[];
  unresolvedTraits?: string[];
}

/**
 * Resolves trait labels to trait IDs.
 */
export function resolveTraits(traitLabels: string[], traits: Trait[]): string[] {
  return traitLabels
    .map((label) => {
      const found = traits.find(
        (t) => t.label.toLowerCase() === label.toLowerCase()
      );
      return found?.id || '';
    })
    .filter(Boolean);
}

/**
 * Resolves trait labels to trait IDs, also returning unresolved labels.
 */
export function resolveTraitsWithUnresolved(traitLabels: string[], traits: Trait[]): { resolved: string[]; unresolved: string[] } {
  const resolved: string[] = [];
  const unresolved: string[] = [];
  for (const label of traitLabels) {
    if (!label.trim()) continue;
    const found = traits.find(
      (t) => t.label.toLowerCase() === label.trim().toLowerCase()
    );
    if (found) {
      resolved.push(found.id);
    } else {
      unresolved.push(label.trim());
    }
  }
  return { resolved, unresolved };
}

/**
 * Parses CSV content into player objects.
 * Supports two formats:
 * 1. Matrix format: header row with trait names, 'x' marks in columns
 * 2. Simple format: name, traitlabel1, traitlabel2, ...
 */
export function parseCSV(content: string, traits: Trait[]): ParsedPlayer[] {
  const lines = content.trim().split('\n');
  console.log('Parsing CSV, lines:', lines);
  if (lines.length === 0) return [];

  const firstLineParts = lines[0].split(',').map((s) => s.trim());
  const headerTraitLabels = firstLineParts.slice(1);
  const matchingTraits = headerTraitLabels.filter((label) =>
    traits.some((t) => t.label.toLowerCase() === label.toLowerCase())
  );

  // Matrix format: first column is "name" header, remaining columns are trait labels,
  // and data rows use "x" marks
  const firstColIsHeader = firstLineParts[0].toLowerCase() === 'name';
  if (firstColIsHeader && matchingTraits.length > 0 && matchingTraits.length >= headerTraitLabels.length * 0.5) {
    // Matrix format
    const traitIds = headerTraitLabels.map((label) => {
      const found = traits.find((t) => t.label.toLowerCase() === label.toLowerCase());
      return found?.id || '';
    });

    return lines
      .slice(1)
      .filter((line) => line.trim())
      .map((line) => {
        const parts = line.split(',').map((s) => s.trim());
        const name = parts[0] || '';
        const playerTraits = traitIds.filter(
          (id, idx) => id && parts[idx + 1]?.toLowerCase() === 'x'
        );
        return { name, traits: playerTraits };
      });
  } else {
    // Simple format
    return lines
      .filter((line) => line.trim())
      .map((line) => {
        const parts = line.split(',').map((s) => s.trim());
        return {
          name: parts[0] || '',
          traits: resolveTraits(parts.slice(1), traits),
        };
      });
  }
}

/**
 * Parses JSON content into player objects.
 */
export function parseJSON(content: string, traits: Trait[]): ParsedPlayer[] {
  const data = JSON.parse(content);
  if (!Array.isArray(data)) throw new Error('JSON must be an array');
  return data.map((item) => ({
    name: String(item.name || ''),
    traits: resolveTraits(item.traits || [], traits),
  }));
}

/**
 * Parses CSV content, returning resolved trait IDs and unresolved labels.
 */
export function parseCSVWithUnresolved(content: string, traits: Trait[]): ParsedPlayerWithUnresolved[] {
  const lines = content.trim().split('\n');
  if (lines.length === 0) return [];

  const firstLineParts = lines[0].split(',').map((s) => s.trim());
  const headerTraitLabels = firstLineParts.slice(1);
  const matchingTraits = headerTraitLabels.filter((label) =>
    traits.some((t) => t.label.toLowerCase() === label.toLowerCase())
  );

  const firstColIsHeader = firstLineParts[0].toLowerCase() === 'name';
  if (firstColIsHeader && matchingTraits.length > 0 && matchingTraits.length >= headerTraitLabels.length * 0.5) {
    // Matrix format
    return lines
      .slice(1)
      .filter((line) => line.trim())
      .map((line) => {
        const parts = line.split(',').map((s) => s.trim());
        const name = parts[0] || '';
        const resolved: string[] = [];
        const unresolved: string[] = [];
        headerTraitLabels.forEach((label, idx) => {
          if (parts[idx + 1]?.toLowerCase() === 'x') {
            const found = traits.find((t) => t.label.toLowerCase() === label.toLowerCase());
            if (found) {
              resolved.push(found.id);
            } else if (label.trim()) {
              unresolved.push(label.trim());
            }
          }
        });
        return { name, traits: resolved, unresolvedTraits: unresolved.length > 0 ? unresolved : undefined };
      });
  } else {
    // Simple format
    return lines
      .filter((line) => line.trim())
      .map((line) => {
        const parts = line.split(',').map((s) => s.trim());
        const { resolved, unresolved } = resolveTraitsWithUnresolved(parts.slice(1), traits);
        return {
          name: parts[0] || '',
          traits: resolved,
          unresolvedTraits: unresolved.length > 0 ? unresolved : undefined,
        };
      });
  }
}

/**
 * Parses JSON content, returning resolved trait IDs and unresolved labels.
 */
export function parseJSONWithUnresolved(content: string, traits: Trait[]): ParsedPlayerWithUnresolved[] {
  const data = JSON.parse(content);
  if (!Array.isArray(data)) throw new Error('JSON must be an array');
  return data.map((item) => {
    const { resolved, unresolved } = resolveTraitsWithUnresolved(item.traits || [], traits);
    return {
      name: String(item.name || ''),
      traits: resolved,
      unresolvedTraits: unresolved.length > 0 ? unresolved : undefined,
    };
  });
}
