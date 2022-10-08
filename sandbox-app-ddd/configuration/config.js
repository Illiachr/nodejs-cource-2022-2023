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
  transport: {
    protocol: 'http',
    framework: 'fastify'
  },
  db: {
    'host': '127.0.0.1',
    'port': 5432,
    'database': 'example',
    'user': 'marcus',
    'password': 'marcus'
  },
  logger: {
    provider: 'pino',
    dir: './log'
  }
};
