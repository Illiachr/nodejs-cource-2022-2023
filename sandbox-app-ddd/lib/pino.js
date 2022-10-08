'use strict';

const pino = require('pino');

const levels = {
  system: 80,
  error: 70,
  access: 60,
  dir: 50,
  log: 40,
  debug: 30,
};

module.exports = (logPath) => {
  const fileName = `${new Date().toISOString().substring(0, 10)}.log`;
  const streams = [
    { stream: process.stdout },
    { stream: pino.destination({
      dest: `${logPath}/${fileName}`,
      sync: false
    }) },
  ];

  return pino(
    {
      level: 'debug',
      customLevels: levels,
      useOnlyCustomLevels: true,
      formatters: {
        level: (label) => ({ level: label })
      },
    },
    pino.multistream(streams, {
      levels,
      dedupe: true
    })
  );
};

