'use strict';

const fastify = require('fastify')();
const cors = require('@fastify/cors');

const routeHandler = (entity) => async (fastify) => {
  const procedures = Object.keys(entity);
  for (const procedure of procedures) {
    const handler = entity[procedure];
    const src = handler.toString();
    const signature = src.substring(0, src.indexOf(')'));
    const isId = signature.includes('(id');
    const isRecord = signature.includes('{');
    let path = '/' + procedure;
    if (isId) path += procedure === 'read' ? '/:id?' : '/:id';
    fastify.post(path, async (req, res) => {
      const args = [];
      if (isId) args.push(req.params.id);
      if (isRecord) args.push(...req.body);

      const result = await handler(...args);
      if ('rows' in result) return res.code(200).send(result.rows);
      res.code(404).send(result);
    });
  }
};

module.exports = (routing, console, options) => {
  const {
    port,
    host,
    prefix = '/'
  } = options;

  fastify.register(cors, {
    origin: '*',
    methods: 'GET, HEAD, POST',
    allowedHeaders: 'origin, content-type, accept',
    masAge: 86400
  });

  const entities = Object.keys(routing);
  for (const entityName of entities) {
    const entity = routing[entityName];
    fastify.register(routeHandler(entity), { prefix: prefix + entityName });
  }

  fastify.listen({ port, host }, (err) => {
    if (err) {
      console.error(err);
      process.exit(1);
    }

    console.log(`API server on http://${host}:${port}`);
  });
};
