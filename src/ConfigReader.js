const fs = require('fs')

module.exports = class ConfigReader {
  static getConfig (path) {
    const rawdata = fs.readFileSync(path)
    this.config = JSON.parse(rawdata)
    return this.config
  }
}
