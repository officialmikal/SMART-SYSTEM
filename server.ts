
import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import dotenv from "dotenv";
import bcrypt from "bcryptjs";

// Load environment variables
dotenv.config();

// Import backend components
import backendModule from "./backend/src/app.ts";
import sequelizeModule from "./backend/src/config/database.ts";
import InstitutionModule from "./backend/src/models/Institution.ts";
import UserModule from "./backend/src/models/User.ts";

const backendApp = (backendModule as any).default || backendModule;
const sequelize = (sequelizeModule as any).default || sequelizeModule;
const Institution = (InstitutionModule as any).default || InstitutionModule;
const User = (UserModule as any).default || UserModule;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = 3000; // Force 3000 for this environment

  // Mount the backend app
  // The backend app already has /api prefix for its routes
  app.use(backendApp);

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { 
        middlewareMode: true,
        hmr: false 
      },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  // Start the server immediately
  app.listen(PORT, "0.0.0.0", () => {
    console.log(`ElimuSmart Unified Server running on http://localhost:${PORT}`);
    
    // Initialize Database in background
    initializeDatabase();
  });
}

async function initializeDatabase() {
  try {
    console.log("Initializing database connection...");
    await sequelize.authenticate();
    console.log("PostgreSQL: Connected successfully.");
    
    await sequelize.sync({ force: false });
    console.log("PostgreSQL: Models synced.");

    // Seed Data
    let defaultInst = await (Institution as any).findOne({ where: { subdomain: "demo" } });
    if (!defaultInst) {
      defaultInst = await (Institution as any).create({
        name: "ElimuSmart Demo Academy",
        motto: "Excellence Through Innovation",
        registrationNumber: "MOE/DEMO/001",
        subdomain: "demo"
      });
      console.log("Seed: Demo Institution created.");
    }

    if (defaultInst && defaultInst.id) {
      const adminExists = await (User as any).findOne({ where: { role: "ADMIN", institutionId: defaultInst.id } });
      if (!adminExists) {
        const hashedPassword = await bcrypt.hash("adminpassword", 10);
        await (User as any).create({
          name: "Master Admin",
          email: "admin@school.ac.ke",
          password: hashedPassword,
          role: "ADMIN",
          institutionId: defaultInst.id
        });
        console.log("Seed: Master Admin created.");
      }
    } else {
      console.error("Seed: Failed to retrieve or create default institution.");
    }
  } catch (error) {
    console.error("Database initialization failed:", error);
  }
}

startServer();
