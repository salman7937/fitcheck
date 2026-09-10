import type { Resume } from "@/features/resume/schema";
import type { Change } from "./schema";

// Common resume verbs and structural words a rewrite is allowed to introduce
// even though they weren't in the exact `before` text — they carry no facts.
const ALLOWLIST = new Set(
  [
    "the", "a", "an", "of", "in", "on", "for", "to", "and", "or", "with", "by",
    "from", "as", "at", "that", "this", "our", "its", "into", "across", "through",
    "over", "under", "is", "was", "are", "were", "be", "been", "being",
    "led", "build", "built", "reduce", "reduced", "increase", "increased",
    "improve", "improved", "deliver", "delivered", "launch", "launched",
    "drive", "drove", "streamline", "streamlined", "optimize", "optimized",
    "design", "designed", "develop", "developed", "implement", "implemented",
    "manage", "managed", "create", "created", "establish", "established",
    "grow", "grew", "scale", "scaled", "cut", "save", "saved", "generate",
    "generated", "achieve", "achieved", "spearhead", "spearheaded", "own",
    "owned", "ship", "shipped", "architect", "architected", "refactor",
    "refactored", "migrate", "migrated", "mentor", "mentored", "collaborate",
    "collaborated", "partner", "partnered", "coordinate", "coordinated",
    "execute", "executed", "revamp", "revamped", "modernize", "modernized",
  ].map((w) => w.toLowerCase())
);

// Internal dots/pluses/hashes are kept (e.g. "Node.js", "C++", "C#"), but a
// trailing sentence period is not swallowed into the token.
const TOKEN_PATTERN = /[A-Za-z][A-Za-z0-9+#-]*(?:\.[A-Za-z0-9+#-]+)*|\d+(?:\.\d+)?%?/g;

function tokenize(text: string): string[] {
  return (text.match(TOKEN_PATTERN) ?? []).map((t) => t.toLowerCase());
}

function resumeVocabulary(resume: Resume): Set<string> {
  const fields: string[] = [
    resume.basics.name,
    resume.basics.title ?? "",
    resume.summary ?? "",
    ...resume.experience.flatMap((e) => [e.company, e.role, ...e.bullets.map((b) => b.text)]),
    ...resume.projects.flatMap((p) => [p.name, ...p.tech, ...p.bullets.map((b) => b.text)]),
    ...resume.skills.flatMap((s) => s.items),
    ...resume.education.map((e) => `${e.institution} ${e.degree}`),
    ...resume.certifications.map((c) => `${c.name} ${c.issuer ?? ""}`),
  ];

  const vocab = new Set<string>();
  for (const field of fields) {
    for (const token of tokenize(field)) vocab.add(token);
  }
  return vocab;
}

/**
 * Deterministic no-fabrication post-check (§8, layer 3).
 * Tokenizes `after`, subtracts tokens present in `before` plus the
 * verb/stopword allowlist, and flags any remaining token that does not
 * appear anywhere else in the source resume.
 */
export function findFabricatedTokens(resume: Resume, change: Change): string[] {
  const vocab = resumeVocabulary(resume);
  const beforeTokens = new Set(tokenize(change.before));
  const afterTokens = tokenize(change.after);

  const flagged: string[] = [];
  for (const token of afterTokens) {
    if (beforeTokens.has(token)) continue;
    if (ALLOWLIST.has(token)) continue;
    if (vocab.has(token)) continue;
    flagged.push(token);
  }

  return [...new Set(flagged)];
}

/**
 * Runs the fabrication check over every change. Flagged changes are forced
 * to `accepted: false` with `unverified: true` — never silently applied.
 */
export function applyFabricationCheck(resume: Resume, changes: Change[]): Change[] {
  return changes.map((change) => {
    const flaggedTokens = findFabricatedTokens(resume, change);
    if (flaggedTokens.length === 0) return change;

    return { ...change, accepted: false, unverified: true };
  });
}
