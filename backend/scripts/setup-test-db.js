import dotenv from "dotenv";
import pg from "pg";
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

const scriptDir = dirname(fileURLToPath(import.meta.url));
const backendDir = resolve(scriptDir, "..");
const envPath = resolve(backendDir, ".env.test");
const loaded = dotenv.config({ path: envPath });
if (loaded.error) {
    throw new Error(`Could not load ${envPath}. Copy .env.test.example to .env.test and configure it.`);
}

const dbName = process.env.TEST_PGDB ?? "";
if (process.env.TEST_DATABASE_ALLOW_RESET !== "true") {
    throw new Error("Refusing to set up the integration database: set TEST_DATABASE_ALLOW_RESET=true in .env.test");
}
if (!/^[a-z][a-z0-9_]*$/i.test(dbName) || !/_(test|testing)$/i.test(dbName)) {
    throw new Error("Refusing to set up the integration database: TEST_PGDB must be a simple name ending in _test or _testing");
}

const host = process.env.TEST_PGHOST;
const port = Number(process.env.TEST_PGPORT ?? 5432);
const user = process.env.TEST_PGUSER;
const password = process.env.TEST_PGPASS;
const adminDatabase = process.env.TEST_PG_ADMIN_DB ?? "postgres";
const adminUser = process.env.TEST_PG_ADMIN_USER ?? user;
const adminPassword = process.env.TEST_PG_ADMIN_PASS ?? password;
if (!host || !user || !password || !adminDatabase || !adminUser || !adminPassword) {
    throw new Error("Set TEST_PGHOST, TEST_PGUSER, and TEST_PGPASS in .env.test");
}
if (!Number.isInteger(port) || port < 1 || port > 65535) {
    throw new Error("TEST_PGPORT must be an integer between 1 and 65535");
}
if (dbName === adminDatabase) {
    throw new Error("TEST_PGDB must be different from TEST_PG_ADMIN_DB");
}

const ssl = process.env.TEST_PGSSL === "true" ? { rejectUnauthorized: true } : undefined;
const { Client } = pg;
const admin = new Client({ host, port, user: adminUser, password: adminPassword, database: adminDatabase, ssl });
await admin.connect();
try {
    const existing = await admin.query("SELECT 1 FROM pg_database WHERE datname = $1", [dbName]);
    if (existing.rowCount === 0) {
        // The name is restricted to letters, digits, and underscores above.
        await admin.query(`CREATE DATABASE "${dbName}"`);
        console.log(`Created PostgreSQL database ${dbName}.`);
    } else {
        console.log(`PostgreSQL database ${dbName} already exists; applying the idempotent initial schema.`);
    }
} finally {
    await admin.end();
}

const testClient = new Client({ host, port, user, password, database: dbName, ssl });
await testClient.connect();
try {
    for (const migrationFile of ["000_initial_schema.sql"]) {
        const migration = await readFile(resolve(backendDir, "migrations", migrationFile), "utf8");
        await testClient.query(migration);
        console.log(`Applied ${migrationFile} to ${dbName}.`);
    }
} finally {
    await testClient.end();
}
