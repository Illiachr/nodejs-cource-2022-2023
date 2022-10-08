'use strict';

const http = require('node:http');
const config = require('./config.json');
const console = require(config.logger);

const crud = {
  get: 'read',
  post(params) {
    return Object.keys(params).includes('mask') ? 'find' : 'create';
  },
  put: 'update',
  delete: 'delete'
};

const preflightHeaders = {
  'Access-Control-Allow-Origin': '*', /* @dev First, read about security */
  'Access-Control-Allow-Methods': 'OPTIONS, GET, POST, PUT, DELETE',
  'Access-Control-Max-Age': 2592000, // 30 days
  /** add other headers as per requirement */
};

const headers = {
  'Content-Type': 'application/json',
  'Access-Control-Allow-Origin': '*'
};

const receivePayload = async (req) => {
  const buffers = [];
  for await (const chunk of req) buffers.push(chunk);
  const data = Buffer.concat(buffers).toString();
  return JSON.parse(data);
};

module.exports = (routing, port, ctxPathIdx = 1) => {
  const routeHandler = async (req, res) => {
    const { method, url, socket } = req;
    const [ctxPath, id] = url.substring(ctxPathIdx).split('/');
    const payload = method.toLowerCase() === 'post' ?
      await receivePayload(req) : null;
    if (req.method === 'OPTIONS') {
      console.log(`${socket.remoteAddress} ${method} ${url}`);
      res.writeHead(204, preflightHeaders);
      return res.end();
    }
    if (id && !parseInt(id, 10)) {
      res.writeHead(400, headers);
      return res.end(JSON.stringify({
        message: 'ID should contain only numbers'
      }));
    }
    const entity = routing[ctxPath];
    if (!entity) {
      res.writeHead(400, headers);
      return res.end(JSON.stringify({ message: 'Route not found' }));
    }
    const procedure = method.toLowerCase() === 'post' ?
      crud[method.toLowerCase()](payload) :
      crud[method.toLowerCase()];
    console.log({ procedure });
    const handler = entity[procedure];
    if (!handler) {
      res.writeHead(400, headers);
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
      res.writeHead(200, headers);
      return res.end(JSON.stringify(body.rows));
    }

    if (procedure === 'read' || procedure === 'find') {
      res.writeHead(200, headers);
      return res.end(JSON.stringify(body.fields));
    }

    if (procedure === 'create') {
      const statusCode = body.rows.length === 0 ? 500 : 201;
      const replyBody = statusCode === 500 ?
        { message: 'Internal error' } :
        { id: body.rows[0].id };
      res.writeHead(statusCode, headers);
      return res.end(JSON.stringify(replyBody));
    }

    if (procedure === 'delete') {
      const statusCode = body.rows.length === 0 ? 404 : 200;
      const replyBody = statusCode === 404 ?
        { message: 'ID not found' } :
        { id: body.rows[0].id };
      res.writeHead(statusCode, headers);
      return res.end(JSON.stringify(replyBody));
    }

    if (procedure === 'create' || procedure === 'update') {
      const statusCode = body.rows.length === 0 ? 404 : 201;
      const replyBody = statusCode === 404 ?
        { message: 'ID not found' } :
        { id: body.rows[0].id };
      res.writeHead(statusCode, headers);
      return res.end(JSON.stringify(replyBody));
    }

    res.writeHead(405, headers);
    res.end(JSON.stringify({
      message: `${method} is not allowed for the request.`
    }));
  };

  const server = http.createServer(routeHandler);

  server.listen(port, () => {
    console.log(`Listen on port ${port}`);
  });

  server.on('error', (err) => {
    console.error(err);
  });
};
