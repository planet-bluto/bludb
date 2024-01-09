const Database = require("@replit/database")

function buildAdapter(URL) {
  var db = new Database(URL)

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

  return [REPLAdapter, getKeys]
}

module.exports = buildAdapter