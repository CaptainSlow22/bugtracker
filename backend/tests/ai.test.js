import test from "node:test";
import assert from "node:assert/strict";
import express from "express";
import request from "supertest";
import jwt from "jsonwebtoken";
import { createAiRouter } from "../routes/ai.js";

const secret = "test-secret-only-for-the-ai-router-test-32-bytes";
process.env.JWTSECRET = secret;
const token = jwt.sign({ memberId: 23 }, secret, { algorithm: "HS256", issuer: "bugtracker-api", expiresIn: "15m" });

const validContext = {
    current: { id: 52, projectId: 7, title: "Cache cold start returns 503", description: "API returns 503 after cache cold start." },
    similar: { id: 41, title: "Cache initialization timeout", description: "The cache failed during a cold start.", resolution: "The cache client used a stale endpoint." },
};

function createDatabase({ target = validContext.current, similar = validContext.similar } = {}) {
    const calls = [];
    return {
        calls,
        async query(sql, params) {
            calls.push({ sql, params });
            if (sql.includes("JOIN projects_members")) return { rows: target ? [target] : [], rowCount: target ? 1 : 0 };
            if (sql.includes("to_tsquery('simple'")) return { rows: similar ? [similar] : [], rowCount: similar ? 1 : 0 };
            throw new Error("Unexpected database query in AI route test");
        },
    };
}

function createApp({
    getClient = () => ({ chat: { completions: { create: async () => ({ choices: [{ message: { content: JSON.stringify({
        hypotheses: [{ cause: "The cache endpoint may be stale.", confidence: "medium", evidence: ["A resolved issue in this project records a stale cache endpoint."], similarBugIds: [41] }],
        verificationSteps: ["Compare the configured cache endpoint with the active service."],
        limitations: ["The source code and runtime logs were not provided."],
    }) } }] }) } } }),
    database = createDatabase(),
} = {}) {
    const app = express();
    app.use(express.json({ limit: "32kb" }));
    app.use("/ai", createAiRouter({ getClient, database }));
    return { app, database };
}

test("AI advice requires a verified bearer token", async () => {
    const { app } = createApp();
    assert.equal((await request(app).post("/ai/debug-advice").send({ projectId: 7, bugId: 52 })).status, 401);
    assert.equal((await request(app).post("/ai/debug-advice").set("Authorization", "Bearer invalid").send({ projectId: 7, bugId: 52 })).status, 401);
});

test("AI advice validates bug and project identifiers", async () => {
    const { app } = createApp();
    for (const body of [{}, { projectId: "1 OR 1=1", bugId: 52 }, { projectId: 7, bugId: 0 }]) {
        const response = await request(app).post("/ai/debug-advice").set("Authorization", `Bearer ${token}`).send(body);
        assert.equal(response.status, 400);
    }
});

test("AI advice does not reveal bugs outside the caller's project membership", async () => {
    let called = false;
    const database = createDatabase({ target: null });
    const { app } = createApp({
        database,
        getClient: () => { called = true; return null; },
    });
    const response = await request(app).post("/ai/debug-advice").set("Authorization", `Bearer ${token}`).send({ projectId: 7, bugId: 52 });
    assert.equal(response.status, 404);
    assert.equal(called, false);
});

test("AI advice returns a clear configuration error when no provider is configured", async () => {
    const { app } = createApp({ getClient: () => null });
    const response = await request(app).post("/ai/debug-advice").set("Authorization", `Bearer ${token}`).send({ projectId: 7, bugId: 52 });
    assert.equal(response.status, 503);
    assert.match(response.body.error, /not configured/);
});

test("AI advice retrieves same-project resolutions and returns validated structured advice", async () => {
    let received;
    const database = createDatabase();
    const { app } = createApp({
        database,
        getClient: () => ({ chat: { completions: { create: async input => {
            received = input;
            return { choices: [{ message: { content: JSON.stringify({
                hypotheses: [
                    { cause: "A stale cache endpoint may cause the failure.", confidence: "medium", evidence: ["A similar resolved bug records a stale endpoint."], similarBugIds: [41, 999] },
                ],
                verificationSteps: ["Compare the endpoint with the active cache service."],
                limitations: ["The source code and runtime logs were not provided."],
            }) } }] };
        } } } }),
    });
    const response = await request(app).post("/ai/debug-advice").set("Authorization", `Bearer ${token}`).send({ projectId: 7, bugId: 52 });
    assert.equal(response.status, 200, JSON.stringify(response.body));
    assert.equal(response.body.advice.hypotheses[0].similarBugIds.length, 1);
    assert.deepEqual(response.body.advice.hypotheses[0].similarBugIds, [41]);
    assert.deepEqual(response.body.similarBugs, [{ id: 41, title: "Cache initialization timeout", resolution: "The cache client used a stale endpoint." }]);
    assert.equal(received.model, "openai/gpt-oss-120b");
    assert.equal(received.max_completion_tokens, 1200);
    assert.match(received.messages[0].content, /valid JSON/);
    assert.match(received.messages[1].content, /cache client used a stale endpoint/i);
    assert.equal(database.calls.length, 2);
    assert.match(database.calls[0].sql, /JOIN projects_members/);
    assert.match(database.calls[1].sql, /b\.projectId = \$1/);
    assert.match(database.calls[1].sql, /b\.status = 'DONE'/);
    assert.deepEqual(database.calls[1].params.slice(0, 2), [7, 52]);
});

test("AI advice maps empty, malformed, and failed provider responses to safe gateway errors", async () => {
    const emptyApp = createApp({ getClient: () => ({ chat: { completions: { create: async () => ({ choices: [] }) } } }) }).app;
    const empty = await request(emptyApp).post("/ai/debug-advice").set("Authorization", `Bearer ${token}`).send({ projectId: 7, bugId: 52 });
    assert.equal(empty.status, 502);

    const malformedApp = createApp({ getClient: () => ({ chat: { completions: { create: async () => ({ choices: [{ message: { content: "not json" } }] }) } } }) }).app;
    const malformed = await request(malformedApp).post("/ai/debug-advice").set("Authorization", `Bearer ${token}`).send({ projectId: 7, bugId: 52 });
    assert.equal(malformed.status, 502);

    const failedApp = createApp({ getClient: () => ({ chat: { completions: { create: async () => { throw new Error("upstream secret detail"); } } } }) }).app;
    const failed = await request(failedApp).post("/ai/debug-advice").set("Authorization", `Bearer ${token}`).send({ projectId: 7, bugId: 52 });
    assert.equal(failed.status, 502);
    assert.doesNotMatch(JSON.stringify(failed.body), /upstream secret detail/);
});
