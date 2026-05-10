#!/usr/bin/env ts-node-esm

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

interface Finding {
  check: string;
  severity: 'error' | 'warning' | 'info';
  message: string;
  fix: string;
}

const findings: Finding[] = [];

function addFinding(
  check: string,
  severity: 'error' | 'warning' | 'info',
  message: string,
  fix: string
): void {
  findings.push({ check, severity, message, fix });
}

function readJson(filePath: string): unknown {
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

function scanFiles(root: string, extensions: Set<string>): string[] {
  const output: string[] = [];
  const stack: string[] = [root];

  while (stack.length > 0) {
    const current = stack.pop();
    if (!current) {
      continue;
    }

    if (!fs.existsSync(current)) {
      continue;
    }

    const stats = fs.statSync(current);
    if (stats.isDirectory()) {
      const base = path.basename(current);
      if (base === 'node_modules' || base === '.git' || base === 'dist' || base === '.next') {
        continue;
      }

      for (const entry of fs.readdirSync(current)) {
        stack.push(path.join(current, entry));
      }
      continue;
    }

    const ext = path.extname(current);
    if (extensions.has(ext)) {
      output.push(current);
    }
  }

  return output;
}

function checkEnvTemplates(repoRoot: string): void {
  const rootEnvPath = path.join(repoRoot, '.env.example');
  const webappEnvPath = path.join(repoRoot, 'webapp', '.env.example');
  const requirements: Array<{ filePath: string; required: string[] }> = [
    {
      filePath: rootEnvPath,
      required: ['SOLANA_RPC_URL', 'WALLET_PRIVATE_KEY', 'JWT_SECRET'],
    },
    {
      filePath: webappEnvPath,
      required: ['NEXT_PUBLIC_RPC_URL', 'NEXT_PUBLIC_BACKEND_URL'],
    },
  ];

  for (const requirement of requirements) {
    const filePath = requirement.filePath;
    if (!fs.existsSync(filePath)) {
      addFinding('env-template', 'error', `Missing template: ${path.relative(repoRoot, filePath)}`, 'Restore the missing .env.example file.');
      continue;
    }

    const content = fs.readFileSync(filePath, 'utf8');
    for (const variable of requirement.required) {
      const pattern = new RegExp(`^${variable}=`, 'm');
      if (!pattern.test(content)) {
        addFinding('env-template', 'error', `Missing ${variable} in ${path.relative(repoRoot, filePath)}`, `Add ${variable}=... to ${path.relative(repoRoot, filePath)}.`);
      }
    }
  }
}

function resolveRelativeImport(fromFile: string, specifier: string): string | null {
  const base = path.resolve(path.dirname(fromFile), specifier);
  const candidates = [
    base,
    `${base}.ts`,
    `${base}.tsx`,
    `${base}.mts`,
    `${base}.js`,
    `${base}.mjs`,
    path.join(base, 'index.ts'),
    path.join(base, 'index.tsx'),
    path.join(base, 'index.js'),
  ];

  for (const candidate of candidates) {
    if (fs.existsSync(candidate)) {
      return candidate;
    }
  }

  return null;
}

function parseRelativeImports(filePath: string): string[] {
  const content = fs.readFileSync(filePath, 'utf8');
  const matches = content.matchAll(/from\s+['"](\.{1,2}\/[^'"]+)['"]/g);
  const imports: string[] = [];

  for (const match of matches) {
    const specifier = match[1];
    if (specifier) {
      imports.push(specifier);
    }
  }

  return imports;
}

function checkInvalidImportsAndCycles(repoRoot: string): void {
  const codeFiles = scanFiles(repoRoot, new Set(['.ts', '.tsx', '.mts']));
  const graph = new Map<string, string[]>();

  for (const filePath of codeFiles) {
    const rel = path.relative(repoRoot, filePath);
    const imports = parseRelativeImports(filePath);
    const resolved: string[] = [];

    for (const imp of imports) {
      const resolvedPath = resolveRelativeImport(filePath, imp);
      if (!resolvedPath) {
        addFinding('invalid-import', 'error', `Unresolved import in ${rel}: ${imp}`, 'Fix the import path or create the missing module.');
        continue;
      }
      resolved.push(path.relative(repoRoot, resolvedPath));
    }

    graph.set(rel, resolved);
  }

  const visited = new Set<string>();
  const inStack = new Set<string>();

  function dfs(node: string): void {
    visited.add(node);
    inStack.add(node);

    const deps = graph.get(node) ?? [];
    for (const dep of deps) {
      if (!graph.has(dep)) {
        continue;
      }
      if (!visited.has(dep)) {
        dfs(dep);
      } else if (inStack.has(dep)) {
        addFinding('circular-dependency', 'warning', `Circular dependency detected: ${node} -> ${dep}`, 'Refactor shared code into a lower-level module to break the cycle.');
      }
    }

    inStack.delete(node);
  }

  for (const node of graph.keys()) {
    if (!visited.has(node)) {
      dfs(node);
    }
  }
}

function checkNextConfig(repoRoot: string): void {
  const nextConfigPath = path.join(repoRoot, 'webapp', 'next.config.ts');
  if (!fs.existsSync(nextConfigPath)) {
    addFinding('next-config', 'error', 'webapp/next.config.ts is missing', 'Restore Next.js config file.');
    return;
  }

  const content = fs.readFileSync(nextConfigPath, 'utf8');
  if (!content.includes('export default')) {
    addFinding('next-config', 'error', 'webapp/next.config.ts does not export default config', 'Export a default NextConfig object.');
  }
}

function checkFirebaseConfig(repoRoot: string): void {
  const firebaseFiles = scanFiles(repoRoot, new Set(['.json'])).filter((filePath) => path.basename(filePath).startsWith('firebase'));
  if (firebaseFiles.length === 0) {
    addFinding('firebase-config', 'info', 'No Firebase config files found', 'No action required unless Firebase is used in this deployment.');
    return;
  }

  for (const filePath of firebaseFiles) {
    try {
      readJson(filePath);
    } catch (_error) {
      addFinding('firebase-config', 'error', `Invalid JSON in ${path.relative(repoRoot, filePath)}`, 'Fix malformed Firebase JSON.');
    }
  }
}

function checkVercelConfig(repoRoot: string): void {
  const configs = [path.join(repoRoot, 'vercel.json'), path.join(repoRoot, 'webapp', 'vercel.json')];

  for (const filePath of configs) {
    if (!fs.existsSync(filePath)) {
      addFinding('vercel-config', 'error', `Missing ${path.relative(repoRoot, filePath)}`, 'Restore Vercel config.');
      continue;
    }

    try {
      const parsed = readJson(filePath) as { framework?: string; buildCommand?: string };
      if (!parsed.framework) {
        addFinding('vercel-config', 'warning', `${path.relative(repoRoot, filePath)} missing framework`, 'Set framework (for example: nextjs).');
      }
      if (!parsed.buildCommand) {
        addFinding('vercel-config', 'warning', `${path.relative(repoRoot, filePath)} missing buildCommand`, 'Set an explicit build command.');
      }
    } catch (_error) {
      addFinding('vercel-config', 'error', `Invalid JSON in ${path.relative(repoRoot, filePath)}`, 'Fix malformed Vercel JSON.');
    }
  }
}

function checkPackageDuplicationAndDrift(repoRoot: string): void {
  const rootPkgPath = path.join(repoRoot, 'package.json');
  const webPkgPath = path.join(repoRoot, 'webapp', 'package.json');

  if (!fs.existsSync(rootPkgPath) || !fs.existsSync(webPkgPath)) {
    addFinding('package-drift', 'error', 'Missing package.json in root or webapp', 'Restore package manifests.');
    return;
  }

  const rootPkg = readJson(rootPkgPath) as { dependencies?: Record<string, string>; engines?: Record<string, string> };
  const webPkg = readJson(webPkgPath) as { dependencies?: Record<string, string>; engines?: Record<string, string> };
  const rootDeps = rootPkg.dependencies ?? {};
  const webDeps = webPkg.dependencies ?? {};

  for (const dep of Object.keys(rootDeps)) {
    if (webDeps[dep] && webDeps[dep] !== rootDeps[dep]) {
      addFinding('package-drift', 'warning', `Version drift for ${dep}: root=${rootDeps[dep]} webapp=${webDeps[dep]}`, 'Align shared dependency versions where safe.');
    }
  }

  const rootNode = rootPkg.engines?.node;
  const webNode = webPkg.engines?.node;
  if (rootNode && webNode && rootNode !== webNode) {
    addFinding('node-version', 'error', `Node engine mismatch: root=${rootNode} webapp=${webNode}`, 'Use the same Node engine range across manifests.');
  }
}

function checkOrphanGeneratedArtifacts(repoRoot: string): void {
  const distPath = path.join(repoRoot, 'dist');
  const nextPath = path.join(repoRoot, 'webapp', '.next');

  if (fs.existsSync(distPath)) {
    addFinding('orphan-artifacts', 'warning', 'dist/ exists in repository workspace', 'Ensure generated artifacts are not committed and are reproducible in CI.');
  }

  if (fs.existsSync(nextPath)) {
    addFinding('orphan-artifacts', 'warning', 'webapp/.next exists in repository workspace', 'Ensure Next build output is not committed.');
  }
}

function checkWorkflowGraph(repoRoot: string): void {
  const workflowDir = path.join(repoRoot, '.github', 'workflows');
  const allowed = new Set(['ci.yml', 'security.yml', 'deploy.yml', 'self-heal.yml']);

  if (!fs.existsSync(workflowDir)) {
    addFinding('workflow-graph', 'error', '.github/workflows missing', 'Restore workflows directory.');
    return;
  }

  const files = fs.readdirSync(workflowDir).filter((fileName) => fileName.endsWith('.yml') || fileName.endsWith('.yaml'));

  for (const fileName of files) {
    if (!allowed.has(fileName)) {
      addFinding('workflow-graph', 'error', `Unexpected workflow file: ${fileName}`, 'Remove non-deterministic or obsolete workflow definitions.');
    }

    const fullPath = path.join(workflowDir, fileName);
    const content = fs.readFileSync(fullPath, 'utf8');

    if (/git\s+push/.test(content) || /create-pull-request/.test(content)) {
      addFinding('workflow-graph', 'error', `${fileName} contains repository mutation behavior`, 'Remove auto-commit/auto-PR logic from workflows.');
    }

    if (/workflow_run:\s*[\s\S]*workflows:\s*\[[^\]]*self-heal[^\]]*\]/m.test(content)) {
      addFinding('workflow-graph', 'error', `${fileName} can recursively trigger self-heal`, 'Break recursive workflow_run chains.');
    }
  }
}

function checkTypeScriptPaths(repoRoot: string): void {
  const configs = [path.join(repoRoot, 'tsconfig.json'), path.join(repoRoot, 'webapp', 'tsconfig.json')];

  for (const filePath of configs) {
    if (!fs.existsSync(filePath)) {
      addFinding('typescript-paths', 'error', `Missing ${path.relative(repoRoot, filePath)}`, 'Restore tsconfig file.');
      continue;
    }

    const parsed = readJson(filePath) as { compilerOptions?: { paths?: Record<string, string[]> } };
    const pathsMap = parsed.compilerOptions?.paths ?? {};

    for (const alias of Object.keys(pathsMap)) {
      for (const target of pathsMap[alias]) {
        const cleaned = target.replace(/\*.*$/, '');
        const resolved = path.resolve(path.dirname(filePath), cleaned);
        if (!fs.existsSync(resolved)) {
          addFinding('typescript-paths', 'error', `${path.relative(repoRoot, filePath)} has invalid path mapping ${alias} -> ${target}`, 'Fix or remove invalid TS path aliases.');
        }
      }
    }
  }
}

function checkSupportedNodeVersion(repoRoot: string): void {
  const nvmrcPath = path.join(repoRoot, '.nvmrc');
  if (!fs.existsSync(nvmrcPath)) {
    addFinding('node-version', 'error', '.nvmrc missing', 'Add .nvmrc and pin supported Node version.');
    return;
  }

  const nvmrc = fs.readFileSync(nvmrcPath, 'utf8').trim();
  if (!/^v?\d+(\.\d+(\.\d+)?)?$/.test(nvmrc)) {
    addFinding('node-version', 'error', `.nvmrc is invalid: ${nvmrc}`, 'Set .nvmrc to a major Node version (for example 24).');
  }

  const nvmrcMajorMatch = nvmrc.match(/\d+/);
  const nvmrcMajor = nvmrcMajorMatch ? nvmrcMajorMatch[0] : '';
  const rootPkg = readJson(path.join(repoRoot, 'package.json')) as { engines?: Record<string, string> };
  const nodeEngine = rootPkg.engines?.node;
  if (nodeEngine && nvmrcMajor && !nodeEngine.includes(nvmrcMajor)) {
    addFinding('node-version', 'warning', `Node engine (${nodeEngine}) does not explicitly include .nvmrc (${nvmrc})`, 'Align engines.node with .nvmrc for deterministic toolchain selection.');
  }
}

function printResults(): void {
  const errors = findings.filter((item) => item.severity === 'error');
  const warnings = findings.filter((item) => item.severity === 'warning');
  const info = findings.filter((item) => item.severity === 'info');

  console.log('Platform Doctor Diagnostics\n');

  for (const finding of findings) {
    const icon = finding.severity === 'error' ? '❌' : finding.severity === 'warning' ? '⚠️' : 'ℹ️';
    console.log(`${icon} [${finding.check}] ${finding.message}`);
    console.log(`   Fix: ${finding.fix}`);
  }

  console.log('\nSummary');
  console.log(`- Errors: ${errors.length}`);
  console.log(`- Warnings: ${warnings.length}`);
  console.log(`- Info: ${info.length}`);

  if (errors.length > 0) {
    process.exit(1);
  }
}

function main(): void {
  const repoRoot = path.resolve(path.join(path.dirname(fileURLToPath(import.meta.url)), '..'));

  checkEnvTemplates(repoRoot);
  checkInvalidImportsAndCycles(repoRoot);
  checkNextConfig(repoRoot);
  checkFirebaseConfig(repoRoot);
  checkVercelConfig(repoRoot);
  checkPackageDuplicationAndDrift(repoRoot);
  checkOrphanGeneratedArtifacts(repoRoot);
  checkWorkflowGraph(repoRoot);
  checkTypeScriptPaths(repoRoot);
  checkSupportedNodeVersion(repoRoot);

  printResults();
}

main();
