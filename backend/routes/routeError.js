import { HttpError } from "./validation.js";

/** Return a safe client response while keeping database/internal details in server logs. */
export function handleRouteError(error, res, context) {
    if (error instanceof HttpError) {
        return res.status(error.status).json({
            error: error.message,
            ...(error.details ? { details: error.details } : {}),
        });
    }

    // Map common PostgreSQL constraint/input errors without exposing SQL or schema details.
    const databaseResponses = {
        "23505": [409, "A record with these values already exists"],
        "23503": [400, "A referenced record does not exist"],
        "23502": [400, "A required field is missing"],
        "23514": [400, "A field value is not allowed"],
        "22P02": [400, "A field has an invalid format"],
    };
    if (databaseResponses[error?.code]) {
        const [status, message] = databaseResponses[error.code];
        return res.status(status).json({ error: message });
    }

    console.error(`[${context}]`, { code: error?.code, name: error?.name ?? "Error" });
    return res.status(500).json({ error: "Internal server error" });
}