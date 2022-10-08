'use strict';

const config = require('./config.json');
const pg = require('pg');

const pool = new pg.Pool(config.db);

module.exports = (table) => ({
  query(sql, args) {
    return pool.query(sql, args);
  },

  read(id, fields = ['*']) {
    const names = fields.join(', ');
    const sql = `SELECT ${names} FROM ${table}`;
    if (!id) return pool.query(sql);
    return pool.query(`${sql} WHERE id = $1`, [id]);
  },

  async create({ ...record }, returnId = false) {
    const keys = Object.keys(record);
    const nums = new Array(keys.length);
    const data = new Array(keys.length);
    let i = 0;
    for (const key of keys) {
      data[i] = record[key];
      nums[i] = `$${++i}`;
    }
    const fields = '"' + keys.join('", "') + '"';
    const params = nums.join(', ');
    let sql =
      `INSERT INTO "${table}" (${fields}) VALUES (${params})`;
    if (returnId) sql += ' RETURNING id';
    return pool.query(sql, data);
  },

  async update(id, { ...record }, returnId = false) {
    const keys = Object.keys(record);
    const updates = new Array(keys.length);
    const data = new Array(keys.length);
    let i = 0;
    for (const key of keys) {
      data[i] = record[key];
      updates[i] = `${key} = $${++i}`;
    }
    const delta = updates.join(', ');
    let sql = `UPDATE ${table} SET ${delta} WHERE id = $${++i}`;
    data.push(id);
    if (returnId) sql += ' RETURNING id';
    return pool.query(sql, data);
  },

  delete(id, returnId = false) {
    let sql = `DELETE FROM ${table} WHERE id = $1`;
    if (returnId) sql += ' RETURNING id';
    return pool.query(sql, [id]);
  }
});
