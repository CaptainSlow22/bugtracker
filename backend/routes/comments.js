import Router from "express"
import pool from "../database/pgPool.js";
import { parsePagination } from "./validation.js";
import { handleRouteError } from "./routeError.js";
import { requireAuth } from "./auth.js";
const commentsRouter = Router();

commentsRouter.use(requireAuth);

commentsRouter.get("/", async (req, res) => {
    try {
        const { page, limit, offset } = parsePagination(req.query);
        const comments = await pool.query(
            `SELECT c.id, c.bugId, c.memberId, c.content, c.createdAt, c.updatedAt
             FROM comments c
             JOIN bugs b ON b.id = c.bugId
             JOIN projects_members pm ON pm.projectId = b.projectId
             WHERE pm.memberId = $1
             ORDER BY c.id DESC LIMIT $2 OFFSET $3`,
            [req.user.memberId, limit, offset]
        );
        return res.status(200).json({ page, limit, comments: comments.rows });
    } catch(e) {
        return handleRouteError(e, res, "comments.listAll");
    }
});

export default commentsRouter;
