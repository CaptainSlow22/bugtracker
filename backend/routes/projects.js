import Router from "express";
import pool from "../database/pgPool.js";
import { validateFields, validateId, parsePagination, readFilter } from "./validation.js";
import { handleRouteError } from "./routeError.js";
import { requireAuth, requireProjectMember, requireProjectOwner } from "./auth.js";
const projectsRouter = Router();

projectsRouter.use(requireAuth);

projectsRouter.post("/newProject", async (req, res) => {
    let client;
    try {
        const { title, description } = validateFields(req.body, {
            title: { type: "string", required: true, min: 1, max: 120 },
            description: { type: "string", required: true, min: 1, max: 10000 },
        });

        client = await pool.connect();
        await client.query("BEGIN");
        const newProject = await client.query("INSERT INTO projects(title, description) VALUES ($1, $2) RETURNING id, title, description", [title, description]);
        await client.query("INSERT INTO projects_members(projectId, memberId, role) VALUES ($1, $2, 'owner')", [newProject.rows[0].id, req.user.memberId]);
        await client.query("COMMIT");
        return res.status(201).json(newProject.rows[0]);
    } catch(e) {
        if (client) {
            try { await client.query("ROLLBACK"); } catch (rollbackError) {
                console.error("[projects.create.rollback]", { code: rollbackError?.code, name: rollbackError?.name });
            }
        }
        return handleRouteError(e, res, "projects.create");
    } finally {
        client?.release();
    }
});

projectsRouter.use("/:projectId", requireProjectMember(pool));

projectsRouter.get("/", async (req, res) => {
    try {
        const { page, limit, offset } = parsePagination(req.query);
        const projects = await pool.query(
            `SELECT p.id, p.title, p.description, pm.role
             FROM projects p JOIN projects_members pm ON pm.projectId = p.id
             WHERE pm.memberId = $1
             ORDER BY p.id DESC LIMIT $2 OFFSET $3`,
            [req.user.memberId, limit, offset]
        );
        return res.status(200).json({ page, limit, projects: projects.rows });
    } catch(e) {
        return handleRouteError(e, res, "projects.list");
    }
});

projectsRouter.delete("/:id", requireProjectOwner, async (req, res) => {
    let client;
    try {
        const id = req.params.id;

        const projectId = validateId(id, "id");

        client = await pool.connect();
        await client.query("BEGIN");
        await client.query("DELETE FROM comments WHERE bugId IN (SELECT id FROM bugs WHERE projectId = $1)", [projectId]);
        await client.query("DELETE FROM bugs WHERE projectId = $1", [projectId]);
        await client.query("DELETE FROM projects_members WHERE projectId = $1", [projectId]);
        const deletedProject = await client.query("DELETE FROM projects WHERE id = $1 RETURNING id, title, description", [projectId]);

        if(!deletedProject.rowCount) {
            await client.query("ROLLBACK");
            return res.status(404).json({ error: "Project not found" });
        }
        await client.query("COMMIT");
        return res.status(200).json(deletedProject.rows[0]);
    } catch(e) {
        if (client) {
            try { await client.query("ROLLBACK"); } catch (rollbackError) {
                console.error("[projects.delete.rollback]", { code: rollbackError?.code, name: rollbackError?.name });
            }
        }
        return handleRouteError(e, res, "projects.delete");
    } finally {
        client?.release();
    }
});

projectsRouter.post("/:projectId/addMember/:memberId", requireProjectOwner, async (req, res) => {
    try {
        const projectId = validateId(req.params.projectId, "projectId");
        const memberId = validateId(req.params.memberId, "memberId");

        const addedMember = await pool.query("INSERT INTO projects_members(projectId, memberId, role) VALUES ($1, $2, 'member') RETURNING projectId, memberId, role", [projectId, memberId]);
        
        return res.status(201).json(addedMember.rows[0]);
    } catch(e) {
        return handleRouteError(e, res, "projects.addMember");
    }
});

projectsRouter.delete("/:projectId/deleteMember/:memberId", requireProjectOwner, async (req, res) => {
    try {
        const projectId = validateId(req.params.projectId, "projectId");
        const memberId = validateId(req.params.memberId, "memberId");

        if (memberId === req.user.memberId) return res.status(400).json({ error: "Project owner cannot remove themselves" });
        const deletedMember = await pool.query("DELETE FROM projects_members WHERE projectId = $1 AND memberId = $2 AND role <> 'owner' RETURNING projectId, memberId", [projectId, memberId]);
        
        if(!deletedMember.rowCount) return res.status(404).json({ error: "Project membership not found" });
        return res.status(200).json(deletedMember.rows[0]);
    } catch(e) {
        return handleRouteError(e, res, "projects.removeMember");
    }
});

projectsRouter.get("/:projectId/members", async (req, res) => {
    try {
        const projectId = validateId(req.params.projectId, "projectId");

        const projectMembers = await pool.query("SELECT m.id, m.firstName, m.lastName FROM members m INNER JOIN projects_members pm ON pm.memberId = m.id WHERE pm.projectId = $1", [projectId]);

        return res.status(200).json(projectMembers.rows);
    } catch(e) {
        return handleRouteError(e, res, "projects.listMembers");
    }
});

projectsRouter.post("/:projectId/bugs", async (req, res) => {
    try {
        const projectId = validateId(req.params.projectId, "projectId");
        const { title, description, status, priority, asignee, dueDate, resolution } = validateFields(req.body, {
            title: { type: "string", required: true, min: 1, max: 200 },
            description: { type: "string", required: true, min: 1, max: 20000 },
            status: { type: "string", required: true, min: 1, max: 20, values: ["TO DO", "IN PROGRESS", "DONE"] },
            priority: { type: "string", required: true, min: 1, max: 10, values: ["LOW", "MEDIUM", "HIGH"] },
            asignee: { type: "id", required: true },
            dueDate: { type: "date", required: true },
            resolution: { type: "string", min: 1, max: 10000 },
        });
        if (resolution && status !== "DONE") return res.status(400).json({ error: "Resolution notes are only allowed for completed bugs" });

        const assignedMember = await pool.query(
            "SELECT 1 FROM projects_members WHERE projectId = $1 AND memberId = $2",
            [projectId, asignee]
        );
        if (!assignedMember.rowCount) return res.status(400).json({ error: "Assignee must belong to the project" });
        
        const newBug = await pool.query("INSERT INTO bugs(projectId, title, description, status, priority, asignee, reporter, dueDate, resolution) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING id, projectId, title, description, status, priority, asignee, reporter, dueDate, resolution", [projectId, title, description, status, priority, asignee, req.user.memberId, dueDate, resolution ?? null]);

        return res.status(201).json(newBug.rows[0]);
    } catch(e) {
        return handleRouteError(e, res, "bugs.create");
    }
});

projectsRouter.put("/:projectId/bugs/:id", async (req, res) => {
    try {
        const projectId = validateId(req.params.projectId, "projectId");
        const id = validateId(req.params.id, "id");
        const { title, description, status, priority, asignee, dueDate, resolution } = validateFields(req.body, {
            title: { type: "string", required: true, min: 1, max: 200 },
            description: { type: "string", required: true, min: 1, max: 20000 },
            status: { type: "string", required: true, min: 1, max: 20, values: ["TO DO", "IN PROGRESS", "DONE"] },
            priority: { type: "string", required: true, min: 1, max: 10, values: ["LOW", "MEDIUM", "HIGH"] },
            asignee: { type: "id", required: true },
            dueDate: { type: "date", required: true },
            resolution: { type: "string", min: 1, max: 10000 },
        });
        if (resolution && status !== "DONE") return res.status(400).json({ error: "Resolution notes are only allowed for completed bugs" });

        const assignedMember = await pool.query(
            "SELECT 1 FROM projects_members WHERE projectId = $1 AND memberId = $2",
            [projectId, asignee]
        );
        if (!assignedMember.rowCount) return res.status(400).json({ error: "Assignee must belong to the project" });
        
        const updatedBug = await pool.query("UPDATE bugs SET title = $1, description = $2, status = $3, priority = $4, asignee = $5, dueDate = $6, resolution = $7 WHERE projectId = $8 AND id = $9 RETURNING id, projectId, title, description, status, priority, asignee, reporter, dueDate, resolution", [title, description, status, priority, asignee, dueDate, resolution ?? null, projectId, id]);
        if(!updatedBug.rowCount) return res.status(404).json({ error: "Bug not found" });
        return res.status(200).json(updatedBug.rows[0]);
    } catch(e) {
        return handleRouteError(e, res, "bugs.update");
    }
});

projectsRouter.delete("/:projectId/bugs/:id", async (req, res) => {
    try {
        const projectId = validateId(req.params.projectId, "projectId");
        const id = validateId(req.params.id, "id");
        
        const deletedBug = await pool.query("DELETE FROM bugs WHERE projectId = $1 AND id = $2 RETURNING id, projectId, title, description, status, priority, asignee, reporter, dueDate",[projectId, id]);
        if(!deletedBug.rowCount) return res.status(404).json({ error: "Bug not found" });
        return res.status(200).json(deletedBug.rows[0]);
    } catch(e) {
        return handleRouteError(e, res, "bugs.delete");
    }
});

projectsRouter.get("/:projectId/bugs", async (req, res) => {
    try {
        const projectId = validateId(req.params.projectId, "projectId");
        const { page, limit, offset } = parsePagination(req.query);
        const filter = readFilter(req.query.filter);

        let query = "SELECT id, projectId, title, description, status, priority, asignee, reporter, dueDate FROM bugs WHERE projectId = $1";
        let queryParams = [projectId];

        if (filter) {
            query += " AND (title ILIKE $" + (queryParams.length + 1) + " OR description ILIKE $" + (queryParams.length + 1) + ")";
            queryParams.push(`%${filter}%`);
        }

        query += " ORDER BY id DESC LIMIT $" + (queryParams.length + 1) + " OFFSET $" + (queryParams.length + 2);
        queryParams.push(limit, offset);

        const bugs = await pool.query(query, queryParams);

        return res.status(200).json({ page, limit, bugs: bugs.rows });
    } catch (e) {
        return handleRouteError(e, res, "bugs.list");
    }
});


projectsRouter.get("/:projectId/bugs/:bugId", async (req, res) => {
    try {
        const projectId = validateId(req.params.projectId, "projectId");
        const bugId = validateId(req.params.bugId, "bugId");

        const bug = await pool.query("SELECT id, projectId, title, description, status, priority, asignee, reporter, dueDate, resolution FROM bugs WHERE projectId = $1 AND id = $2", [projectId, bugId]);

        if(!bug.rowCount) return res.status(404).json({ error: "Bug not found" });
        return res.status(200).json(bug.rows[0]);
    } catch(error) {
        return handleRouteError(error, res, "bugs.get");
    }
});

projectsRouter.post("/:projectId/bugs/:bugId/comments", async (req, res) => {
    try {
        const projectId = validateId(req.params.projectId, "projectId");
        const bugId = validateId(req.params.bugId, "bugId");
        const { content } = validateFields(req.body, {
            content: { type: "string", required: true, min: 1, max: 5000 },
        });

        const newComment = await pool.query("INSERT INTO comments(bugId, memberId, content) SELECT b.id, $3, $4 FROM bugs b WHERE b.projectId = $1 AND b.id = $2 RETURNING id, bugId, memberId, content, createdAt, updatedAt",[projectId, bugId, req.user.memberId, content]);

        if(!newComment.rowCount) return res.status(404).json({ error: "Bug not found in project" });

        const result = newComment.rows[0];

        return res.status(201).json(result);
    } catch(e) {
        return handleRouteError(e, res, "comments.create");
    }
});

projectsRouter.put("/:projectId/bugs/:bugId/comments/:id", async (req, res) => {
    try {
        const projectId = validateId(req.params.projectId, "projectId");
        const bugId = validateId(req.params.bugId, "bugId");
        const id = validateId(req.params.id, "id");
        const { content } = validateFields(req.body, {
            content: { type: "string", required: true, min: 1, max: 5000 },
        });

        const updatedComment = await pool.query("UPDATE comments c SET content = $1 FROM bugs b WHERE c.id = $2 AND c.bugId = b.id AND b.projectId = $3 AND b.id = $4 AND c.memberId = $5 RETURNING c.id, c.bugId, c.memberId, c.content, c.createdAt, c.updatedAt",[content, id, projectId, bugId, req.user.memberId]);

        if(!updatedComment.rowCount) return res.status(404).json({ error: "Comment not found" });

        const result = updatedComment.rows[0];

        return res.status(200).json(result);
    } catch(e) {
        return handleRouteError(e, res, "comments.update");
    }
});

projectsRouter.delete("/:projectId/bugs/:bugId/comments/:id", async (req, res) => {
    try {
        const projectId = validateId(req.params.projectId, "projectId");
        const bugId = validateId(req.params.bugId, "bugId");
        const id = validateId(req.params.id, "id");

        const deletedComment = await pool.query("DELETE FROM comments c USING bugs b WHERE c.id = $1 AND c.bugId = b.id AND b.projectId = $2 AND b.id = $3 AND c.memberId = $4 RETURNING c.id, c.bugId, c.memberId, c.content, c.createdAt, c.updatedAt",[id, projectId, bugId, req.user.memberId]);

        if(!deletedComment.rowCount) return res.status(404).json({ error: "Comment not found" });

        const result = deletedComment.rows[0];

        return res.status(200).json(result);
    } catch(e) {
        return handleRouteError(e, res, "comments.delete");
    }
});

projectsRouter.get("/:projectId/bugs/:bugId/comments", async (req, res) => {
    try {
        const projectId = validateId(req.params.projectId, "projectId");
        const bugId = validateId(req.params.bugId, "bugId");

        const comments = await pool.query("SELECT c.id, c.memberid, c.content, m.firstName, m.lastName, c.createdAt, c.updatedAt FROM comments c INNER JOIN members m ON m.id = c.memberId INNER JOIN bugs b ON b.id = c.bugId WHERE b.projectId = $1 AND b.id = $2 ORDER BY c.createdAt ASC",[projectId, bugId]);

        return res.status(200).json(comments.rows);
    } catch(e) {
        return handleRouteError(e, res, "comments.list");
    }
});

export default projectsRouter;
