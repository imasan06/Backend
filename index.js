import express from "express";
import cors from "cors";
import dotenv from "dotenv";

dotenv.config();

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// Opcional: verifica la conexión al arrancar
prisma
  .$connect()
  .then(() => console.log("✅ Conectado a la base de datos"))
  .catch((e) => {
    console.error("❌ Error conectando a la base de datos", e);
    process.exit(1);
  });


const app = express();

// CORS configurado a medida
app.use(cors({
  origin: true,          // ej. "https://proyects-jeuv.vercel.app"
  methods: ["GET","POST","PUT","DELETE","OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
  credentials: true                           // si usas cookies o auth 
}));

app.options("*", cors({
  origin: process.env.FRONTEND_URL,
  methods: ["GET","POST","PUT","DELETE","OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
  credentials: true
}));

app.use(express.json());

// Rutas
import authRouter from "./routes/auth.js";
import performanceRouter from "./routes/performance.js";

app.use("/api/auth", authRouter);
app.use("/api/performance", performanceRouter);

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
process.on("SIGINT", async () => {
  await prisma.$disconnect();
  process.exit(0);
});
