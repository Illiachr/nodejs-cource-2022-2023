'use strict';

const transport = {};

transport.ws = (url) => (structure) => {
  const api = {};
  const socket = new WebSocket(url);
  const services = Object.keys(structure);
  for (const serviceName of services) {
    api[serviceName] = {};
    const service = structure[serviceName];
    const methods = Object.keys(service);
    for (const methodName of methods) {
      api[serviceName][methodName] = (...args) => new Promise((resolve) => {
        const packet = { name: serviceName, method: methodName, args };
        socket.send(JSON.stringify(packet));
        socket.onmessage = (event) => {
          const data = JSON.parse(event.data);
          resolve(data);
        };
      });
    }
  }

  return api;
};

transport.http = (url) => (structure) => {
  const crud = {
    create: 'POST',
    read: 'GET',
    update: 'PUT',
    delete: 'DELETE',
    find: 'GET',
  };

  const api = {};
  const basePath = url.endsWith('/') ?
    url.substring(0, url.length - 1) : url;
  const regex = /20[0-9]|404/;

  const services = Object.keys(structure);
  for (const serviceName of services) {
    api[serviceName] = {};
    const service = structure[serviceName];
    const methods = Object.keys(service);
    for (const methodName of methods) {
      const argsSchema = structure[serviceName][methodName];
      api[serviceName][methodName] = (...args) =>
        new Promise((resolve, reject) => {
          const method = crud[methodName];
          const uriParts = [basePath, serviceName];
          const options = { method };
          const query = {};
          let payload = {};
          for (const [i, key] of argsSchema.entries()) {
            if (key === 'id') {
              uriParts.push(args[i]);
              continue;
            }
            if (key === 'mask') {
              query.mask = args[i];
              continue;
            }
            if (key === 'record') payload = {
              ...payload,
              ...args[i]
            };
          }
          let uri = uriParts.join('/');
          if (Object.keys(query).length > 0)
            uri = `${uri}?${new URLSearchParams(query)}`;
          if (Object.keys(payload).length > 0)
            options.body = JSON.stringify(payload);
          console.log({ argsSchema, uri, method, options });
          fetch(uri, options)
            .then((res) => {
              const { status } = res;
              if (!regex.test(status)) {
                return reject(new Error(`Status Code: ${status}`));
              }
              resolve(res.json());
            });
        });
    }
  }

  return api;
};


const structure = {
  users: {
    create: ['record'],
    read: ['id'],
    update: ['id', 'record'],
    delete: ['id'],
    find: ['mask'],
  },
  countries: {
    read: ['id'],
    find: ['mask'],
  }
};

const scaffold = (url) => {
  const protocol = url.startsWith('ws:') ? 'ws' : 'http';
  return transport[protocol](url);
};

// const HOST_URL = 'ws://127.0.0.1:8001/';
const HOST_URL = 'http://127.0.0.1:8001/';

(async () => {
  const api = await scaffold(HOST_URL)(structure);
  const userData = await api.users.read(4);
  console.dir({ userData });
})();
