import Router from "express";
import pool from "../database/pgPool.js";
import bcrypt from 'bcryptjs';
import jwt from "jsonwebtoken";
const membersRouter = Router();

membersRouter.post("/register", async (req, res) => {
    try {
        const {firstName, lastName, email, password} = req.body;
        if(!firstName || !lastName || !email || !password) {
            return res.status(400).send("Please provide all required fields: firstName, lastName, email, password");
        }

        const memberExists = await pool.query("SELECT * FROM members WHERE email = $1", [email]);
        const check = memberExists.rows[0]?.email === email;
        
        if(check) {
            return res.status(400).send("Member already registered");
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const newMember = await pool.query("INSERT INTO members(firstName, lastName, email, password) VALUES ($1, $2, $3, $4) RETURNING *", [firstName, lastName, email, hashedPassword]);
        
        if(!newMember) {
            return res.status(500).send("Error registering new member");
        }

        const result = newMember.rows[0];

        return res.status(201).send(result);

    } catch(e) {
        console.error(e);
        return res.status(500).send("Internal server error");
    }
});

membersRouter.post("/login", async (req, res) => {
    try {
        const {email, password} = req.body;

        if(!email || !password) {
            return res.status(400).send("Please provide both email and password");
        }

        const memberCheck = pool.query("SELECT * FROM members WHERE email = $1",[email]);

        if(memberCheck.rows[0].email !== email) {
            return res.status(401).send("Wrong email or password");
        }

        const passwordCheck = await bcrypt.compare(password, (await memberCheck).rows[0].password);

        if(!passwordCheck) {
            return res.status(401).send("Wrong email or password");
        }

        const token = jwt.sign({memberId: memberCheck.rows[0].id}, process.env.JWTSECRET);

        return res.status(200).send(token);
    } catch(e) {
        console.error(e);
        return res.status(500).send("Internal sever error");
    }
});

membersRouter.get("/", async (req, res) => {
    try {
        const members = await pool.query("SELECT * FROM members",[]);
        if(!members) {
            return res.status(404).send("Members not found");
        }

        const result = members.rows;

        return res.status(200).send(result);
    } catch(e) {
        console.error(e);
        return res.status(500).send("Internal server error");
    }
});

membersRouter.get("/:id", async (req, res) => {
    try {
        const id = req.params.id;

        if(!id) {
            return res.status(400).send("Please provide the id of the member");
        }
        const member = await pool.query("SELECT * FROM members WHERE id = $1",[id]);

        if(!member) {
            return res.status(404).send("Member not found");
        }

        const result = member.rows;

        return res.status(200).send(result);
    } catch(e) {
        console.error(e);
        return res.status(500).send("Internal server error");
    }
});

export default membersRouter;