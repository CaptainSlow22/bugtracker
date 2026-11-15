import test, { before, after, beforeEach } from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";
import dotenv from "dotenv";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import request from "supertest";
import express from "express";
import { createAiRouter } from "../routes/ai.js";

const testDir = dirname(fileURLToPath(import.meta.url));
const testEnvPath = process.env.DOTENV_CONFIG_PATH ?? resolve(testDir, "../.env.test");
const dotenvResult = dotenv.config({ path: testEnvPath });
if (dotenvResult.error && process.env.RUN_API_INTEGRATION_TESTS === "true") {
    throw new Error(`Could not load ${testEnvPath}; API integration tests require backend/.env.test`);
}

// Integration tests use TEST_* settings only. Never inherit the app's normal
// PG* configuration, and never truncate unless the explicit opt-in is present.
const testDbName = process.env.TEST_PGDB ?? "bugtracker_disabled_test";
const resetEnabled = process.env.TEST_DATABASE_ALLOW_RESET === "true";
if (resetEnabled && !/(_test|_testing)$/i.test(testDbName)) {
    throw new Error("Refusing to run API tests: TEST_PGDB must end in _test or _testing");
}
const databaseConfigured = resetEnabled && /(_test|_testing)$/i.test(testDbName)
    && Boolean(process.env.TEST_PGHOST && process.env.TEST_PGUSER && process.env.TEST_PGPASS);
if (process.env.RUN_API_INTEGRATION_TESTS === "true" && !databaseConfigured) {
    throw new Error("API integration tests were requested, but TEST_DATABASE_ALLOW_RESET=true and TEST_PGHOST/TEST_PGUSER/TEST_PGPASS/TEST_PGDB were not loaded from .env.test");
}

process.env.PGHOST = process.env.TEST_PGHOST ?? "127.0.0.1";
process.env.PGPORT = process.env.TEST_PGPORT ?? "5432";
process.env.PGUSER = process.env.TEST_PGUSER ?? "bugtracker_test_disabled";
process.env.PGPASS = process.env.TEST_PGPASS ?? "disabled";
process.env.PGDB = testDbName;
process.env.JWTSECRET = "test-only-secret-with-at-least-32-characters-long";
process.env.CORS_ORIGINS = "http://localhost:5173";
process.env.GROQ_API_KEY = "";

const { default: app } = await import("../server.js");
const { default: pool } = await import("../database/pgPool.js");
const secret = process.env.JWTSECRET;

async function resetRows() {
    await pool.query("TRUNCATE TABLE comments, bugs, projects_members, projects, members RESTART IDENTITY CASCADE");
}

async function insertMember(email = `person-${Date.now()}-${Math.random()}@example.test`, firstName = "Test", lastName = "Member") {
    const password = await bcrypt.hash("correct horse battery", 4);
    const result = await pool.query(
        "INSERT INTO members(firstName, lastName, email, password) VALUES ($1, $2, $3, $4) RETURNING id",
        [firstName, lastName, email, password]
    );
    return { id: result.rows[0].id, email, password: "correct horse battery" };
}

function auth(memberId) {
    const token = jwt.sign({ memberId }, secret, { algorithm: "HS256", issuer: "bugtracker-api", expiresIn: "15m" });
    return { Authorization: `Bearer ${token}` };
}

async function createProject(member, title = "Test project") {
    const response = await request(app).post("/projects/newProject").set(auth(member.id)).send({ title, description: "A project used in the API tests" });
    assert.equal(response.status, 201, JSON.stringify(response.body));
    return response.body;
}

async function createBug(projectId, memberId, values = {}) {
    const response = await request(app).post(`/projects/${projectId}/bugs`).set(auth(memberId)).send({
        title: "Intermittent service failure",
        description: "The service returns a 503 when the cache is cold.",
        status: "TO DO",
        priority: "HIGH",
        asignee: memberId,
        dueDate: "2030-02-28",
        ...values,
    });
    assert.equal(response.status, 201, JSON.stringify(response.body));
    return response.body;
}

function createAiTestApp(getClient) {
    const testApp = express();
    testApp.use(express.json());
    testApp.use("/ai", createAiRouter({ getClient, database: pool }));
    return testApp;
}

if (databaseConfigured) {
    before(async () => {
        for (const migrationFile of ["000_initial_schema.sql"]) {
            const migration = await readFile(resolve(testDir, "../migrations", migrationFile), "utf8");
            await pool.query(migration);
        }
        await resetRows();
    });
    beforeEach(resetRows);
    after(async () => { await pool.end(); });
}

test("health, JSON parser, and unknown route responses are stable", { skip: !databaseConfigured && "Set TEST_DATABASE_ALLOW_RESET=true and TEST_PG* variables to opt in to API integration tests." }, async () => {
    const health = await request(app).get("/health");
    assert.equal(health.status, 200);
    assert.deepEqual(health.body, { status: "ok" });
    const missing = await request(app).get("/does-not-exist");
    assert.equal(missing.status, 404);
    assert.deepEqual(missing.body, { error: "Route not found" });
    const malformed = await request(app).post("/members/register").set("Content-Type", "application/json").send("{bad json");
    assert.equal(malformed.status, 400);
    assert.match(malformed.body.error, /valid JSON/);
});

test("registration normalizes email, hides password, rejects weak and duplicate accounts, and login issues a bearer token", { skip: !databaseConfigured && "Set TEST_DATABASE_ALLOW_RESET=true and TEST_PG* variables to opt in to API integration tests." }, async () => {
    const registration = await request(app).post("/members/register").send({
        firstName: "  Ada ", lastName: " Lovelace ", email: " ADA@EXAMPLE.TEST ", password: "correct horse battery",
    });
    assert.equal(registration.status, 201);
    assert.equal(registration.body.firstname, "Ada");
    assert.equal(registration.body.lastname, "Lovelace");
    assert.equal(registration.body.email, "ada@example.test");
    assert.equal("password" in registration.body, false);

    const weak = await request(app).post("/members/register").send({ firstName: "A", lastName: "B", email: "weak@example.test", password: "short" });
    assert.equal(weak.status, 400);
    const duplicate = await request(app).post("/members/register").send({ firstName: "A", lastName: "B", email: "ada@example.test", password: "correct horse battery" });
    assert.equal(duplicate.status, 409);

    const login = await request(app).post("/members/login").send({ email: "ADA@example.test", password: "correct horse battery" });
    assert.equal(login.status, 200);
    assert.equal(login.body.tokenType, "Bearer");
    assert.equal(login.body.expiresIn, 900);
    assert.equal(jwt.verify(login.body.token, secret, { issuer: "bugtracker-api" }).memberId, registration.body.id);
    const wrongPassword = await request(app).post("/members/login").send({ email: "ada@example.test", password: "wrong password" });
    assert.equal(wrongPassword.status, 401);
});

test("private API routes reject missing, invalid, and expired bearer tokens", { skip: !databaseConfigured && "Set TEST_DATABASE_ALLOW_RESET=true and TEST_PG* variables to opt in to API integration tests." }, async () => {
    assert.equal((await request(app).get("/projects")).status, 401);
    assert.equal((await request(app).get("/projects").set("Authorization", "Bearer malformed")).status, 401);
    const expired = jwt.sign({ memberId: 1 }, secret, { algorithm: "HS256", issuer: "bugtracker-api", expiresIn: -1 });
    assert.equal((await request(app).get("/projects").set("Authorization", `Bearer ${expired}`)).status, 401);
});

test("projects are private to members and owner-only actions enforce role checks", { skip: !databaseConfigured && "Set TEST_DATABASE_ALLOW_RESET=true and TEST_PG* variables to opt in to API integration tests." }, async () => {
    const owner = await insertMember("owner@example.test", "Olivia", "Owner");
    const outsider = await insertMember("outsider@example.test", "Uma", "Outsider");
    const project = await createProject(owner, "Access controlled project");

    const ownerProjects = await request(app).get("/projects?page=1&limit=100").set(auth(owner.id));
    assert.equal(ownerProjects.status, 200);
    assert.equal(ownerProjects.body.projects.length, 1);
    assert.equal(ownerProjects.body.projects[0].role, "owner");
    assert.equal((await request(app).get(`/projects/${project.id}/members`).set(auth(outsider.id))).status, 404);

    const memberAdded = await request(app).post(`/projects/${project.id}/addMember/${outsider.id}`).set(auth(owner.id));
    assert.equal(memberAdded.status, 201);
    assert.equal(memberAdded.body.role, "member");
    assert.equal((await request(app).delete(`/projects/${project.id}`).set(auth(outsider.id))).status, 403);
    assert.equal((await request(app).post(`/projects/${project.id}/addMember/${owner.id}`).set(auth(outsider.id))).status, 403);
    assert.equal((await request(app).delete(`/projects/${project.id}/deleteMember/${owner.id}`).set(auth(owner.id))).status, 400);

    const members = await request(app).get(`/projects/${project.id}/members`).set(auth(outsider.id));
    assert.equal(members.status, 200);
    assert.equal(members.body.length, 2);
    const listedMembers = await request(app).get("/members?page=1&limit=100").set(auth(owner.id));
    assert.equal(listedMembers.body.members.some(member => member.id === outsider.id), true);
    assert.equal((await request(app).get(`/members/${outsider.id}`).set(auth(owner.id))).status, 200);
});

test("bug CRUD validates fields, checks assignee membership, filters safely, and paginates", { skip: !databaseConfigured && "Set TEST_DATABASE_ALLOW_RESET=true and TEST_PG* variables to opt in to API integration tests." }, async () => {
    const owner = await insertMember("bug-owner@example.test");
    const outsider = await insertMember("bug-outsider@example.test");
    const project = await createProject(owner);
    const invalid = await request(app).post(`/projects/${project.id}/bugs`).set(auth(owner.id)).send({ title: "X", description: "Bad", status: "invalid", priority: "HIGH", asignee: owner.id, dueDate: "2030-02-28" });
    assert.equal(invalid.status, 400);
    const badAssignee = await request(app).post(`/projects/${project.id}/bugs`).set(auth(owner.id)).send({ title: "X", description: "Bad assignee", status: "TO DO", priority: "HIGH", asignee: outsider.id, dueDate: "2030-02-28" });
    assert.equal(badAssignee.status, 400);
    const badDate = await request(app).post(`/projects/${project.id}/bugs`).set(auth(owner.id)).send({ title: "X", description: "Bad date", status: "TO DO", priority: "HIGH", asignee: owner.id, dueDate: "2030-02-30" });
    assert.equal(badDate.status, 400);
    const invalidResolution = await request(app).post(`/projects/${project.id}/bugs`).set(auth(owner.id)).send({ title: "X", description: "Resolution before done", status: "TO DO", priority: "HIGH", asignee: owner.id, dueDate: "2030-02-28", resolution: "Not completed yet" });
    assert.equal(invalidResolution.status, 400);

    const injectionText = "' OR 1=1; DROP TABLE bugs; --";
    const bug = await createBug(project.id, owner.id, { title: injectionText });
    assert.equal(bug.title, injectionText);
    const otherBug = await createBug(project.id, owner.id, { title: "Another issue", status: "IN PROGRESS", priority: "LOW" });
    const list = await request(app).get(`/projects/${project.id}/bugs?page=1&limit=1`).set(auth(owner.id));
    assert.equal(list.status, 200);
    assert.equal(list.body.bugs.length, 1);
    assert.equal(list.body.limit, 1);
    const injectedFilter = await request(app).get(`/projects/${project.id}/bugs?filter=${encodeURIComponent("%' OR 1=1 --")}`).set(auth(owner.id));
    assert.equal(injectedFilter.status, 200);
    assert.equal(injectedFilter.body.bugs.length, 0);
    assert.equal((await pool.query("SELECT count(*)::int AS count FROM bugs")).rows[0].count, 2);

    const update = await request(app).put(`/projects/${project.id}/bugs/${bug.id}`).set(auth(owner.id)).send({
        title: "Resolved after cache warmup", description: "Updated reproduction steps.", status: "DONE", priority: "MEDIUM", asignee: owner.id, dueDate: "2030-03-01", resolution: "Restarted the cache client after correcting its endpoint.",
    });
    assert.equal(update.status, 200);
    assert.equal(update.body.status, "DONE");
    assert.equal(update.body.resolution, "Restarted the cache client after correcting its endpoint.");
    const updatedBug = await request(app).get(`/projects/${project.id}/bugs/${bug.id}`).set(auth(owner.id));
    assert.equal(updatedBug.status, 200);
    assert.equal(updatedBug.body.resolution, update.body.resolution);
    assert.equal((await request(app).delete(`/projects/${project.id}/bugs/${otherBug.id}`).set(auth(owner.id))).status, 200);
    assert.equal((await request(app).get(`/projects/${project.id}/bugs/${otherBug.id}`).set(auth(owner.id))).status, 404);
});

test("AI retrieval uses resolved bugs from this project only and rejects non-members", { skip: !databaseConfigured && "Set TEST_DATABASE_ALLOW_RESET=true and TEST_PG* variables to opt in to API integration tests." }, async () => {
    const owner = await insertMember("ai-project-owner@example.test");
    const outsider = await insertMember("ai-project-outsider@example.test");
    const project = await createProject(owner, "AI retrieval project");
    const outsiderProject = await createProject(outsider, "Other project");
    const currentBug = await createBug(project.id, owner.id, {
        title: "Cache cold start returns 503",
        description: "API returns 503 when the cache is cold during startup.",
    });
    const matchingResolution = "Corrected the stale cache endpoint and restarted the client.";
    const resolvedBug = await createBug(project.id, owner.id, {
        title: "Cache initialization returns 503",
        description: "The API returned 503 during a cold cache startup.",
        status: "DONE",
        resolution: matchingResolution,
    });
    await createBug(outsiderProject.id, outsider.id, {
        title: "Cache cold start returns 503",
        description: "Same keywords in another project.",
        status: "DONE",
        resolution: "This resolution must remain private to another project.",
    });

    let providerCalled = false;
    let sentContext = "";
    const aiApp = createAiTestApp(() => ({ chat: { completions: { create: async input => {
        providerCalled = true;
        sentContext = input.messages[1].content;
        return { choices: [{ message: { content: JSON.stringify({
            hypotheses: [{ cause: "A stale cache endpoint may cause the failure.", confidence: "medium", evidence: ["The project has a resolved cache endpoint issue."], similarBugIds: [resolvedBug.id] }],
            verificationSteps: ["Compare the configured endpoint with the active cache service."],
            limitations: ["No source code or logs were supplied."],
        }) } }] };
    } } } }));

    const response = await request(aiApp).post("/ai/debug-advice").set(auth(owner.id)).send({ projectId: project.id, bugId: currentBug.id });
    assert.equal(response.status, 200, JSON.stringify(response.body));
    assert.deepEqual(response.body.similarBugs.map(bug => bug.id), [resolvedBug.id]);
    assert.equal(response.body.similarBugs[0].resolution, matchingResolution);
    assert.match(sentContext, /Corrected the stale cache endpoint/);
    assert.doesNotMatch(sentContext, /must remain private to another project/);

    providerCalled = false;
    const forbidden = await request(aiApp).post("/ai/debug-advice").set(auth(outsider.id)).send({ projectId: project.id, bugId: currentBug.id });
    assert.equal(forbidden.status, 404);
    assert.equal(providerCalled, false);
});

test("comments derive the author from auth, limit edits to their author, and cascade with bug deletion", { skip: !databaseConfigured && "Set TEST_DATABASE_ALLOW_RESET=true and TEST_PG* variables to opt in to API integration tests." }, async () => {
    const owner = await insertMember("comment-owner@example.test");
    const collaborator = await insertMember("comment-member@example.test");
    const project = await createProject(owner);
    assert.equal((await request(app).post(`/projects/${project.id}/addMember/${collaborator.id}`).set(auth(owner.id))).status, 201);
    const bug = await createBug(project.id, owner.id);
    const created = await request(app).post(`/projects/${project.id}/bugs/${bug.id}/comments`).set(auth(collaborator.id)).send({ content: "I can reproduce this." , memberId: owner.id });
    assert.equal(created.status, 201);
    assert.equal(created.body.memberid, collaborator.id);
    assert.equal((await request(app).put(`/projects/${project.id}/bugs/${bug.id}/comments/${created.body.id}`).set(auth(owner.id)).send({ content: "Impersonated edit" })).status, 404);
    const edited = await request(app).put(`/projects/${project.id}/bugs/${bug.id}/comments/${created.body.id}`).set(auth(collaborator.id)).send({ content: "Confirmed on the latest build." });
    assert.equal(edited.status, 200);
    assert.equal(edited.body.content, "Confirmed on the latest build.");
    const listed = await request(app).get(`/projects/${project.id}/bugs/${bug.id}/comments`).set(auth(owner.id));
    assert.equal(listed.status, 200);
    assert.equal(listed.body[0].content, "Confirmed on the latest build.");
    assert.equal((await request(app).delete(`/projects/${project.id}/bugs/${bug.id}`).set(auth(owner.id))).status, 200);
    assert.equal((await pool.query("SELECT count(*)::int AS count FROM comments")).rows[0].count, 0);
});

test("global bug and comment lists only expose projects the authenticated user belongs to", { skip: !databaseConfigured && "Set TEST_DATABASE_ALLOW_RESET=true and TEST_PG* variables to opt in to API integration tests." }, async () => {
    const member = await insertMember("visible@example.test");
    const outsider = await insertMember("hidden@example.test");
    const project = await createProject(member);
    const bug = await createBug(project.id, member.id);
    const comment = await request(app).post(`/projects/${project.id}/bugs/${bug.id}/comments`).set(auth(member.id)).send({ content: "Visible to project members" });
    assert.equal(comment.status, 201);

    assert.equal((await request(app).get("/bugs").set(auth(member.id))).body.bugs.length, 1);
    assert.equal((await request(app).get("/comments").set(auth(member.id))).body.comments.length, 1);
    assert.equal((await request(app).get("/bugs").set(auth(outsider.id))).body.bugs.length, 0);
    assert.equal((await request(app).get("/comments").set(auth(outsider.id))).body.comments.length, 0);
});

test("owner project deletion removes dependent bugs and comments transactionally", { skip: !databaseConfigured && "Set TEST_DATABASE_ALLOW_RESET=true and TEST_PG* variables to opt in to API integration tests." }, async () => {
    const owner = await insertMember("delete-owner@example.test");
    const project = await createProject(owner);
    const bug = await createBug(project.id, owner.id);
    assert.equal((await request(app).post(`/projects/${project.id}/bugs/${bug.id}/comments`).set(auth(owner.id)).send({ content: "Will be removed" })).status, 201);
    const deleted = await request(app).delete(`/projects/${project.id}`).set(auth(owner.id));
    assert.equal(deleted.status, 200);
    assert.equal((await pool.query("SELECT count(*)::int AS count FROM bugs")).rows[0].count, 0);
    assert.equal((await pool.query("SELECT count(*)::int AS count FROM comments")).rows[0].count, 0);
});
