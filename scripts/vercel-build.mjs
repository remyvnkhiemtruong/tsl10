import { execSync } from "node:child_process";

function run(command) {
  console.log(`\n> ${command}`);
  execSync(command, { stdio: "inherit", env: process.env });
}

run("npx prisma generate");

if (process.env.RUN_PRISMA_MIGRATE_DEPLOY === "true") {
  console.log("RUN_PRISMA_MIGRATE_DEPLOY=true, running production migrations...");
  run("npx prisma migrate deploy");
} else {
  console.log("Skipping prisma migrate deploy during build. Run migrations manually for production.");
}

run("npx next build");
