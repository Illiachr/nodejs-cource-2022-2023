const cities = db('city');

({
  read(id) {
    console.log({ db });
    return cities.read(id);
  },

  find(mask) {
    const sql = 'SELECT * FROM city WHERE name LIKE $1';
    return cities.query(sql, [mask]);
  },
});
