#!/usr/bin/env node
/**
 * Front Desk Clinic MCP Server
 * File-aware + API-aware + Task-aware
 */
import fs from "fs";
import path from "path";
import process from "process";

// ==== CONFIG ====
const PROJECT_ROOT = "C:\\Users\\varun\\Desktop\\Allo Health\\Front Desk System at a Clinic";
const BACKEND_SRC = path.join(PROJECT_ROOT, "backend", "src");
const FRONTEND_ROOT = path.join(PROJECT_ROOT, "frontend");
const SPECS_DIR = path.join(PROJECT_ROOT, ".kiro", "specs", "front-desk-clinic-system");

function safeList(dir) {
    try {
        return fs.readdirSync(dir).map(f => path.join(dir, f));
    } catch {
        return [];
    }
}

// Build API index from backend controllers
function buildApiIndex(srcDir) {
    const apiList = [];
    const files = fs.readdirSync(srcDir, { recursive: true });
    files.forEach(file => {
        if (file.endsWith(".controller.ts")) {
            apiList.push({
                controller: file,
                path: file.replace(/\\/g, "/")
            });
        }
    });
    return apiList;
}

const response = {
    meta: {
        name: "Front Desk Clinic MCP",
        description: "File-aware + API-aware + Task-aware MCP server",
        continueFromTask: 9,
        protectTasks: [1, 2, 3, 4, 5, 6, 7, 8]
    },
    files: {
        specs: safeList(SPECS_DIR),
        backend: safeList(BACKEND_SRC),
        frontend: safeList(FRONTEND_ROOT)
    },
    backendApi: buildApiIndex(BACKEND_SRC),
    message: "Ensure logical flow. Do NOT modify Tasks 1–8. Continue development from Task 9."
};

console.log(JSON.stringify(response, null, 2));
