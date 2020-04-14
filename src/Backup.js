const exec = require('child_process').exec
const p = require('path')

module.exports = class Backup {
  static exec (path, outputName) {
    return new Promise((resolve, reject) => {
      const fileName = `${outputName}.tar.gz`
      const command = `pliz backup -q --files --db -o ${fileName}`

      exec(command, { cwd: path }, (error, stdout, stderr) => {
        if (error) {
          reject(error)
        }

        // we can't handle error since mysql warning send an error
        // if (stderr) {
        //   reject(stderr)
        // }

        // console.log(`stdout: ${stdout}`)
        // console.error(`stderr: ${stderr}`)
        resolve(p.join(path, fileName))
      })
    })
  }
}
