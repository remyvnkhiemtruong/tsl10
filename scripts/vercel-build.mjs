import { execSync } from "node:child_process";

function run(command) {
  console.log(`\n> ${command}`);
  execSync(command, { stdio: "inherit", env: process.env });
}

const databaseEnvKeys = [
  "DATABASE_URL",
  "POSTGRES_PRISMA_URL",
  "POSTGRES_URL",
  "POSTGRES_URL_NON_POOLING",
  "POSTGRES_URL_UNPOOLED",
  "DATABASE_URL_UNPOOLED"
];

function isUsablePostgresUrl(value) {
  const raw = value?.trim();
  if (!raw) return false;
  if (/\b(USER|PASSWORD|HOST|PORT|DATABASE)\b|REPLACE_WITH|your-|xxxxxxxx/i.test(raw)) return false;
  try {
    const url = new URL(raw);
    return ["postgresql:", "postgres:"].includes(url.protocol) && Boolean(url.hostname) && Boolean(url.pathname && url.pathname !== "/");
  } catch {
    return false;
  }
}

function prepareDatabaseUrl(stepName) {
  const key = databaseEnvKeys.find((name) => isUsablePostgresUrl(process.env[name]));
  if (!key) {
    console.warn(`\nSkipping ${stepName}: no usable Postgres URL found. Connect Neon/Vercel Postgres and redeploy.`);
    console.warn("Tip: in Vercel Storage > Connect Project, set Custom Environment Variable Prefix to DATABASE.");
    return false;
  }
  process.env.DATABASE_URL = process.env[key];
  console.log(`Using ${key} for ${stepName}.`);
  return true;
}

run("npm run validate:secondary-schools");
run("npx prisma generate");

if (process.env.RUN_PRISMA_MIGRATE_DEPLOY === "true") {
  if (prepareDatabaseUrl("prisma migrate deploy")) run("npx prisma migrate deploy");
} else {
  console.log("Skipping prisma migrate deploy. Set RUN_PRISMA_MIGRATE_DEPLOY=true to run migrations during build.");
}

if (process.env.RUN_PRISMA_SEED === "true") {
  if (prepareDatabaseUrl("prisma seed")) run("npm run prisma:seed");
} else {
  console.log("Skipping prisma seed. Set RUN_PRISMA_SEED=true to seed during build.");
}

run("npx next build");
