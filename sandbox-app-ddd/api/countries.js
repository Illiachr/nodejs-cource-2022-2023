const countries = db('country');

({
  read(id) {
    console.log({ db });
    return countries.read(id);
  },

  find(mask) {
    const sql = 'SELECT * from country WHERE name LIKE $1';
    return countries.query(sql, [mask]);
  },
});
