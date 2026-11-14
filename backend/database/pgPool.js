import "dotenv/config";
import pg from "pg";

const { Pool } = pg;
const required = ["PGHOST", "PGUSER", "PGPASS", "PGDB"];
const missing = required.filter(name => !process.env[name]);
if (missing.length) {
    throw new Error(`Missing required database configuration: ${missing.join(", ")}`);
}

function positiveInteger(name, fallback, max) {
    const value = process.env[name] ?? String(fallback);
    if (!/^\d+$/.test(value)) throw new Error(`${name} must be a positive integer`);
    const parsed = Number(value);
    if (!Number.isSafeInteger(parsed) || parsed < 1 || parsed > max) {
        throw new Error(`${name} must be between 1 and ${max}`);
    }
    return parsed;
}

const port = positiveInteger("PGPORT", 5432, 65535);
const max = positiveInteger("PGPOOL_MAX", 10, 100);
const ssl = process.env.PGSSL === "true" ? { rejectUnauthorized: true } : undefined;

const pool = new Pool({
    host: process.env.PGHOST,
    port,
    user: process.env.PGUSER,
    password: process.env.PGPASS,
    database: process.env.PGDB,
    max,
    idleTimeoutMillis: 30_000,
    connectionTimeoutMillis: 5_000,
    allowExitOnIdle: false,
    ssl,
    application_name: "bugtracker-api",
});

// Idle clients can emit errors outside a request handler. Log a safe summary.
pool.on("error", error => {
    console.error("[database.idle-client]", { code: error?.code, name: error?.name ?? "Error" });
});

export default pool;
