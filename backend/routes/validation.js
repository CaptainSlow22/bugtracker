export class HttpError extends Error {
    constructor(status, message, details) {
        super(message);
        this.status = status;
        this.details = details;
    }
}

const isPlainObject = value => value !== null && typeof value === "object" && !Array.isArray(value);

/** Validate and normalize an allowlisted set of request fields. Unknown fields are ignored. */
export function validateFields(input, schema) {
    if (!isPlainObject(input)) throw new HttpError(400, "Request body must be a JSON object");

    const result = {};
    const issues = [];

    for (const [field, rule] of Object.entries(schema)) {
        const value = input[field];
        const missing = value === undefined || value === null || value === "";
        if (missing && rule.required) {
            issues.push({ field, message: "is required" });
            continue;
        }
        if (missing) continue;

        if (rule.type === "string") {
            if (typeof value !== "string") {
                issues.push({ field, message: "must be a string" });
                continue;
            }
            const normalized = rule.preserveWhitespace ? value : value.trim();
            const length = rule.measureBytes ? Buffer.byteLength(normalized, "utf8") : normalized.length;
            if (length < (rule.min ?? 0) || length > (rule.max ?? Infinity)) {
                const unit = rule.measureBytes ? "bytes" : "characters";
                issues.push({ field, message: `must be between ${rule.min ?? 0} and ${rule.max} ${unit}` });
                continue;
            }
            if (rule.pattern && !rule.pattern.test(normalized)) {
                issues.push({ field, message: rule.patternMessage ?? "has an invalid format" });
                continue;
            }
            const finalValue = rule.normalize ? rule.normalize(normalized) : normalized;
            if (rule.values && !rule.values.includes(finalValue)) {
                issues.push({ field, message: `must be one of: ${rule.values.join(", ")}` });
                continue;
            }
            result[field] = finalValue;
        } else if (rule.type === "id") {
            const validRepresentation = typeof value === "number"
                ? Number.isSafeInteger(value)
                : typeof value === "string" && /^[1-9]\d*$/.test(value);
            const id = Number(value);
            if (!validRepresentation || !Number.isSafeInteger(id) || id <= 0) {
                issues.push({ field, message: "must be a positive integer" });
                continue;
            }
            result[field] = id;
        } else if (rule.type === "date") {
            if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value) || Number.isNaN(Date.parse(`${value}T00:00:00Z`)) || new Date(`${value}T00:00:00Z`).toISOString().slice(0, 10) !== value) {
                issues.push({ field, message: "must be a valid date in YYYY-MM-DD format" });
                continue;
            }
            result[field] = value;
        }
    }

    if (issues.length) throw new HttpError(400, "Request validation failed", issues);
    return result;
}

export function validateId(value, field = "id") {
    return validateFields({ [field]: value }, { [field]: { type: "id", required: true } })[field];
}

export function parsePagination(query) {
    const parse = (value, name, fallback) => {
        if (value === undefined) return fallback;
        if (typeof value !== "string" || !/^\d+$/.test(value)) {
            throw new HttpError(400, `Query parameter '${name}' must be a positive integer`);
        }
        const parsed = Number(value);
        if (!Number.isSafeInteger(parsed) || parsed < 1) {
            throw new HttpError(400, `Query parameter '${name}' must be a positive integer`);
        }
        return parsed;
    };

    const page = parse(query.page, "page", 1);
    const requestedLimit = parse(query.limit, "limit", 25);
    const limit = Math.min(requestedLimit, 100);
    const offset = (page - 1) * limit;
    if (!Number.isSafeInteger(offset)) throw new HttpError(400, "Requested page is too large");
    return { page, limit, offset };
}

export function readFilter(value, maxLength = 100) {
    if (value === undefined) return "";
    if (typeof value !== "string") throw new HttpError(400, "Query parameter 'filter' must be a string");
    const filter = value.trim();
    if (filter.length > maxLength) throw new HttpError(400, `Query parameter 'filter' must be at most ${maxLength} characters`);
    return filter;
}