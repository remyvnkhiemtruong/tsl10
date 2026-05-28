import { execSync } from "node:child_process";

function run(command) {
  console.log(`\n> ${command}`);
  execSync(command, { stdio: "inherit", env: process.env });
}

function getDatabaseUrlState() {
  const raw = process.env.DATABASE_URL?.trim();
  if (!raw) {
    return { ok: false, reason: "DATABASE_URL is missing." };
  }

  const placeholderPattern = /\b(USER|PASSWORD|HOST|PORT|DATABASE)\b|REPLACE_WITH|your-|xxxxxxxx/i;
  if (placeholderPattern.test(raw)) {
    return {
      ok: false,
      reason:
        "DATABASE_URL still contains placeholder text. Replace it with the real PostgreSQL connection string from Vercel/Neon/Supabase."
    };
  }

  try {
    const url = new URL(raw);
    if (!["postgresql:", "postgres:"].includes(url.protocol)) {
      return { ok: false, reason: `DATABASE_URL must start with postgresql:// or postgres://, got ${url.protocol}` };
    }
    if (!url.hostname) {
      return { ok: false, reason: "DATABASE_URL is missing a hostname." };
    }
    if (!url.pathname || url.pathname === "/") {
      return { ok: false, reason: "DATABASE_URL is missing the database name path." };
    }
    return { ok: true, reason: "DATABASE_URL looks valid." };
  } catch (error) {
    return {
      ok: false,
      reason:
        error instanceof Error
          ? `DATABASE_URL is not a valid URL: ${error.message}. If the password contains @, #, :, /, ?, &, %, encode it first.`
          : "DATABASE_URL is not a valid URL."
    };
  }
}

function shouldRunDatabaseStep(stepName) {
  const state = getDatabaseUrlState();
  if (state.ok) return true;

  console.warn(`\n⚠️  Skipping ${stepName} because DATABASE_URL is not usable.`);
  console.warn(`Reason: ${state.reason}`);
  console.warn("The Vercel build will continue, but database features will not work until DATABASE_URL is fixed and the project is redeployed.");
  console.warn("Use a real pooled PostgreSQL URL, for example: postgresql://user:encoded_password@host:5432/db?sslmode=require&schema=public\n");
  return false;
}

run("npm run validate:secondary-schools");
run("npx prisma generate");

if (process.env.RUN_PRISMA_MIGRATE_DEPLOY === "true") {
  if (shouldRunDatabaseStep("prisma migrate deploy")) {
    run("npx prisma migrate deploy");
  }
} else {
  console.log("Skipping prisma migrate deploy. Set RUN_PRISMA_MIGRATE_DEPLOY=true to run migrations during build.");
}

if (process.env.RUN_PRISMA_SEED === "true") {
  if (shouldRunDatabaseStep("prisma seed")) {
    run("npm run prisma:seed");
  }
} else {
  console.log("Skipping prisma seed. Set RUN_PRISMA_SEED=true to seed during build.");
}

run("npx next build");
