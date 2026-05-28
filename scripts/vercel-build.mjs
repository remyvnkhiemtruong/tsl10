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
  } catch {
    console.warn("\nPrisma migrate deploy failed. Falling back to prisma db push to bootstrap/sync the schema.");
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

console.log("Skipping prisma seed during Vercel build. Admin user was already bootstrapped; run seed manually only when needed.");

run("npx next build");
