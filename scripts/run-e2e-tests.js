const { spawn, spawnSync } = require("child_process");
const path = require("path");
const dotenv = require("dotenv");
const { PrismaClient } = require("@prisma/client");

const rootDir = path.resolve(__dirname, "..");
dotenv.config({ path: path.join(rootDir, ".env") });

const testDatabaseUrl = process.env.TEST_DATABASE_URL
  || "mysql://anxin:anxin_password@localhost:3308/anxin_test";
const shadowDatabaseUrl = process.env.SHADOW_DATABASE_URL;
const testUrl = new URL(testDatabaseUrl);
const children = [];

if (testUrl.pathname.replace(/^\//, "") !== "anxin_test") {
  throw new Error("TEST_DATABASE_URL must point to the dedicated anxin_test database.");
}
if (!shadowDatabaseUrl) {
  throw new Error("SHADOW_DATABASE_URL is required to prepare the E2E database.");
}

const commandEnv = {
  ...process.env,
  DATABASE_URL: testDatabaseUrl,
  NODE_ENV: "test",
  SERVER_PORT: "3000",
  CORS_ORIGIN: [
    "http://127.0.0.1:4273",
    "http://127.0.0.1:4274",
    "http://127.0.0.1:4275",
    "http://127.0.0.1:4276"
  ].join(",")
};

function run(command, args, options = {}) {
  const result = spawnSync(command, args, {
    cwd: rootDir,
    env: commandEnv,
    stdio: "inherit",
    ...options
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

function start(command, args) {
  const child = spawn(command, args, {
    cwd: rootDir,
    env: commandEnv,
    stdio: ["ignore", "pipe", "pipe"]
  });
  child.stdout.on("data", (chunk) => process.stdout.write(chunk));
  child.stderr.on("data", (chunk) => process.stderr.write(chunk));
  children.push(child);
  return child;
}

async function waitFor(url, timeoutMs = 30_000) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    try {
      const response = await fetch(url);
      if (response.ok) return;
    } catch (error) {
      // Service is still starting.
    }
    await new Promise((resolve) => setTimeout(resolve, 300));
  }
  throw new Error(`Timed out waiting for ${url}`);
}

async function stopChildren() {
  await Promise.all(children.map((child) => new Promise((resolve) => {
    if (child.exitCode !== null) return resolve();
    child.once("exit", resolve);
    child.kill("SIGTERM");
    setTimeout(() => {
      if (child.exitCode === null) child.kill("SIGKILL");
      resolve();
    }, 3000).unref();
  })));
}

async function main() {
  await ensureTestDatabase();
  resetTestDatabase();
  try {
    run(process.execPath, ["database/seed.js"]);
    run(process.execPath, ["e2e/seed.cjs"]);

    start(process.execPath, ["server/src/server.js"]);
    for (const [directory, port] of [
      ["apps/student/dist", "4273"],
      ["apps/counselor/dist", "4274"],
      ["apps/admin/dist", "4275"],
      ["apps/wechat-miniapp/dist/build/h5", "4276"]
    ]) {
      start(process.execPath, ["scripts/static-server.js", directory, port]);
    }

    await Promise.all([
      waitFor("http://127.0.0.1:3000/health"),
      waitFor("http://127.0.0.1:4273"),
      waitFor("http://127.0.0.1:4274"),
      waitFor("http://127.0.0.1:4275"),
      waitFor("http://127.0.0.1:4276")
    ]);

    run(process.execPath, [path.join(rootDir, "node_modules", "@playwright", "test", "cli.js"), "test"]);
  } finally {
    await stopChildren();
    resetTestDatabase();
  }
}

main().catch((error) => {
  console.error(error.message || error);
  process.exit(1);
});
