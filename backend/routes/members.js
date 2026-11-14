import Router from "express";
import pool from "../database/pgPool.js";
import bcrypt from 'bcryptjs';
import jwt from "jsonwebtoken";
import { validateFields, validateId, parsePagination } from "./validation.js";
import { handleRouteError } from "./routeError.js";
import { requireAuth } from "./auth.js";
const membersRouter = Router();

membersRouter.post("/register", async (req, res) => {
    try {
        const { firstName, lastName, email, password } = validateFields(req.body, {
            firstName: { type: "string", required: true, min: 1, max: 80 },
            lastName: { type: "string", required: true, min: 1, max: 80 },
            email: { type: "string", required: true, min: 3, max: 254, normalize: value => value.toLowerCase(), pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/, patternMessage: "must be a valid email address" },
            password: { type: "string", required: true, min: 12, max: 72, preserveWhitespace: true, measureBytes: true },
        });

        const hashedPassword = await bcrypt.hash(password, 10);
        const newMember = await pool.query(
            "INSERT INTO members(firstName, lastName, email, password) VALUES ($1, $2, $3, $4) RETURNING id, firstName, lastName, email",
            [firstName.trim(), lastName.trim(), email, hashedPassword]
        );
        return res.status(201).json(newMember.rows[0]);

    } catch(e) {
        return handleRouteError(e, res, "members.register");
    }
});

membersRouter.post("/login", async (req, res) => {
    try {
        const { email, password } = validateFields(req.body, {
            email: { type: "string", required: true, min: 3, max: 254, normalize: value => value.toLowerCase(), pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/, patternMessage: "must be a valid email address" },
            password: { type: "string", required: true, min: 1, max: 72, preserveWhitespace: true, measureBytes: true },
        });

        const memberCheck = await pool.query("SELECT id, password FROM members WHERE email = $1",[email]);
        const member = memberCheck.rows[0];
        if (!member || !(await bcrypt.compare(password, member.password))) {
            return res.status(401).json({ error: "Wrong email or password" });
        }

        const secret = process.env.JWTSECRET;
        if (!secret || Buffer.byteLength(secret, "utf8") < 32) {
            console.error("JWTSECRET is missing or shorter than 32 bytes");
            return res.status(500).json({ error: "Internal server error" });
        }

        const token = jwt.sign({ memberId: member.id }, secret, { expiresIn: "15m", algorithm: "HS256", issuer: "bugtracker-api" });
        return res.status(200).json({ token, tokenType: "Bearer", expiresIn: 900 });
    } catch(e) {
        return handleRouteError(e, res, "members.login");
    }
});

// Registration and login remain public; member data requires a verified bearer token.
membersRouter.use(requireAuth);

membersRouter.get("/", async (req, res) => {
    try {
        const { page, limit, offset } = parsePagination(req.query);
        const members = await pool.query(
            `SELECT DISTINCT m.id, m.firstName, m.lastName, m.email
             FROM members m
             JOIN projects_members their_membership ON their_membership.memberId = m.id
             JOIN projects_members my_membership ON my_membership.projectId = their_membership.projectId
             WHERE my_membership.memberId = $1
             ORDER BY m.id LIMIT $2 OFFSET $3`,
            [req.user.memberId, limit, offset]
        );
        return res.status(200).json({ page, limit, members: members.rows });
    } catch(e) {
        return handleRouteError(e, res, "members.list");
    }
});

membersRouter.get("/:id", async (req, res) => {
    try {
        const id = validateId(req.params.id, "id");
        const member = await pool.query(
            `SELECT DISTINCT m.id, m.firstName, m.lastName, m.email
             FROM members m
             WHERE m.id = $1 AND (
                 m.id = $2 OR EXISTS (
                     SELECT 1 FROM projects_members mine
                     JOIN projects_members theirs ON theirs.projectId = mine.projectId
                     WHERE mine.memberId = $2 AND theirs.memberId = m.id
                 )
             )`,
            [id, req.user.memberId]
        );

        if(!member.rowCount) return res.status(404).json({ error: "Member not found" });
        return res.status(200).json(member.rows[0]);
    } catch(e) {
        return handleRouteError(e, res, "members.get");
    }
});

export default membersRouter;