import { spawn } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('\x1b[36m%s\x1b[0m', '==================================================');
console.log('\x1b[36m%s\x1b[0m', '🚀 Launching WorkFlow: Monorepo Backend & Frontend');
console.log('\x1b[36m%s\x1b[0m', '   - FastAPI Backend: http://127.0.0.1:8001');
console.log('\x1b[36m%s\x1b[0m', '   - React Frontend:  http://localhost:3000');
console.log('\x1b[36m%s\x1b[0m', '==================================================\n');

const isWin = process.platform === 'win32';
const pyCmd = isWin ? 'python' : 'python3';
const npxCmd = isWin ? 'npx.cmd' : 'npx';

const frontendDir = path.resolve(__dirname, 'frontend');

// 1. Spawn FastAPI backend on port 8001 from monorepo root
const backend = spawn(
  pyCmd,
  ['-m', 'uvicorn', 'backend.app.main:app', '--host', '127.0.0.1', '--port', '8001', '--reload'],
  { cwd: __dirname, stdio: 'inherit', shell: true }
);

// 2. Spawn Vite dev server on port 3000 from frontend/ directory
const frontend = spawn(
  npxCmd,
  ['vite', '--port=3000', '--host=0.0.0.0'],
  { cwd: frontendDir, stdio: 'inherit', shell: true }
);

function cleanup() {
  console.log('\nGracefully shutting down backend & frontend...');
  try {
    if (isWin) {
      if (backend.pid) spawn('taskkill', ['/pid', backend.pid.toString(), '/f', '/t']);
      if (frontend.pid) spawn('taskkill', ['/pid', frontend.pid.toString(), '/f', '/t']);
    } else {
      backend.kill('SIGINT');
      frontend.kill('SIGINT');
    }
  } catch (e) {
    // ignore
  }
  process.exit();
}

process.on('SIGINT', cleanup);
process.on('SIGTERM', cleanup);
process.on('exit', cleanup);
