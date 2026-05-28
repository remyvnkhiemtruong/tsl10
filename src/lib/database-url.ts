export const DEFAULT_LOCAL_DATABASE_URL = "postgresql://postgres:postgres@localhost:5432/vvk_admission?schema=public";

const DATABASE_ENV_KEYS = [
  "DATABASE_URL",
  "POSTGRES_PRISMA_URL",
  "POSTGRES_URL",
  "POSTGRES_URL_NON_POOLING",
  "POSTGRES_URL_UNPOOLED",
  "DATABASE_URL_UNPOOLED",
  "DATABASE_PRISMA_URL",
  "DATABASE_POSTGRES_PRISMA_URL",
  "DATABASE_POSTGRES_URL",
  "NEON_DATABASE_URL"
] as const;

const PLACEHOLDER_PATTERN = /\b(USER|PASSWORD|HOST|PORT|DATABASE)\b|REPLACE_WITH|your-|xxxxxxxx/i;

export type DatabaseUrlCandidate = {
  key: string;
  value?: string;
  ok: boolean;
  reason: string;
};

export function inspectDatabaseUrl(key: string, value: string | undefined): DatabaseUrlCandidate {
  const raw = value?.trim();
  if (!raw) return { key, value: raw, ok: false, reason: "empty" };

  if (PLACEHOLDER_PATTERN.test(raw)) {
    return { key, value: raw, ok: false, reason: "contains placeholder text" };
  }

  try {
    const url = new URL(raw);
    if (!["postgresql:", "postgres:"].includes(url.protocol)) {
      return { key, value: raw, ok: false, reason: `invalid protocol ${url.protocol}` };
    }
    if (!url.hostname) return { key, value: raw, ok: false, reason: "missing hostname" };
    if (!url.pathname || url.pathname === "/") return { key, value: raw, ok: false, reason: "missing database name" };
    return { key, value: raw, ok: true, reason: "ok" };
  } catch (error) {
    return {
      key,
      value: raw,
      ok: false,
      reason: error instanceof Error ? error.message : "invalid URL"
    };
  }
}

export function getDatabaseUrlCandidates(env: NodeJS.ProcessEnv = process.env) {
  return DATABASE_ENV_KEYS.map((key) => inspectDatabaseUrl(key, env[key]));
}

export function resolveDatabaseUrl(env: NodeJS.ProcessEnv = process.env, allowLocalFallback = process.env.NODE_ENV !== "production") {
  const valid = getDatabaseUrlCandidates(env).find((candidate) => candidate.ok && candidate.value);
  if (valid?.value) return valid.value;

  if (allowLocalFallback) return DEFAULT_LOCAL_DATABASE_URL;
  return DEFAULT_LOCAL_DATABASE_URL;
}

export function getDatabaseUrlDiagnostics(env: NodeJS.ProcessEnv = process.env) {
  return getDatabaseUrlCandidates(env).map((candidate) => ({
    key: candidate.key,
    configured: Boolean(candidate.value),
    ok: candidate.ok,
    reason: candidate.reason
  }));
}
