import express from "express";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

const router = express.Router();
const prisma = new PrismaClient();
const JWT_SECRET = process.env.JWT_SECRET || "secret";

// User Registration
router.post("/register", async (req, res) => {
  const { name, email, password } = req.body;

  if (!name || !email || !password) {
    return res.status(400).json({ error: "Name, email, and password are required." });
  }

  try {
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return res.status(409).json({ error: "Email already in use." });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = await prisma.user.create({
      data: { name, email, password: hashedPassword },
    });

    res.status(201).json({ id: newUser.id, name: newUser.name, email: newUser.email });
  } catch (error) {
    console.error("Error during registration:", error);
    res.status(500).json({
      error: "Error registering user.",
      message: error.message,
    });
  }
});


// User Login
router.post("/login", async (req, res) => {
  const { email, password } = req.body;
  try {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) return res.status(400).json({ error: "User not found." });
    const isValid = await bcrypt.compare(password, user.password);
    if (!isValid) return res.status(400).json({ error: "Invalid credentials." });
    const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: "1d" });
    res.json({ token, user });
  } catch (error) {
    res.status(500).json({ error: "Error logging in." });
  }
});

// User GetPeticion

router.get("/users", async (req, res) => {
  try {
    
    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        password: true, // Hashed password
      },
    });
    res.json(users);
  } catch (error) {
    console.error("Error fetching users:", error);
    res.status(500).json({ error: "Error fetching users" });
  }
});

router.get("/users/:id", async (req, res) => {
  try {
    // Get the token from the Authorization header
    const authHeader = req.headers.authorization
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ error: "Unauthorized" })
    }

    const token = authHeader.split(" ")[1]

    // Verify the token
    let decoded
    try {
      decoded = jwt.verify(token, JWT_SECRET)
    } catch (err) {
      return res.status(401).json({ error: "Invalid token" })
    }

    // Check if the user is requesting their own profile
    if (decoded.userId !== req.params.id) {
      return res.status(403).json({ error: "Unauthorized to access this profile" })
    }

    // Find the user
    const user = await prisma.user.findUnique({
      where: { id: req.params.id },
      select: {
        id: true,
        name: true,
        email: true,
        
      },
    })

    if (!user) {
      return res.status(404).json({ error: "User not found" })
    }

    res.json(user)
  } catch (error) {
    console.error("Error fetching user:", error)
    res.status(500).json({ error: "Error fetching user" })
  }
})

// Update a user by ID
router.put("/users/:id", async (req, res) => {
  try {
    // Get the token from the Authorization header
    const authHeader = req.headers.authorization
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ error: "Unauthorized" })
    }

    const token = authHeader.split(" ")[1]

    // Verify the token
    let decoded
    try {
      decoded = jwt.verify(token, JWT_SECRET)
    } catch (err) {
      return res.status(401).json({ error: "Invalid token" })
    }

    // Check if the user is updating their own profile
    if (decoded.userId !== req.params.id) {
      return res.status(403).json({ error: "Unauthorized to update this profile" })
    }

    const { name, email } = req.body

    // Validate input
    if (!name || !email) {
      return res.status(400).json({ error: "Name and email are required" })
    }

    // Check if email is already taken by another user
    if (email) {
      const existingUser = await prisma.user.findUnique({
        where: { email },
      })

      if (existingUser && existingUser.id !== req.params.id) {
        return res.status(409).json({ error: "Email already in use" })
      }
    }

    // Update the user
    const updatedUser = await prisma.user.update({
      where: { id: req.params.id },
      data: { name, email },
      select: {
        id: true,
        name: true,
        email: true,
      },
    })

    res.json(updatedUser)
  } catch (error) {
    console.error("Error updating user:", error)
    res.status(500).json({ error: "Error updating user" })
  }
})

export default router;
