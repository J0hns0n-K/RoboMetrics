// AI-authored local preview helper. No dependencies, external service, or telemetry.
import {createServer} from 'node:http';
import {readFile} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
const root = new URL('../', import.meta.url);
const files = new Map([
  ['/', ['index.html', 'text/html']],
  ['/index.html', ['index.html', 'text/html']],
  ['/styles.css', ['styles.css', 'text/css']],
  ['/src/core.mjs', ['src/core.mjs', 'text/javascript']],
  ['/src/ui.mjs', ['src/ui.mjs', 'text/javascript']]
]);
const server = createServer(async (req, res) => {
  const file = files.get(new URL(req.url, 'http://localhost').pathname);
  if (!file || !['GET', 'HEAD'].includes(req.method)) {
    res.writeHead(404); res.end('Not found'); return;
  }
  try {
    const content = await readFile(fileURLToPath(new URL(file[0], root)));
    res.writeHead(200, {'Content-Type': `${file[1]}; charset=utf-8`, 'Cache-Control': 'no-store'});
    res.end(req.method === 'HEAD' ? undefined : content);
  } catch {
    res.writeHead(500); res.end('Preview file unavailable');
  }
});
server.on('error', error => { console.error(error.message); process.exitCode = 1; });
server.listen(8080, '127.0.0.1', () => console.log('RoboMetrics: http://127.0.0.1:8080'));
