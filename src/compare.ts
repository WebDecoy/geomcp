import { z } from 'zod';
export const comparisonReport = z.object({
  rulesVersion: z.literal('0.1.0'), url: z.string().url(),
  checks: z.array(z.object({ id: z.string().max(100), status: z.enum(['pass', 'warn', 'fail', 'unknown']) })).max(100)
});
export function compareAudits(before: z.infer<typeof comparisonReport>, after: z.infer<typeof comparisonReport>) {
  before = comparisonReport.parse(before);
  after = comparisonReport.parse(after);
  const map = (report: typeof before) => {
    const result = new Map<string, string>();
    for (const check of report.checks) {
      if (result.has(check.id)) throw new Error(`Duplicate check ID: ${check.id}`);
      result.set(check.id, check.status);
    }
    return result;
  };
  const a = map(before); const b = map(after);
  const rank: Record<string, number> = { fail: 0, warn: 1, pass: 2 };
  const changes = [...new Set([...a.keys(), ...b.keys()])].map(id => {
    const previous = a.get(id); const current = b.get(id);
    const comparable = previous !== undefined && current !== undefined && previous !== 'unknown' && current !== 'unknown';
    return { id, before: previous ?? 'absent', after: current ?? 'absent', outcome: !comparable ? 'coverage-change' : rank[current]! > rank[previous]! ? 'improved' : rank[current]! < rank[previous]! ? 'regressed' : 'unchanged' };
  });
  return { beforeUrl: before.url, afterUrl: after.url, differentUrls: before.url !== after.url, improved: changes.filter(c => c.outcome === 'improved'), regressed: changes.filter(c => c.outcome === 'regressed'), coverageChanges: changes.filter(c => c.outcome === 'coverage-change'), unchanged: changes.filter(c => c.outcome === 'unchanged').length, limitations: ['Comparison is limited to observed check statuses under the same rules version. Coverage changes are not improvements.', 'Different URLs may represent different page purposes; compare in context.'] };
}
