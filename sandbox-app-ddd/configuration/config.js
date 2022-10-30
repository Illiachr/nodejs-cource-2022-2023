'use strict';

module.exports = {
  static: {
    host: '127.0.0.1',
    port: 8000
  },
  api: {
    host: '127.0.0.1',
    port: 8001,
    version: 'v1'
  },
  sandbox: {
    timeout: 5000,
    displayErrors: false
  },
  // ./transport/{{protocol}}/{{framework}}.js
  transport: {
    protocol: 'http', // protocol directory name
    framework: 'fastifyRpc' // transport module name
  },
  db: {
    'host': '127.0.0.1',
    'port': 5432,
    'database': 'example',
    'user': 'marcus',
    'password': 'marcus'
  },
  // ./{{provider}}.js
  logger: {
    provider: 'pino', // logger module name
    dir: './log' // logs output
  }
};
