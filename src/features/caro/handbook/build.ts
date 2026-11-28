import type { Block, Diagram, Exercise } from './types';

/** Small constructors so the chapter files read like the text they hold. English is the source. */
export const p = (text: string): Block => ({ kind: 'p', text });
export const h = (text: string): Block => ({ kind: 'h', text });
export const tip = (text: string): Block => ({ kind: 'tip', text });
export const list = (...items: string[]): Block => ({ kind: 'list', items });
export const diagram = (value: Diagram): Block => ({ kind: 'diagram', diagram: value });
export const exercise = (value: Exercise): Block => ({ kind: 'exercise', exercise: value });
