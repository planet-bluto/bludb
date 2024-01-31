const Database = require("@replit/database")

function buildAdapter(URL) {
  var db = new Database(URL)
  var db_key; 

  class REPLAdapter {
    constructor(db_key) {
      this.key = db_key
    }

    async read() {
      const data = await db.get(this.key)
      return data
    }

    async write(data) {
      return db.set(this.key, data)
    }
  }

  async function getKeys() {
    var keys = []

    keys = await db.list()

    return keys
  }

  async function deleter(db_key) {
    await db.delete(db_key)
  }

  return [REPLAdapter, getKeys, deleter]
}

module.exports = buildAdapter