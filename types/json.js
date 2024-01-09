// var { JSONFile } = require('lowdb/node')
const fs = require("fs/promises")
const fse = require('fs-extra')
const path = require("path")

function buildAdapter(root = "db") {
  class JSONAdapter {
    constructor(db_key) {
      this.path = path.join(root, (db_key + ".json"))
    }

    async read() {
      var data = null

      await fse.ensureFile(this.path)
      try {
        data = await fse.readJson(this.path)
      } catch (err) {
        // print(err)
        data = null
      }

      return data
    }

    async write(data) {
      await fse.ensureFile(this.path)
      await fse.writeJson(this.path, data)
    }
  }

  async function getKeys() {
    var keys = new Set()

    async function parseDir(dirpath, level = []) {
      var entries = await fs.readdir(dirpath, {withFileTypes: true})

      await entries.awaitForEach(async entry => {
        if (entry.isFile()) {
          if (entry.name.includes(".")) {
            var name_bits = entry.name.split(".")
            var ext = name_bits.pop()
            name = name_bits.join(".")
          }

          keys.add([...level, name].join("/"))
        }

        if (entry.isDirectory()) {
          // level.push()
          await parseDir(path.join(dirpath, entry.name), [...level, entry.name])
        }
      })
    }

    await parseDir(root)

    return Array.from(keys)
  }

  return [JSONAdapter, getKeys]
}

module.exports = buildAdapter