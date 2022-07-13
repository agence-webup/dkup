const exec = require('child_process').exec
const p = require('path')

module.exports = class Backup {
  constructor (fileName, command, path) {
    this.fileName = `${fileName}.tar.gz`
    this.command = command
    this.path = path
  }

  exec () {
    return new Promise((resolve, reject) => {
      const commandToRun = this.getCustomCommand()

      exec(commandToRun, { cwd: this.path }, (error, stdout, stderr) => {
        if (error) {
          reject(error)
        }
        // we can't handle error since mysql warning send an error
        // if (stderr) {
        //   reject(stderr)
        // }

        // console.log(`stdout: ${stdout}`)
        // console.error(`stderr: ${stderr}`)
        resolve(p.join(this.path, this.fileName))
      })
    })
  }

  getCustomCommand () {
    return `${this.command.replace('@FILENAME', this.fileName)}`
  }
}
