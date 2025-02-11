import Router from "express";
import pool from "../database/pgPool.js";
const bugsRouter = Router();

bugsRouter.get("/", async (req, res) => {
    try {
        const bugs = await pool.query("SELECT * FROM bugs", []);

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

export default bugsRouter;