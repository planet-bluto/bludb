require("./arrayLib.js")

var Low;
var lowdb_resolve;
var lowdb_prom = new Promise((res, rej) => { lowdb_resolve = res })

var jsonfile_resolve
var JSONFile = new Promise((res, rej) => { jsonfile_resolve = res })

import('lowdb/node').then(lowdb_node_module => {
	JSONFile = lowdb_node_module.JSONFile
	jsonfile_resolve(JSONFile)
})

import('lowdb').then(lowdb_module => {
	Low = lowdb_module.Low
	lowdb_resolve()
})

class BluDB {
	constructor(...args) {
		this._adapters = []
		this._key_getters = []
		this._deleters = []

		var yuh = async (arr, thisKey, thisInd) => {
			let ind = this[thisKey].length
			if (arr.then != null) {
				this[thisKey].push(arr)
				arr = await arr
				this[thisKey][ind] = arr[thisInd]
			} else {
				this[thisKey].push(arr[thisInd])
			}
			// print(this._adapters)
		}

		args.map((arr, ind) => yuh(arr, "_adapters", 0))
		args.map((arr, ind) => yuh(arr, "_key_getters", 1))
		args.map((arr, ind) => yuh(arr, "_deleters", 2))
		this._defaults = []
	}

	async _hold_up() {
		await lowdb_prom
		await this._adapters.awaitForEach(async (adapter, ind) => {
			if (adapter.then != null) {
				var res = await adapter
				this._adapters[ind] = res[0]
				this._key_getters[ind] = res[1]
			}
		})
	}

	async _clone(db_key, override = null) {
		var root_data = override
		var writes = []
		this._adapters.forEach((adapter, ind) => {
			var db = new Low(new adapter(db_key), {})
			if (ind != 0) {
				db.data = root_data
				// print("Write from _clone():")
				writes.push(db.write())
			} else if (root_data == null) {
				// print(db)
				root_data = db.data
			}
		})

		await Promise.all(writes)
	}

	default(value, match) {
		var def_obj = {value}

		if (typeof match == "function") {
			def_obj.match = match
		} else {
			def_obj.match = ((db_key) => (db_key == match))
		}

		this._defaults.push(def_obj)
	}

	async fetch(db_key) {
		await this._hold_up()

		var def_val = {}
		this._defaults.forEach(obj => {
			if (obj.match(db_key)) {
				def_val = obj.value
			}
		})

		var main_db = new Low(new this._adapters[0](db_key), def_val)
		await main_db.read()
		// print(main_db)

		var raid_db = {
			data: main_db.data,
			read: async () => {
				await main_db.read()
				raid_db.data = main_db.data
				// await this._clone(db_key, raid_db.data)
			},
			write: async () => {
				main_db.data = raid_db.data
				var main_write = main_db.write()
				var other_writes = this._clone(db_key, raid_db.data)

				await Promise.all([main_write, other_writes])
			},
			delete: async () => {
				main_db.data = raid_db.data
				var deletes = []
				this._deleters.forEach(deleter => {
					deletes.push(deleter(db_key))
				})

				// var other_writes = this._clone(db_key, raid_db.data)

				await Promise.all(deletes)
			}
		}

		return raid_db
		// await this._adapters.awaitForEach((this_db, ind) => {
		// 	var db = new Low(new this._adapters())
		// 	await db.read()
		// })
	}

	async keys() {
		await this._hold_up()
		// print(this._key_getters)
		var result = await this._key_getters[0]()
		return result
	}

	async delete() {
		
	}
}

var JSONBuilder = require("./types/json.js")
// var JSONBuilder = (() => {return JSONFile})
var REPLBuilder = require("./types/repl.js")
// var SheetBuilder = require("./types/sheet.js")

module.exports = {BluDB, REPLBuilder, JSONBuilder}