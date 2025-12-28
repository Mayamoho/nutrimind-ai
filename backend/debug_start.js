const fs = require('fs');
const path = require('path');
const logFile = path.join(__dirname, 'debug_start.log');
function log(msg) {
  const line = `[${new Date().toISOString()}] ${typeof msg === 'string' ? msg : (msg && msg.stack ? msg.stack : JSON.stringify(msg))}\n`;
  try { fs.appendFileSync(logFile, line); } catch (e) { /* ignore */ }
}
process.on('uncaughtException', (err) => { log('UNCAUGHT_EXCEPTION: ' + (err && err.stack ? err.stack : String(err))); process.exit(1); });
process.on('unhandledRejection', (err) => { log('UNHANDLED_REJECTION: ' + (err && err.stack ? err.stack : String(err))); });

try {
  log('Requiring server.js');
  require('./server.js');
  log('server.js required successfully');
} catch (e) {
  log('Require failed: ' + (e && e.stack ? e.stack : String(e)));
  process.exit(1);
}
