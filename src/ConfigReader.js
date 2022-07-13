const fs = require('fs')

module.exports = class ConfigReader {
  static getConfig (path) {
    try {
      const rawdata = fs.readFileSync(path)
      this.config = JSON.parse(rawdata)
      return this.config
    } catch (err) {
      console.error('Unable to open config file')
    }
  }
}
