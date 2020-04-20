const constants = require('./constants')
const datefns = require('date-fns')
const p = require('path')

const validPeriods = [
  constants.MONTHLY,
  constants.WEEKLY,
  constants.DAILY,
  constants.HOURLY,
  constants.EVERY4HOURS
]

module.exports = class Manager {
  checkForBackup (project, filesList) {
    const backupToDo = []
    const currentDate = new Date()

    project.frequencies.forEach(frequency => {
      const interval = frequency.split(':')[0]

      switch (interval) {
        case constants.MONTHLY : {
          const lastBackupDate = this.extractLastBackup(this.parseFileList(filesList), constants.MONTHLY)
          if (lastBackupDate === null || datefns.differenceInMonths(currentDate, lastBackupDate) >= 1) {
            backupToDo.push(constants.MONTHLY)
          }
          break
        }
        case constants.WEEKLY: {
          const lastBackupDate = this.extractLastBackup(this.parseFileList(filesList), constants.WEEKLY)
          if (lastBackupDate === null || datefns.differenceInWeeks(currentDate, lastBackupDate) >= 1) {
            backupToDo.push(constants.WEEKLY)
          }
          break
        }

        case constants.DAILY: {
          const lastBackupDate = this.extractLastBackup(this.parseFileList(filesList), constants.DAILY)
          if (lastBackupDate === null || datefns.differenceInDays(currentDate, lastBackupDate) >= 1) {
            backupToDo.push(constants.DAILY)
          }
          break
        }

        case constants.HOURLY: {
          const lastBackupDate = this.extractLastBackup(this.parseFileList(filesList), constants.HOURLY)
          if (lastBackupDate === null || datefns.differenceInHours(currentDate, lastBackupDate) >= 1) {
            backupToDo.push(constants.HOURLY)
          }
          break
        }

        case constants.EVERY4HOURS: {
          const lastBackupDate = this.extractLastBackup(this.parseFileList(filesList), constants.EVERY4HOURS)
          if (lastBackupDate === null || datefns.differenceInHours(currentDate, lastBackupDate) >= 4) {
            backupToDo.push(constants.EVERY4HOURS)
          }
          break
        }
      }
    })

    return backupToDo
  }

  checkForBackupToDelete (project, filesList) {
    // classify filelist by period
    const parsedFilesList = this.parseFileList(filesList)
    let toDelete = []
    project.frequencies.forEach(frequency => {
      let [interval, limit] = frequency.split(':')
      limit = parseInt(limit)
      if (Number.isInteger(limit) && limit > 0) {
        switch (interval) {
          case constants.MONTHLY: {
            toDelete = [...toDelete, ...this.extractFileToDelete(parsedFilesList, constants.MONTHLY, limit)]
            break
          }
          case constants.WEEKLY: {
            toDelete = [...toDelete, ...this.extractFileToDelete(parsedFilesList, constants.WEEKLY, limit)]
            break
          }

          case constants.DAILY: {
            toDelete = [...toDelete, ...this.extractFileToDelete(parsedFilesList, constants.DAILY, limit)]
            break
          }

          case constants.HOURLY: {
            toDelete = [...toDelete, ...this.extractFileToDelete(parsedFilesList, constants.HOURLY, limit)]
            break
          }

          case constants.EVERY4HOURS: {
            toDelete = [...toDelete, ...this.extractFileToDelete(parsedFilesList, constants.EVERY4HOURS, limit)]
            break
          }
        }
      }
    })

    return toDelete
  }

  extractFileToDelete (list, interval, limit) {
    // no backup to process
    if (list[interval].length === 0) return []

    let filesToDelete = []

    // console.log(list[interval].length - limit)
    if (list[interval].length >= limit) {
      filesToDelete = list[interval].slice(0, list[interval].length - limit)
    }

    return filesToDelete
  }

  extractLastBackup (parsedFilesList, period) {
    // TODO: reorder filename by date from S3 to be more robust
    if (parsedFilesList[period] && parsedFilesList[period].length > 0) {
      // get most recent file
      const lastBackup = parsedFilesList[period][parsedFilesList[period].length - 1]
      const lastBackupDate = this.extractDateFromFilename(lastBackup)
      return lastBackupDate
    } else {
      return null
    }
  }

  parseFileList (filesList) {
    const self = this

    function compareBydateAsc (a, b) {
      return datefns.compareAsc(self.extractDateFromFilename(a.Key), self.extractDateFromFilename(b.Key))
    }

    const result = {
      hourly: [],
      every4hours: [],
      daily: [],
      weekly: [],
      monthly: []
    }

    if (Array.isArray(filesList) && filesList.length > 0) {
      // order date in array for deletion process
      filesList.sort(compareBydateAsc)

      filesList.forEach(file => {
        const period = this.extractPeriodFromFilename(file.Key)
        if (period !== null) {
          result[period].push(file.Key)
        }
      })
    }

    return result
  }

  extractDateFromFilename (filename) {
    const base = p.parse(filename).base.replace('.tar.gz', '')
    const date = base.split('-')[2]
    const parsedDate = datefns.parse(date, 'yyyyMMdd_HHmmss', new Date())
    if (datefns.isValid(parsedDate)) {
      return parsedDate
    } else {
      return null
    }
  }

  extractPeriodFromFilename (filename) {
    const base = p.parse(filename).base
    const period = base.split('-')[1]
    if (validPeriods.includes(period)) {
      return period
    } else {
      return null
    }
  }
}
