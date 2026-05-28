import { execSync } from "node:child_process";

function run(command, options = {}) {
  console.log(`\n> ${command}`);
  execSync(command, { stdio: "inherit", env: process.env, ...options });
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

function runSchemaBootstrap() {
  try {
    run("npx prisma migrate deploy");
  } catch (error) {
    console.warn("\nPrisma migrate deploy failed. Falling back to prisma db push to bootstrap/sync the schema.");
    console.warn("This is intended for this first Vercel + Neon setup where an earlier init migration failed and left Prisma migration history blocked.");
    run("npx prisma db push --accept-data-loss");
  }
}

run("npm run validate:secondary-schools");
run("npx prisma generate");

if (process.env.RUN_PRISMA_MIGRATE_DEPLOY === "true") {
  if (prepareDatabaseUrl("database schema bootstrap")) runSchemaBootstrap();
} else {
  console.log("Skipping database schema bootstrap. Set RUN_PRISMA_MIGRATE_DEPLOY=true to run it during build.");
}

if (process.env.RUN_PRISMA_SEED === "true") {
  if (prepareDatabaseUrl("prisma seed")) run("npm run prisma:seed");
} else {
  console.log("Skipping prisma seed. Set RUN_PRISMA_SEED=true to seed during build.");
}

run("npx next build");
