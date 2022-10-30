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
      const params = service[methodName];
      api[serviceName][methodName] = (...args) =>
        new Promise((resolve, reject) => {
          const uri = [basePath, serviceName, methodName];
          if (args.length > 0 && params[0] === 'id') uri.push(args.shift());
          const options = {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ args })
          };
          fetch(uri.join('/'), options)
            .then((res) => {
              if (!regex.test(res.status))
                reject(new Error(`Status Code: ${res.status}`));
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
