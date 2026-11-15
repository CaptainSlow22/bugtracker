import test from "node:test";
import assert from "node:assert/strict";
import { HttpError, parsePagination, readFilter, validateFields, validateId } from "../routes/validation.js";

test("validateFields trims strings, normalizes values, and ignores unknown fields", () => {
    assert.deepEqual(validateFields({ email: "  USER@EXAMPLE.COM ", extra: "ignored" }, {
        email: { type: "string", required: true, min: 3, max: 254, normalize: value => value.toLowerCase() },
    }), { email: "user@example.com" });
});

test("validateFields rejects non-object bodies and missing required fields", () => {
    assert.throws(() => validateFields(null, {}), error => error instanceof HttpError && error.status === 400);
    assert.throws(() => validateFields({}, { title: { type: "string", required: true } }), /Request validation failed/);
});

test("validateFields enforces types, allowed values, and UTF-8 byte limits", () => {
    const schema = { priority: { type: "string", required: true, values: ["LOW", "HIGH"] } };
    assert.throws(() => validateFields({ priority: "URGENT" }, schema), /Request validation failed/);
    assert.throws(() => validateFields({ priority: 2 }, schema), /Request validation failed/);
    assert.throws(() => validateFields({ password: "🔒🔒" }, {
        password: { type: "string", min: 1, max: 7, preserveWhitespace: true, measureBytes: true },
    }), /Request validation failed/);
});

test("validateFields accepts only real YYYY-MM-DD calendar dates", () => {
    assert.deepEqual(validateFields({ dueDate: "2024-02-29" }, { dueDate: { type: "date", required: true } }), { dueDate: "2024-02-29" });
    for (const dueDate of ["2025-02-29", "2025-13-01", "01-01-2025", "2025-1-1"]) {
        assert.throws(() => validateFields({ dueDate }, { dueDate: { type: "date", required: true } }), /Request validation failed/);
    }
});

test("validateId rejects zero, negatives, decimals, unsafe integers, and injection text", () => {
    for (const value of [0, -1, 1.2, "0", "01", "1 OR 1=1", "9007199254740992"]) {
        assert.throws(() => validateId(value), /Request validation failed/);
    }
    assert.equal(validateId("42"), 42);
});

test("parsePagination applies defaults and caps page size", () => {
    assert.deepEqual(parsePagination({}), { page: 1, limit: 25, offset: 0 });
    assert.deepEqual(parsePagination({ page: "3", limit: "500" }), { page: 3, limit: 100, offset: 200 });
});

test("parsePagination rejects malformed, zero, and overflowing values", () => {
    for (const query of [{ page: "0" }, { limit: "-1" }, { page: "1; DROP TABLE bugs" }, { page: "9007199254740991" }]) {
        assert.throws(() => parsePagination(query), error => error instanceof HttpError && error.status === 400);
    }
});

test("readFilter permits bounded strings and rejects other types or oversized values", () => {
    assert.equal(readFilter("  crash  "), "crash");
    assert.equal(readFilter(undefined), "");
    assert.throws(() => readFilter(["x"]), /must be a string/);
    assert.throws(() => readFilter("x".repeat(101)), /at most 100 characters/);
});
