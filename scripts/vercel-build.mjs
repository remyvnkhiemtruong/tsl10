import { execSync } from "node:child_process";

function run(command) {
  console.log(`\n> ${command}`);
  execSync(command, { stdio: "inherit", env: process.env });
}

function hasDatabaseUrl() {
  return Boolean(process.env.DATABASE_URL && process.env.DATABASE_URL.trim().length > 0);
}

run("npm run validate:secondary-schools");
run("npx prisma generate");

if (process.env.RUN_PRISMA_MIGRATE_DEPLOY === "true") {
  if (!hasDatabaseUrl()) {
    throw new Error("Missing DATABASE_URL. Cannot run prisma migrate deploy on Vercel.");
  }
  run("npx prisma migrate deploy");
} else {
  console.log("Skipping prisma migrate deploy. Set RUN_PRISMA_MIGRATE_DEPLOY=true to run migrations during build.");
}

if (process.env.RUN_PRISMA_SEED === "true") {
  if (!hasDatabaseUrl()) {
    throw new Error("Missing DATABASE_URL. Cannot seed database on Vercel.");
  }
  run("npm run prisma:seed");
} else {
  console.log("Skipping prisma seed. Set RUN_PRISMA_SEED=true to seed during build.");
}

run("npx next build");
