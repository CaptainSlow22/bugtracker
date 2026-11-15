import dotenv from "dotenv";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

const backendDir = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const loaded = dotenv.config({ path: resolve(backendDir, ".env.test") });
if (loaded.error) {
    throw new Error("Missing backend/.env.test. Copy .env.test.example and configure the test database first.");
}

const databaseName = process.env.TEST_PGDB ?? "";
if (process.env.TEST_DATABASE_ALLOW_RESET !== "true" || !/^[a-z][a-z0-9_]*_(test|testing)$/i.test(databaseName)) {
    throw new Error("Refusing to start the test API without TEST_DATABASE_ALLOW_RESET=true and a TEST_PGDB ending in _test or _testing");
}

for (const key of ["TEST_PGHOST", "TEST_PGUSER", "TEST_PGPASS"]) {
    if (!process.env[key]) throw new Error(`Missing ${key} in backend/.env.test`);
}

process.env.PGHOST = process.env.TEST_PGHOST;
process.env.PGPORT = process.env.TEST_PGPORT ?? "5432";
process.env.PGUSER = process.env.TEST_PGUSER;
process.env.PGPASS = process.env.TEST_PGPASS;
process.env.PGDB = databaseName;
process.env.PGSSL = process.env.TEST_PGSSL ?? "false";
process.env.PORT ??= "3300";
process.env.JWTSECRET = process.env.TEST_JWTSECRET ?? "bugtracker-integration-test-secret-32-bytes-minimum";
process.env.CORS_ORIGINS ??= `http://127.0.0.1:${process.env.TEST_UI_PORT ?? "5174"}`;
// The browser tests mock the AI endpoint. Prevent accidental use of a real key.
process.env.GROQ_API_KEY = "";

const { startServer } = await import("../server.js");
await startServer();
