'use strict';

const fsp = require('node:fs').promises;
const path = require('node:path');
const config = require('./config.json');
const server = require(config.transport);
const staticServer = require('./static.js');
const load = require('./load.js');
const db = require('./db.js');
const hash = require('./hash.js');
const console = require(config.logger);

// const PORT = 8000;
// const API_PORT = 8001;
// const BASE_PATH = '/';
// const ctxPathIdx = BASE_PATH.length === 1 ?
//   BASE_PATH.length :
//   BASE_PATH.length + 1;

const sandbox = {
  console: Object.freeze(console),
  db: Object.freeze(db),
  common: { hash }
};
const apiPath = path.join(process.cwd(), './api');
const routing = {};

(async () => {
  const files = await fsp.readdir(apiPath);
  for (const fileName of files) {
    if (!fileName.endsWith('.js')) continue;
    const filePath = path.join(apiPath, fileName);
    const serviceName = path.basename(fileName, '.js');
    routing[serviceName] = await load(filePath, sandbox);
  }

  // server(routing, PORT, ctxPathIdx);
  staticServer('./static', config.staticPort);
  server(routing, config.apiPort);
})();
