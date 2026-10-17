export type Status = 'pass' | 'warn' | 'fail' | 'unknown';
export type Category = 'discovery' | 'structure' | 'semantics' | 'media' | 'links' | 'evidence' | 'delivery';
export interface Check {
  id: string; category: Category; status: Status; weight: number;
  title: string; evidence: string; recommendation: string;
}
export interface Audit {
  schemaVersion: '1.0'; rulesVersion: '0.1.0'; url: string; fetchedAt: string;
  source: 'provided-html' | 'http'; score: number; coverage: { evaluated: number; unknown: number; total: number };
  categories: Record<string, { score: number | null; evaluated: number; unknown: number }>;
  checks: Check[]; priorities: Check[]; facts: Record<string, unknown>; limitations: string[];
}
