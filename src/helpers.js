const datefns = require('date-fns')

async function asyncForEach (array, callback) {
  for (let index = 0; index < array.length; index++) {
    await callback(array[index], index, array)
  }
}

function info (text, project = null) {
  if (project !== null) {
    console.log(`[${datefns.format(new Date(), 'HH:MM:ss')}] ${project} | ${text}`)
  } else {
    console.log(`[${datefns.format(new Date(), 'HH:MM:ss')}] ${text}`)
  }
}

module.exports = {
  asyncForEach: asyncForEach,
  info: info
}
