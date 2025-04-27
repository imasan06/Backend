import express from "express";
import cors from "cors";
import dotenv from "dotenv";

dotenv.config();

const app = express();

// CORS configurado a medida
app.use(cors({
  origin: process.env.FRONTEND_URL,          // ej. "https://proyects-jeuv.vercel.app"
  methods: ["GET","POST","PUT","DELETE","OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
  credentials: true                           // si usas cookies o auth 
}));

// Asegura que OPTIONS nunca redirija ni caiga en otro handler
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
