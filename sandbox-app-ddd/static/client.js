'use strict';

// const url = 'ws://127.0.0.1:8001/';
const url = 'http://127.0.0.1:8001/';

// const scaffold = (url, structure) => {
//   const api = {};
//   const transport = url.split(':')[0];
//   if (transport === 'ws') {
//     const socket = new WebSocket(url);
//   }
//   const services = Object.keys(structure);
//   for (const serviceName of services) {
//     api[serviceName] = {};
//     const service = structure[serviceName];
//     const methods = Object.keys(service);
//     for (const methodName of methods) {
//       api[serviceName][methodName] = (...args) => new Promise((resolve) => {
//         const packet = { name: serviceName, method: methodName, args };
//         socket.send(JSON.stringify(packet));
//         socket.onmessage = (event) => {
//           const data = JSON.parse(event.data);
//           resolve(data);
//         };
//       });
//     }
//   }

//   return api;
// };

const crud = {
  create: 'POST',
  read: 'GET',
  update: 'PUT',
  delete: 'DELETE',
  find: 'POST',
};

const scaffold = (url, structure) => {
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
      api[serviceName][methodName] = (...args) =>
        new Promise((resolve, reject) => {
          // const packet = { name: serviceName, method: methodName, args };
          const method = crud[methodName];
          const uri = [basePath, serviceName];
          const argsSchema = structure[serviceName][methodName];
          const options = { method };
          let payload = {};
          for (const [i, key] of argsSchema.entries()) {
            if (key === 'id') uri.push(args[i]);
            if (typeof args[i] === 'object') payload = {
              ...payload,
              ...args[i]
            };
          }
          if (Object.keys(payload).length > 0)
            options.body = JSON.stringify(payload);
          // const idIndex = argsSchema.indexOf('id');
          // const recordIndex = argsSchema.indexOf('record');
          // const payload = recordIndex ? args[recordIndex] : {};
          // if (idIndex >= 0) uri.push(args[idIndex]);
          console.log({ argsSchema, uri, method, options });
          fetch(uri.join('/'), options)
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

const api = scaffold(url, {
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
});

// const api = scaffold({
//   users: {
//     create: ['record'],
//     read: ['id'],
//     update: ['id', 'record'],
//     delete: ['id'],
//     find: ['mask'],
//   },
//   countries: {
//     read: ['id'],
//     find: ['mask'],
//   }
// });

// socket.addEventListener('open', async () => {
//   const userData = await api.users.read(2);
//   const countryData = await api.countries.read(2);
//   console.dir({ userData, countryData });
// });

(async () => {
  const userData = await api.users.update(22, {
    login: 'testuser', password: '345679'
  });
  console.dir({ userData });
})();
