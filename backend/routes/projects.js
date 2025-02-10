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

export default projectsRouter;