// var { JSONFile } = require('lowdb/node')
const fs = require("fs/promises")
const fse = require('fs-extra')
const path = require("path")
const TaskManager = require("task-manager")
const Queues = {}

function buildAdapter(root = "db") {
  class JSONAdapter {
    constructor(db_key) {
      this.path = path.join(root, (db_key + ".json"))
      if (!Object.keys(Queues).includes(db_key)) { Queues[db_key] = new TaskManager() }
      this.Queue = Queues[db_key]
    }

    async read() {
      var data = null

      await this.Queue.add(async () => {
        await fse.ensureFile(this.path)
        try {
          data = await fse.readJson(this.path)
        } catch (err) {
          // print(err)
          data = null
        }
      })

      return data
    }

    async write(data) {
      await this.Queue.add(async () => {
        await fse.ensureFile(this.path)
        await fse.writeJson(this.path, data)
      })
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

  async function deleter(db_key) {
    if (!Object.keys(Queues).includes(db_key)) { Queues[db_key] = new TaskManager() }
    var Queue = Queues[db_key]

    var dbFilePath = path.join(root, (db_key + ".json"))

    await Queue.add(async () => {
      try {
        await fs.access(dbFilePath)
        await fs.unlink(dbFilePath)
      } catch(err) {
        // Not real??
      }
    })
  }

  return [JSONAdapter, getKeys, deleter]
}

module.exports = buildAdapter