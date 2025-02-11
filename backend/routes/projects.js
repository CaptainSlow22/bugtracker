import Router from "express";
import pool from "../database/pgPool.js";
const projectsRouter = Router();

projectsRouter.post("/newProject", async (req, res) => {
    try {
        const {title, description} = req.body;

        if(!title || !description) {
            return res.status(400).send("Please provide the title");
        }

        const newProject = await pool.query("INSERT INTO projects(title, description) VALUES ($1, $2) RETURNING *", [title, description]);

        if(!newProject) {
            return res.status(500).send("Error creating new project");
        }

        const result = newProject.rows[0];

        return res.status(201).send(result);
    } catch(e) {
        console.error(e);
        return res.status(500).send("Internal server error");
    }
});

projectsRouter.get("/", async (req, res) => {
    try {
        const projects = await pool.query("SELECT * FROM projects", []);

        if(!projects) {
            return res.status(404).send("Projects not found");
        }

        const result = projects.rows;

        return res.status(200).send(result);
    } catch(e) {
        console.error(e);
        return res.status(500).send("Internal server error");
    }
});

projectsRouter.delete("/:id", async (req, res) => {
    try {
        const id = req.params.id;

        if(!id) {
            return res.status(400).send("Please provide the id");
        }

        const deletedProject = await pool.query("DELETE FROM projects WHERE id = $1 RETURNING *", [id]);

        if(!deletedProject) {
            return res.status(404).send("User not found");
        }

        const result = deletedProject.rows[0];

        return res.status(200).send(result);
    } catch(e) {
        console.error(e);
        return res.status(500).send("Internal server error");
    }
});

projectsRouter.post("/:projectId/addMember/:memberId", async (req, res) => {
    try {
        const projectId = req.params.projectId;
        const memberId = req.params.memberId;

        if(!projectId || !memberId) {
            return res.status(400).send("Please provide all required fields: projectId, memberId");
        }

        const addedMember = await pool.query("INSERT INTO projects_members(projectId, memberId) VALUES ($1, $2) RETURNING *", [projectId, memberId]);
        
        if(!addedMember) {
            return res.status(500).send("Error adding member to project");
        }

        const result = addedMember.rows[0];

        return res.status(201).send(result);
    } catch(e) {
        console.error(e);
        return res.status(500).send("Internal server error");
    }
});

projectsRouter.get("/:projectId/members", async (req, res) => {
    try {
        const projectId = req.params.projectId;

        if(!projectId) {
            return res.status(400).send("Please provide projectId");
        }

        const projectMembers = await pool.query("SELECT m.firstName, m.lastName FROM members m INNER JOIN projects_members pm ON pm.memberId = m.id WHERE pm.projectId = $1", [projectId]);

        if(!projectMembers) {
            return res.status(404).send("No members assigned");
        }

        const result = projectMembers.rows;

        return res.status(200).send(result);
    } catch(e) {
        console.error(e);
        return res.status(500).send("Internal server error");
    }
});

projectsRouter.post("/:projectId/bugs", async (req, res) => {
    try {
        const projectId = req.params.projectId;
        const {title, description, status, priority, asignee, reporter, dueDate} = req.body;

        if(!projectId) {
            return res.status(400).send("Please provide projectId");
        }
        
        if(!title || !description || !status || !priority || !asignee || !reporter || !dueDate) {
            return res.status(400).send("Please provide all required fields: title, description, status, priority, asignee, reporter, dueDate");
        }
        
        const newBug = await pool.query("INSERT INTO bugs(projectId, title, description, status, priority, asignee, reporter, dueDate) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *",[projectId, title, description, status, priority, asignee, reporter, dueDate]);

        if(!newBug) {
            return res.status(500).send("Error adding new bug");
        }

        const result = newBug.rows[0];

        return res.status(201).send(result);
    } catch(e) {
        console.error(e);
        return res.status(500).send("Internal server error");
    }
});

projectsRouter.put("/:projectId/bugs/:id", async (req, res) => {
    try {
        const projectId = req.params.projectId;
        const id = req.params.id;

        const {title, description, status, priority, asignee, dueDate} = req.body;

        if(!projectId) {
            return res.status(400).send("Please provide projectId");
        }

        if(!id) {
            return res.status(400).send("Please provide the id for the bug");
        }
        
        if(!title || !description || !status || !priority || !asignee || !dueDate) {
            return res.status(400).send("Please provide all required fields: title, description, status, priority, asignee, dueDate");
        }
        
        const updatedBug = await pool.query("UPDATE bugs SET title = $1, description = $2, status = $3, priority = $4, asignee = $5, dueDate = $6 WHERE id = $7 RETURNING *",[title, description, status, priority, asignee, dueDate, id]);

        if(!updatedBug) {
            return res.status(500).send("Error updating bug");
        }

        const result = updatedBug.rows[0];

        return res.status(201).send(result);
    } catch(e) {
        console.error(e);
        return res.status(500).send("Internal server error");
    }
});

projectsRouter.delete("/:projectId/bugs/:id", async (req, res) => {
    try {
        const projectId = req.params.projectId;
        const id = req.params.id;

        if(!projectId) {
            return res.status(400).send("Please provide projectId");
        }

        if(!id) {
            return res.status(400).send("Please provide the id for the bug");
        }
        
        const deletedBug = await pool.query("DELETE FROM bugs WHERE id = $1 RETURNING *",[id]);

        if(!deletedBug) {
            return res.status(500).send("Error deleting bug");
        }

        const result = deletedBug.rows[0];

        return res.status(200).send(result);
    } catch(e) {
        console.error(e);
        return res.status(500).send("Internal server error");
    }
});

projectsRouter.get("/:projectId/bugs", async (req, res) => {
    try {
        const projectId = req.params.projectId;

        if(!projectId) {
            return res.status(400).send("Please provide projectId");
        }
        const bugs = await pool.query("SELECT * FROM bugs WHERE projectId = $1", [projectId]);

        if(!bugs) {
            return res.status(404).send("No bugs found");
        }

        const result = bugs.rows;

        return res.status(200).send(result);
    } catch(e) {
        console.error(e);
        return res.status(500).send("Internal server error");
    }
});

projectsRouter.post("/:projectId/bugs/:bugId/comments", async (req, res) => {
    try {
        const projectId = req.params.projectId;
        const bugId = req.params.bugId;
        const {memberId, content} = req.body;

        console.log([projectId, memberId, content]);
        if(!projectId || !bugId) {
            return res.status(400).send("Please provide projectId");
        }

        if(!bugId) {
            return res.status(400).send("Please provide bugId");
        }

        if(!memberId || !content) {
            return res.status(400).send("Please provide all required fields: memberId, content");
        }

        const newComment = await pool.query("INSERT INTO comments(bugId, memberId, content) VALUES ($1, $2, $3) RETURNING *",[bugId, memberId, content]);

        if(!newComment) {
            return res.status(500).send("Error creating new comment");
        }

        const result = newComment.rows[0];

        return res.status(201).send(result);
    } catch(e) {
        console.error(e);
        return res.status(500).send("Internal server error");
    }
});

projectsRouter.put("/:projectId/bugs/:bugId/comments/:id", async (req, res) => {
    try {
        const projectId = req.params.projectId;
        const bugId = req.params.bugId;
        const id = req.params.id;
        const {content} = req.body;

        if(!projectId) {
            return res.status(400).send("Please provide projectId");
        }

        if(!bugId) {
            return res.status(400).send("Please provide projectId");
        }

        if(!id) {
            return res.status(400).send("Please provide the id of the comment");
        }

        if(!content) {
            return res.status(400).send("Please provide the content");
        }

        const updatedComment = await pool.query("UPDATE comments SET content = $1 WHERE id = $2 RETURNING *",[content, id]);

        if(!updatedComment) {
            return res.status(404).send("Comment not found");
        }

        const result = updatedComment.rows[0];

        return res.status(201).send(result);
    } catch(e) {
        console.error(e);
        return res.status(500).send("Internal server error");
    }
});

projectsRouter.delete("/:projectId/bugs/:bugId/comments/:id", async (req, res) => {
    try {
        const projectId = req.params.projectId;
        const bugId = req.params.bugId;
        const id = req.params.id;

        if(!projectId || !bugId || !id) {
            return res.status(400).send("Please provide projectId, bugId and comment id");
        }

        const deletedComment = await pool.query("DELETE FROM comments WHERE id = $1 RETURNING *",[id]);

        if(!deletedComment) {
            return res.status(404).send("Comment not found");
        }

        const result = deletedComment.rows[0];

        return res.status(200).send(result);
    } catch(e) {
        console.error(e);
        return res.status(500).send("Internal server error");
    }
});

projectsRouter.get("/:projectId/bugs/:bugId/comments", async (req, res) => {
    try {
        const projectId = req.params.projectId;
        const bugId = req.params.bugId;

        if(!projectId || !bugId) {
            return res.status(400).send("Please provide projectId and bugId");
        }

        const comments = await pool.query("SELECT c.id, c.content, m.firstName, m.lastName, c.createdAt, c.updatedAt FROM comments c INNER JOIN members m ON m.id = c.memberId WHERE bugId = $1",[bugId]);

        if(!comments) {
            return res.status(404).send("Comments not found");
        }

        const result = comments.rows;

        return res.status(200).send(result);
    } catch(e) {
        console.error(e);
        return res.status(500).send("Internal server error");
    }
});

export default projectsRouter;