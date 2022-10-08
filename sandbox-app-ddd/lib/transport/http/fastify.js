'use strict';

const server = require('fastify')();
const cors = require('@fastify/cors');

const crud = {
  get: 'read',
  post: 'create',
  put: 'update',
  delete: 'delete',
};

module.exports = (routing, console, options) => {
  const {
    port,
    host,
    prefix = '/'
  } = options;

  const routeHandler = async (req, res) => {
    const { method, url, socket } = req;
    const [ctxPath, id] = url.substring(1).split('/');

    if (id && !parseInt(id, 10)) {
      const message = 'ID should contain only numbers';
      return res.code(400).send({ message });
    }

    const entity = routing[ctxPath];
    if (!entity) {
      const message = 'Route not found';
      return res.code(404).send({ message });
    }

    const procedure = crud[method.toLowerCase()];
    console.log({ procedure });
    const handler = entity[procedure];
    if (!handler) {
      const message = 'Method not defined';
      return res.code(400).send({ message });
    }

    const src = handler.toString();
    const signature = src.substring(0, src.indexOf(')'));
    const args = [];
    if (signature.includes('(id')) args.push(id);
    if (signature.includes('(mask')) args.push(req.query.mask);
    if (signature.includes('{')) args.push(JSON.parse(req.body));
    console.log(`${socket.remoteAddress} ${method} ${url}`);
    const body = await handler(...args);

    if (procedure === 'find') return res.send(body.fields);

    if (procedure === 'create') {
      const statusCode = body.rows.length === 0 ? 500 : 201;
      const replyBody = statusCode === 500 ?
        { message: 'Internal error' } :
        { id: body.rows[0].id };
      res.statusCode = statusCode;
      return res.send(replyBody);
    }

    if (procedure === 'delete') {
      const statusCode = body.rows.length === 0 ? 404 : 200;
      const replyBody = statusCode === 404 ?
        { message: 'ID not found' } :
        { id: body.rows[0].id };
      res.statusCode = statusCode;
      return res.send(replyBody);
    }

    if (procedure === 'update') {
      const statusCode = body.rows.length === 0 ? 404 : 201;
      const replyBody = statusCode === 404 ?
        { message: 'ID not found' } :
        { id: body.rows[0].id };
      res.statusCode = statusCode;
      return res.send(replyBody);
    }

    res.send(body.rows);
  };

  server.register(cors);

  server.get('/*', routeHandler);
  server.post('/*', routeHandler);
  server.put('/*', routeHandler);
  server.delete('/*', routeHandler);


  server.listen({ port, host }, (err) => {
    if (err) return console.error(err.message);
    console.log(`API server on http://${host}:${port}`);
  });
};
