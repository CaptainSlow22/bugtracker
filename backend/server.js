import "dotenv/config";
import express from "express";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import { fileURLToPath } from "node:url";
import { resolve } from "node:path";
import pool from "./database/pgPool.js";
import membersRouter from "./routes/members.js";
import projectsRouter from "./routes/projects.js";
import bugsRouter from "./routes/bugs.js";
import commentsRouter from "./routes/comments.js";
import aiRouter from "./routes/ai.js";

const app = express();
const port = Number(process.env.PORT ?? 3000);
if (!Number.isInteger(port) || port < 1 || port > 65535) {
    throw new Error("PORT must be an integer between 1 and 65535");
}

const allowedOrigins = (process.env.CORS_ORIGINS ?? "")
    .split(",")
    .map(origin => origin.trim())
    .filter(Boolean);

app.disable("x-powered-by");
app.use(helmet());
app.use(cors({
    origin(origin, callback) {
        // Permit server-to-server and local health checks without an Origin header.
        if (!origin || allowedOrigins.includes(origin)) return callback(null, true);
        return callback(null, false);
    },
    credentials: false,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
}));
app.use(express.json({ limit: "32kb", strict: true }));

const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 300,
    standardHeaders: "draft-8",
    legacyHeaders: false,
    message: { error: "Too many requests. Try again later." },
});
const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 10,
    standardHeaders: "draft-8",
    legacyHeaders: false,
    message: { error: "Too many authentication attempts. Try again later." },
});
const aiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 10,
    standardHeaders: "draft-8",
    legacyHeaders: false,
    message: { error: "Too many AI requests. Try again later." },
});

app.get("/health", (req, res) => res.status(200).json({ status: "ok" }));
app.use("/members/register", authLimiter);
app.use("/members/login", authLimiter);
app.use("/ai", aiLimiter);
app.use(apiLimiter);
app.use("/members", membersRouter);
app.use("/projects", projectsRouter);
app.use("/bugs", bugsRouter);
app.use("/comments", commentsRouter);
app.use("/ai", aiRouter);

app.use((req, res) => res.status(404).json({ error: "Route not found" }));

// Keep parser, CORS, and unexpected errors in one safe response format.
app.use((error, req, res, next) => {
    if (res.headersSent) return next(error);
    if (error?.type === "entity.parse.failed") {
        return res.status(400).json({ error: "Request body must contain valid JSON" });
    }
    if (error?.status === 413 || error?.type === "entity.too.large") {
        return res.status(413).json({ error: "Request body is too large" });
    }
    console.error("[http.unhandled]", { code: error?.code, name: error?.name ?? "Error" });
    return res.status(500).json({ error: "Internal server error" });
});

export async function startServer() {
    // Fail at startup instead of accepting requests while the database is unavailable.
    await pool.query("SELECT 1");
    const server = app.listen(port, () => console.log(`Listening on port ${port}`));

    let shuttingDown = false;
    const shutdown = signal => {
        if (shuttingDown) return;
        shuttingDown = true;
        console.log(`Received ${signal}; closing server`);
        server.close(async error => {
            if (error) console.error("[server.close]", { code: error.code, name: error.name });
            try {
                await pool.end();
            } catch (poolError) {
                console.error("[database.close]", { code: poolError?.code, name: poolError?.name });
                process.exitCode = 1;
            }
            if (error) process.exitCode = 1;
        });
    };

    process.once("SIGINT", () => shutdown("SIGINT"));
    process.once("SIGTERM", () => shutdown("SIGTERM"));
    return server;
}

const isMain = process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isMain) {
    startServer().catch(async error => {
        console.error("[server.startup]", { code: error?.code, name: error?.name ?? "Error" });
        await pool.end().catch(() => {});
        process.exitCode = 1;
    });
}

export default app;