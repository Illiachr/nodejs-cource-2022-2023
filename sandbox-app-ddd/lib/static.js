'use strict';

const http = require('node:http');
const path = require('node:path');
const fsp = require('node:fs').promises;

module.exports = (root, console, options) => {
  const { port, host } = options;

  http.createServer(async (req, res) => {
    const url = req.url === '/' ? '/index.html' : req.url;
    const filePath = path.join(root, url);
    try {
      const data = await fsp.readFile(filePath);
      res.end(data);
    } catch (err) {
      res.statusCode = 404;
      res.end('"File is not found"');
    }
  }).listen(port, host);

  console.log(`Static on http://${host}:${port}`);
};
