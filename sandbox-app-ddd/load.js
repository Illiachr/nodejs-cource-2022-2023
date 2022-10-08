'use strict';

const fsp = require('node:fs').promises;
const vm = require('node:vm');

const RUN_OPTIONS = { timeout: 5000, displayErrors: false };

module.exports = async (filePath, sandbox) => {
  const src = await fsp.readFile(filePath, 'utf8');
  const code = `'use strict';\n${src}`;
  const script = new vm.Script(code);
  console.log({ script });
  const ctx = vm.createContext(Object.freeze({ ...sandbox }));
  const exported = script.runInContext(ctx, RUN_OPTIONS);
  console.log({ exported });
  return exported;
};
