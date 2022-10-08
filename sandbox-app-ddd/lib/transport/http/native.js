'use strict';

const http = require('node:http');

const HEADERS = {
  'X-XSS-Protection': '1; mode=block',
  'X-Content-Type-Options': 'nosniff',
  'Strict-Transport-Security': 'max-age=31536000; includeSubdomains; preload',
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'OPTIONS, GET, OPTIONS, PUT, DELETE',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Content-Type': 'application/json; charset=UTF-8',
};

const crud = {
  get: 'read',
  post(params) {
    return Object.keys(params).includes('mask') ? 'find' : 'create';
  },
  put: 'update',
  delete: 'delete'
};

const receivePayload = async (req) => {
  const buffers = [];
  for await (const chunk of req) buffers.push(chunk);
  const data = Buffer.concat(buffers).toString();
  return JSON.parse(data);
};

module.exports = (routing, console, options) => {
  const {
    port,
    host,
    version = 'v1'
  } = options;

  const routeHandler = async (req, res) => {
    const { method, url, socket } = req;
    const [ctxPath, id] = url.substring(1).split('/');
    const payload = ['post', 'put'].includes(method.toLowerCase()) ?
      await receivePayload(req) : null;
    if (req.method === 'OPTIONS') {
      console.log(`${socket.remoteAddress} ${method} ${url}`);
      res.writeHead(204, HEADERS);
      return res.end();
    }
    if (id && !parseInt(id, 10)) {
      res.writeHead(400, HEADERS);
      return res.end(JSON.stringify({
        message: 'ID should contain only numbers'
      }));
    }
    const entity = routing[ctxPath];
    if (!entity) {
      res.writeHead(400, HEADERS);
      return res.end(JSON.stringify({ message: 'Route not found' }));
    }
    const procedure = method.toLowerCase() === 'post' ?
      crud[method.toLowerCase()](payload) :
      crud[method.toLowerCase()];
    console.log({ procedure });
    const handler = entity[procedure];
    if (!handler) {
      res.writeHead(400, HEADERS);
      return res.end(JSON.stringify({ message: 'Method not defined' }));
    }
    const src = handler.toString();
    const signature = src.substring(0, src.indexOf(')'));
    const args = [];
    if (signature.includes('(id')) args.push(id);
    if (signature.includes('(mask')) args.push(
      payload[Object.keys(payload)[0]]
    );
    if (signature.includes('{')) args.push(payload);
    if (procedure === 'read') args.push(true);
    console.log(`${socket.remoteAddress} ${method} ${url}`);
    const body = await handler(...args);
    if (procedure === 'read') {
      res.writeHead(200, HEADERS);
      return res.end(JSON.stringify(body.rows));
    }

    if (procedure === 'read' || procedure === 'find') {
      res.writeHead(200, HEADERS);
      return res.end(JSON.stringify(body.fields));
    }

    if (procedure === 'create') {
      const statusCode = body.rows.length === 0 ? 500 : 201;
      const replyBody = statusCode === 500 ?
        { message: 'Internal error' } :
        { id: body.rows[0].id };
      res.writeHead(statusCode, HEADERS);
      return res.end(JSON.stringify(replyBody));
    }

    if (procedure === 'delete') {
      const statusCode = body.rows.length === 0 ? 404 : 200;
      const replyBody = statusCode === 404 ?
        { message: 'ID not found' } :
        { id: body.rows[0].id };
      res.writeHead(statusCode, HEADERS);
      return res.end(JSON.stringify(replyBody));
    }

    if (procedure === 'create' || procedure === 'update') {
      const statusCode = body.rows.length === 0 ? 404 : 201;
      const replyBody = statusCode === 404 ?
        { message: 'ID not found' } :
        { id: body.rows[0].id };
      res.writeHead(statusCode, HEADERS);
      return res.end(JSON.stringify(replyBody));
    }

    res.writeHead(405, HEADERS);
    res.end(JSON.stringify({
      message: `${method} is not allowed for the request.`
    }));
  };

  const server = http.createServer(routeHandler);

  server.listen(port, host, () => {
    console.log(`Listen on http://${host}:${port}`);
  });

  server.on('error', (err) => {
    console.error(err);
  });
};
