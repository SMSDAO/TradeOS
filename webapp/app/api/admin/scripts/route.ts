/**
 * Admin Scripts Monitoring API
 * Provides real-time status and execution of system scripts
 */

import { NextRequest, NextResponse } from "next/server";
import { exec } from "child_process";
import { promisify } from "util";
import path from "path";
import { access, constants } from "node:fs/promises";

const execAsync = promisify(exec);

// List of available scripts with metadata
const SCRIPTS = {
  "master.sh": {
    name: "Master Orchestration",
    description: "Full production readiness validation (11 steps)",
    category: "deployment",
    estimatedTime: "5-10 min",
    critical: true,
  },
  "health-check.sh": {
    name: "Health Check",
    description: "System health monitoring and diagnostics",
    category: "monitoring",
    estimatedTime: "30 sec",
    critical: false,
  },
  "env-check.sh": {
    name: "Environment Validation",
    description: "Validate all required environment variables",
    category: "configuration",
    estimatedTime: "10 sec",
    critical: true,
  },
  "env-sync-check.sh": {
    name: "Environment Sync",
    description: "Check .env template synchronization",
    category: "configuration",
    estimatedTime: "10 sec",
    critical: false,
  },
  "db-migrate.sh": {
    name: "Database Migration",
    description: "Run database schema migrations",
    category: "database",
    estimatedTime: "30 sec",
    critical: true,
  },
  "gxq-selfheal.sh": {
    name: "Self-Healing",
    description: "Automated system recovery and fixes",
    category: "maintenance",
    estimatedTime: "1-2 min",
    critical: false,
  },
  "auto-fix.sh": {
    name: "Auto-Fix",
    description: "Automatic code fixes and linting",
    category: "maintenance",
    estimatedTime: "30 sec",
    critical: false,
  },
  "deploy-vercel.sh": {
    name: "Vercel Deployment",
    description: "Deploy webapp to Vercel",
    category: "deployment",
    estimatedTime: "2-3 min",
    critical: true,
  },
};

/**
 * GET - List all available scripts with their status
 */
export async function GET(request: NextRequest) {
  try {
    const scriptsDir = path.join(process.cwd(), "..", "scripts");

    const scriptsWithStatus = await Promise.all(
      Object.entries(SCRIPTS).map(async ([filename, metadata]) => {
        const scriptPath = path.join(scriptsDir, filename);
        let exists = false;
        let lastModified = null;

        try {
          const { stdout } = await execAsync(
            `stat -c %Y "${scriptPath}" 2>/dev/null || stat -f %m "${scriptPath}" 2>/dev/null`
          );
          exists = true;
          lastModified = new Date(parseInt(stdout.trim()) * 1000).toISOString();
        } catch {
          exists = false;
        }

        return {
          id: filename.replace(".sh", ""),
          filename,
          ...metadata,
          exists,
          lastModified,
          path: scriptPath,
        };
      })
    );

    return NextResponse.json({
      success: true,
      scripts: scriptsWithStatus,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("[Admin Scripts API] Error listing scripts:", error);
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error ? error.message : "Failed to list scripts",
      },
      { status: 500 }
    );
  }
}

/**
 * POST - Execute a script
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { scriptId, dryRun = false } = body;

    if (!scriptId) {
      return NextResponse.json(
        { success: false, error: "Script ID is required" },
        { status: 400 }
      );
    }

    // ✅ Validate scriptId (prevent traversal, injection, weird chars)
    if (!/^[a-zA-Z0-9_\-]+(\.sh)?$/.test(scriptId)) {
      return NextResponse.json(
        { success: false, error: "Invalid scriptId format" },
        { status: 400 }
      );
    }

    const scriptFilename = scriptId.endsWith(".sh")
      ? scriptId
      : `${scriptId}.sh`;

    const scriptMetadata =
      SCRIPTS[scriptFilename as keyof typeof SCRIPTS];

    if (!scriptMetadata) {
      return NextResponse.json(
        { success: false, error: `Script not found: ${scriptId}` },
        { status: 404 }
      );
    }

    const scriptsDir = path.join(process.cwd(), "..", "scripts");
    const resolvedScriptsDir = path.resolve(scriptsDir);
    const scriptPath = path.join(resolvedScriptsDir, scriptFilename);
    const resolvedScriptPath = path.resolve(scriptPath);

    // ✅ Ensure the resolved path is within the scripts directory
    if (!resolvedScriptPath.startsWith(resolvedScriptsDir + path.sep)) {
      return NextResponse.json(
        { success: false, error: "Resolved script path is outside of scripts directory" },
        { status: 400 }
      );
    }

    // ✅ Verify script exists without shell commands
    try {
      await access(resolvedScriptPath, constants.F_OK);
    } catch {
      return NextResponse.json(
        { success: false, error: `Script file not found: ${resolvedScriptPath}` },
        { status: 404 }
      );
    }

    if (dryRun) {
      return NextResponse.json({
        success: true,
        message: `Dry run for ${scriptFilename}`,
        script: {
          ...scriptMetadata,
          filename: scriptFilename,
          path: resolvedScriptPath,
        },
        wouldExecute: `bash ${resolvedScriptPath}`,
      });
    }

    // Execute script with timeout
    console.log(`[Admin Scripts API] Executing: ${scriptPath}`);
    const startTime = Date.now();

    try {
      const { stdout, stderr } = await execAsync(`bash "${scriptPath}"`, {
        timeout: 600000,
        maxBuffer: 10 * 1024 * 1024,
      });

      const executionTime = Date.now() - startTime;

      return NextResponse.json({
        success: true,
        script: {
          ...scriptMetadata,
          filename: scriptFilename,
        },
        execution: {
          stdout: stdout.slice(-5000),
          stderr: stderr.slice(-2000),
          executionTime: `${(executionTime / 1000).toFixed(2)}s`,
          timestamp: new Date().toISOString(),
        },
      });
    } catch (error: any) {
      const executionTime = Date.now() - startTime;

      return NextResponse.json(
        {
          success: false,
          script: {
            ...scriptMetadata,
            filename: scriptFilename,
          },
          error: error.message || "Script execution failed",
          execution: {
            stdout: error.stdout?.slice(-5000) || "",
            stderr: error.stderr?.slice(-2000) || "",
            exitCode: error.code,
            executionTime: `${(executionTime / 1000).toFixed(2)}s`,
            timestamp: new Date().toISOString(),
          },
        },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("[Admin Scripts API] Error executing script:", error);
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error ? error.message : "Failed to execute script",
      },
      { status: 500 }
    );
  }
}
