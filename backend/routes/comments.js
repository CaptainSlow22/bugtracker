import Router from "express"
import pool from "../database/pgPool.js";
const commentsRouter = Router();

commentsRouter.get("/", async (req, res) => {
    try {
        const comments = await pool.query("SELECT * FROM comments", []);

        if(!comments) {
            return res.status(404).send("No comments found");
        }

        const result = comments.rows;

        return res.status(200).send(result);
    } catch(e) {
        console.error(e);
        return res.status(500).send("Internal server error");
    }
});

export default commentsRouter;