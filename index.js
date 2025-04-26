import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { PrismaClient } from "@prisma/client";

dotenv.config();

const app = express();
const prisma = new PrismaClient();

app.use(cors());
app.use(express.json());

// Rutas
import authRouter from "./routes/auth.js";
import performanceRouter from "./routes/performance.js";

app.use("/api/auth", authRouter);
app.use("/api/performance", performanceRouter);

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
