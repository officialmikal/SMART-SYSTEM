
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
import { Institution, User } from "./backend/src/models/index.ts";

const backendApp = (backendModule as any).default || backendModule;
const sequelize = (sequelizeModule as any).default || sequelizeModule;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  // 1. Initialize Database FIRST (Fail fast if it fails)
  await initializeDatabase();

  const app = express();
  const PORT = Number(process.env.PORT) || 3000;

  // 2. Mount the backend app
  app.use(backendApp);

  // 3. Vite middleware for development
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

    // Professional SPA fallback
    app.use((req, res, next) => {
      if (req.method !== "GET" || req.path.startsWith("/api")) {
        return next();
      }
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  // 4. Start the server only after initialization is complete
  app.listen(PORT, "0.0.0.0", () => {
    console.log(`ElimuSmart Unified Server running on http://localhost:${PORT}`);
  });
}

async function initializeDatabase() {
  try {
    console.log("Initializing database connection...");
    await sequelize.authenticate();
    console.log("PostgreSQL: Connected successfully.");
    
    await sequelize.sync({ alter: true });
    console.log("PostgreSQL: Models synced and schema updated.");

    if (!Institution || !User) {
      throw new Error(`Critical models failed to load. Institution: ${typeof Institution}, User: ${typeof User}`);
    }

    // Seed Data
    let defaultInst = await (Institution as any).findOne({ where: { subdomain: "demo" } });
    if (!defaultInst) {
      defaultInst = await (Institution as any).create({
        name: "ElimuSmart Demo Academy",
        motto: "Excellence Through Innovation",
        registrationNumber: "MOE/DEMO/001",
        subdomain: "demo",
        active: true
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
          institutionId: defaultInst.id,
          active: true
        });
        console.log("Seed: Master Admin created.");
      }
    }
  } catch (error) {
    console.error("CRITICAL: Database initialization failed. Stopping server.");
    console.error(error);
    process.exit(1); // Kill process if DB is not ready
  }
}

startServer();
