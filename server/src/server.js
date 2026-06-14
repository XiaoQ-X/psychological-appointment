const path = require("path");
const dotenv = require("dotenv");

dotenv.config({ path: path.resolve(__dirname, "../../.env") });
dotenv.config();

const app = require("./app");
const prisma = require("./db");

const port = Number(process.env.SERVER_PORT || 3000);

const server = app.listen(port, () => {
  console.log(`AnXin Psychology API listening on http://localhost:${port}`);
});

async function shutdown() {
  server.close(async () => {
    await prisma.$disconnect();
    process.exit(0);
  });
}

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
