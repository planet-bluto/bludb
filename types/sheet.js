var gsheetdb = require("gsheetdb")

function buildAdapter(spreadsheet_id, sheet_name, credentials = require(process.env["bludb_sheet_credentials"]|| "../credentials.json")) {
  var this_db = new gsheetdb({
    spreadsheetId: spreadsheet_id,
    sheetName: sheet_name,
    credentialsJSON: credentials
  })

  class SheetAdapter {
    constructor(db_key) {
      this.key = db_key
      this.ind = null
    }

    async read() {
      var sheetData = null
      var thisData = null
      var lastRowNb = 0

      try {
        sheetData = await this_db.getData()
      } catch (err) {
        await this_db.insertRows([["header??","header??","header??"]])
        lastRowNb += 1
        sheetData = null
      }

      if (sheetData != null) {
        sheetData.forEach((row, ind) => {
          lastRowNb = row.rowNb
          if (row.values[0] == this.key) {
            this.ind = row.rowNb
            thisData = JSON.parse(row.values[1])
          }
        })
      }

      if (thisData == null) {
        let thisRowNb = lastRowNb+1
        this.ind = thisRowNb
      }

      return thisData
    }

    async write(data) {
      // print("Writing to JSON: ", data)
      if (this.ind == null) { await this.read() }
      await this_db.updateRow(this.ind, [this.key, JSON.stringify(data)])
    }
  }

  async function getKeys() {
    var keys = []

    var sheetData
    try {
      sheetData = await this_db.getData()
    } catch (err) {
      sheetData = null
    }

    if (sheetData != null) {
      sheetData.forEach((row, ind) => {
        keys.push(row.values[0])
      })
    }

    return keys
  }

  return [SheetAdapter, getKeys]
}

module.exports = buildAdapter