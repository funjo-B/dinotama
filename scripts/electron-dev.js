const { execSync, spawn } = require('child_process');
const path = require('path');
const net = require('net');

const root = path.resolve(__dirname, '..');

// Find available port
function findPort(start) {
  return new Promise((resolve) => {
    const server = net.createServer();
    server.listen(start, () => {
      const port = server.address().port;
      server.close(() => resolve(port));
    });
    server.on('error', () => resolve(findPort(start + 1)));
  });
}

async function main() {
  // 1. Compile main process
  console.log('[DinoTama] Compiling main process...');
  execSync('npx tsc -p tsconfig.main.json', { cwd: root, stdio: 'inherit' });
  console.log('[DinoTama] Main process compiled.\n');

  // 2. Find available port
  const port = await findPort(5173);
  console.log(`[DinoTama] Using port ${port} for Vite\n`);

  // 3. Start Vite
  const vite = spawn('npx', ['vite', '--port', String(port), '--strictPort'], {
    cwd: root,
    stdio: 'pipe',
    shell: true,
  });

  let electronProc = null;

  vite.stdout.on('data', (data) => {
    const text = data.toString();
    process.stdout.write(text);

    if (!electronProc && text.includes('Local:')) {
      console.log('\n[DinoTama] Vite ready! Launching Electron...\n');

      electronProc = spawn('npx', ['electron', '.'], {
        cwd: root,
        stdio: 'inherit',
        shell: true,
        env: {
          ...process.env,
          ELECTRON_DISABLE_SECURITY_WARNINGS: 'true',
          VITE_DEV_PORT: String(port),
        },
      });

      electronProc.on('close', (code) => {
        console.log(`[DinoTama] Electron exited (code ${code})`);
        vite.kill();
        process.exit(0);
      });
    }
  });

  vite.stderr.on('data', (d) => process.stderr.write(d.toString()));

  process.on('SIGINT', () => {
    electronProc?.kill();
    vite.kill();
    process.exit(0);
  });
}

main();
