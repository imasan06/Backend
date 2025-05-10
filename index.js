import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { PrismaClient } from "@prisma/client";

dotenv.config();

const prisma = new PrismaClient();

prisma
  .$connect()
  .then(() => console.log("✅ Conectado a la base de datos"))
  .catch((e) => {
    console.error("❌ Error conectando a la base de datos", e);
    process.exit(1);
  });

const app = express();

// Configura CORS con la URL del frontend (usa process.env.FRONTEND_URL si quieres mantenerlo en Vercel)
app.use(cors({
  origin: process.env.FRONTEND_URL || "https://proyects-jeuv.vercel.app",
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
  credentials: true
}));

// Middleware para aceptar JSON
app.use(express.json());

// Rutas
import authRouter from "./routes/auth.js";
import performanceRouter from "./routes/performance.js";

// NOTA: Las rutas están bajo /api/*
app.use("/api/auth", authRouter);
app.use("/api/performance", performanceRouter);

// Ruta raíz opcional
app.get("/", (req, res) => {
  res.send("✅ Backend activo y funcionando");
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => console.log(`🚀 Servidor escuchando en el puerto ${PORT}`));

// Cierre limpio de Prisma
process.on("SIGINT", async () => {
  await prisma.$disconnect();
  process.exit(0);
});
