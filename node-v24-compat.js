'use strict';
process.stderr.write('[v24-compat] preload start\n');
try {
  require('./node_modules/next/dist/shared/lib/errors/canary-only-config-error');
  process.stderr.write('[v24-compat] canary-only-config-error loaded\n');
} catch (e) {
  process.stderr.write('[v24-compat] error: ' + e.message + '\n');
}
process.stderr.write('[v24-compat] preload done\n');
