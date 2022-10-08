'use strict';

const db = require('./db.js');
const hash = require('./hash.js');

const users = db('users');

module.exports = {
  read(id) {
    return users.read(id, ['id', 'login']);
  },

  async create({ login, password }) {
    const passwordHash = await hash(password);
    return users.create({ login, password: passwordHash }, true);
  },

  async update(id, { login, password }) {
    const passwordHash = await hash(password);
    return users.update(id, { login, password: passwordHash }, true);
  },

  delete(id) {
    return users.delete(id, true);
  },
};
