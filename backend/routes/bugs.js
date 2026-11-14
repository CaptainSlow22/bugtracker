import Router from "express";
import pool from "../database/pgPool.js";
import { parsePagination } from "./validation.js";
import { handleRouteError } from "./routeError.js";
import { requireAuth } from "./auth.js";
const bugsRouter = Router();

bugsRouter.use(requireAuth);

bugsRouter.get("/", async (req, res) => {
    try {
        const { page, limit, offset } = parsePagination(req.query);
        const bugs = await pool.query(
            `SELECT b.id, b.projectId, b.title, b.description, b.status, b.priority, b.asignee, b.reporter, b.dueDate
             FROM bugs b
             JOIN projects_members pm ON pm.projectId = b.projectId
             WHERE pm.memberId = $1
             ORDER BY b.id DESC LIMIT $2 OFFSET $3`,
            [req.user.memberId, limit, offset]
        );
        return res.status(200).json({ page, limit, bugs: bugs.rows });
    } catch(e) {
        return handleRouteError(e, res, "bugs.listAll");
    }
});

export default bugsRouter;