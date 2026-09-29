const SEPARATORS = new Set(['’', "'", '-']);

export interface Normalised {
  text: string;
  sourceIndex: number[];
}

export function normaliseWithMap(input: string): Normalised {
  let text = '';
  const sourceIndex: number[] = [];
  for (let i = 0; i < input.length; i++) {
    const folded = SEPARATORS.has(input[i])
      ? ' '
      : input[i].toLowerCase().normalize('NFD').replace(/\p{M}/gu, '').replace(/\s/g, ' ');
    for (const char of folded) {
      if (char === ' ' && (text.length === 0 || text.endsWith(' '))) continue;
      text += char;
      sourceIndex.push(i);
    }
  }
  if (text.endsWith(' ')) {
    text = text.slice(0, -1);
    sourceIndex.pop();
  }
  return { text, sourceIndex };
}

export function normalise(input: string): string {
  return normaliseWithMap(input).text;
}
