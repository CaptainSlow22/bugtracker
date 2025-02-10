import express from 'express';
import cors from "cors";
import "dotenv/config";
import membersRouter from './routes/members.js';
import projectsRouter from './routes/projects.js';

const app = express();
app.use(express.json());
app.use(cors());

app.use("/members", membersRouter);
app.use("/projects", projectsRouter);

app.listen(process.env.PORT, () => {
    console.log(`Listening on port: ${process.env.PORT}`);
})