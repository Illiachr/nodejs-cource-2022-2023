'use strict';

const server = require('fastify')();
const cors = require('@fastify/cors');
const console = require('./logger.js');

const crud = {
  read: 'get',
  create: 'post',
  update: 'put',
  delete: 'delete',
  // find: 'post'
};

module.exports = (routing, port) => {
  const routeHandler = async (req, res, done) => {
    const { method, url } = req.raw;
    const { id } = req.params;
    const payload = req.body;
    const entity = routing[url];
    if (!entity) {
      res.statusCode = 404;
      return res.send({ message: 'Route not found' });
    }
    const procedure = method.toLowerCase() === 'post' ?
      crud[method.toLowerCase()](payload) :
      crud[method.toLowerCase()];
    console.log({ procedure });
    const handler = entity[procedure];
    if (!entity) {
      res.statusCode = 404;
      return res.send({ message: 'Route not found' });
    }
    const src = handler.toString();
    const signature = src.substring(0, src.indexOf(')'));
    const args = [];
    if (signature.includes('(id')) args.push(id);
    if (signature.includes('(mask')) args.push(payload.mask);
    if (signature.includes('{')) args.push(payload);
    if (['read', 'find'].includes(procedure)) args.push(true);

    console.log(`${req.ip} ${method} ${url}`);

    const body = await handler(...args);
    if (procedure === 'read') {
      res.statusCode = 200;
      return res.send(body.rows);
    }
    res.statusCode = 204;
    res.send();
    done();
  };

  server.register(cors);

  // server.addHook('onRequest', routeHandler);
  for (const entity in routing) {
    const procedure = routing[entity];
    for (const key in procedure) {
      const method = crud[key];
      const handler = procedure[key];
      if (!method) continue;
      const url = [entity];
      const src = handler.toString();
      const signature = src.substring(0, src.indexOf(')'));
      if (signature.includes('(id')) url.push(':id');
      console.log(signature, `/${url.join('/')}`);
      const route = {
        method: method.toUpperCase(),
        url: `/${url.join('/')}`,
        handler: async (req, res) => {
          console.log({ query: req.query });
          console.log({ url: req.url });
          const { id } = req.params;
          const { mask } = req.query;
          const payload = req.body;
          const src = handler.toString();
          const signature = src.substring(0, src.indexOf(')'));
          const args = [];
          if (signature.includes('(id')) args.push(id);
          if (signature.includes('(mask')) args.push(
            payload[Object.keys(payload)[0]]
          );
          if (signature.includes('{')) args.push(payload);
          if (procedure === 'read') args.push(true);
          console.log(`${req.ip} ${method} ${url}`);
          const body = await handler(...args);
          res.send(body.rows);
        },
      };
      server.register((app, _, done) => {
        app.route(route);
        done();
      });
      // server[method](`/${entity}`, routeHandler);
    }
  }
  // server.register((app, _, done) => {
  //   app.get('/users', (req, res) => {
  //     console.log(req);
  //   });
  //   // app.route(route);

  //   done();
  // }, { prefix: '/' });


  server.listen({ port }, (err) => {
    if (err) return console.error(`Listen on port ${port}`);
    console.log(`Listen on port ${port}`);
  });
};
