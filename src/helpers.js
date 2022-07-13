const datefns = require('date-fns')
const slug = require('slugify')

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

function slugify (string) {
  return slug(string, {
    replacement: '_',
    remove: /[*+~.()'"!:@-]/g,
    lower: true,
    strict: true
  })
}

module.exports = {
  asyncForEach,
  slugify,
  info
}
