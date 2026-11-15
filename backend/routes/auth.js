import jwt from "jsonwebtoken";
import { validateId } from "./validation.js";

export function requireAuth(req, res, next) {
    const secret = process.env.JWTSECRET;
    if (!secret || Buffer.byteLength(secret, "utf8") < 32) {
        console.error("JWTSECRET is missing or shorter than 32 bytes");
        return res.status(500).json({ error: "Internal server error" });
    }

    const authorization = req.get("authorization");
    const match = typeof authorization === "string" && authorization.match(/^Bearer ([^\s]+)$/i);
    if (!match) return res.status(401).json({ error: "Authentication required" });

    try {
        const payload = jwt.verify(match[1], secret, {
            algorithms: ["HS256"],
            issuer: "bugtracker-api",
        });
        const memberId = validateId(payload.memberId, "memberId");
        req.user = { memberId };
        return next();
    } catch {
        return res.status(401).json({ error: "Invalid or expired token" });
    }
}

export function requireProjectMember(pool) {
    return async (req, res, next) => {
        try {
            const projectId = validateId(req.params.projectId, "projectId");
            const result = await pool.query(
                "SELECT role FROM projects_members WHERE projectId = $1 AND memberId = $2",
                [projectId, req.user.memberId]
            );
            if (!result.rowCount) return res.status(404).json({ error: "Project not found" });
            req.project = { id: projectId, role: result.rows[0].role };
            return next();
        } catch (error) {
            if (error.status === 400) return res.status(400).json({ error: error.message, ...(error.details ? { details: error.details } : {}) });
            return next(error);
        }
    };
}

export function requireProjectOwner(req, res, next) {
    if (req.project?.role !== "owner") return res.status(403).json({ error: "Project owner access required" });
    return next();
}
