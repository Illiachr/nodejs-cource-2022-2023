'use strict';

const fsp = require('node:fs').promises;
const path = require('node:path');
const config = require('./configuration/config.js');
const loggerPath = `./lib/${config.logger.provider}.js`;
const logDir = path.join(process.cwd(), `./${config.logger.dir}`);
const console = require(loggerPath)(logDir, config.logger.tty);
const db = require('./lib/db.js')(config.db);
const hash = require('./lib/hash.js');
const load = require('./lib/load.js')(config.sandbox);
const staticServer = require('./lib/static.js');
const { protocol, framework } = config.transport;
const serverPath = `./lib/transport/${protocol}/${framework}.js`;
const server = require(serverPath);

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

  staticServer('./static', console, config.static);
  server(routing, console, config.api);
})();
