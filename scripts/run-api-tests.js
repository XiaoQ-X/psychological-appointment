const { spawnSync } = require("child_process");
const path = require("path");
const dotenv = require("dotenv");
const { PrismaClient } = require("@prisma/client");

const rootDir = path.resolve(__dirname, "..");
dotenv.config({ path: path.join(rootDir, ".env") });

const testDatabaseUrl = process.env.TEST_DATABASE_URL
  || "mysql://anxin:anxin_password@localhost:3308/anxin_test";
const shadowDatabaseUrl = process.env.SHADOW_DATABASE_URL;
const testUrl = new URL(testDatabaseUrl);

if (testUrl.pathname.replace(/^\//, "") !== "anxin_test") {
  throw new Error("TEST_DATABASE_URL must point to the dedicated anxin_test database.");
}
if (!shadowDatabaseUrl) {
  throw new Error("SHADOW_DATABASE_URL is required to prepare the test database.");
}

const commandEnv = {
  ...process.env,
  DATABASE_URL: testDatabaseUrl,
  NODE_ENV: "test"
};

function run(command, args) {
  const result = spawnSync(command, args, {
    cwd: rootDir,
    env: commandEnv,
    stdio: "inherit"
  });
  if (result.status !== 0) {
    throw new Error(`${command} ${args.join(" ")} failed with exit code ${result.status}`);
  }
}

async function ensureTestDatabase() {
  const adminUrl = new URL(shadowDatabaseUrl);
  adminUrl.pathname = "/mysql";
  adminUrl.search = "";
  const admin = new PrismaClient({ datasourceUrl: adminUrl.toString() });
  try {
    await admin.$executeRawUnsafe(
      "CREATE DATABASE IF NOT EXISTS `anxin_test` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci"
    );
    const username = decodeURIComponent(testUrl.username);
    if (username && username !== "root") {
      await admin.$executeRawUnsafe(
        `GRANT ALL PRIVILEGES ON \`anxin_test\`.* TO '${username.replace(/'/g, "''")}'@'%'`
      );
    }
  } finally {
    await admin.$disconnect();
  }
}

function resetTestDatabase() {
  run(process.execPath, [
    require.resolve("prisma/build/index.js"),
    "migrate",
    "reset",
    "--force",
    "--skip-seed",
    "--skip-generate",
    "--schema",
    "database/schema.prisma"
  ]);
}

async function main() {
  await ensureTestDatabase();
  resetTestDatabase();
  try {
    run(process.execPath, ["database/seed.js"]);
    run(process.execPath, ["server/src/test-api.js"]);
  } finally {
    resetTestDatabase();
  }
}

main().catch((error) => {
  console.error(error.message || error);
  process.exit(1);
});
