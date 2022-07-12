#!/usr/bin/env node
const fs = require('fs')
const packageJson = require('./package.json')
const datefns = require('date-fns')
const https = require('https')
const axios = require('axios')
const { program } = require('commander')

const Backup = require('./src/Backup')
const Storage = require('./src/Storage')
const Manager = require('./src/Manager')
const ConfigReader = require('./src/ConfigReader')
const helpers = require('./src/helpers')
const argv = require('minimist')(process.argv.slice(2))

const INSTANT_TO_KEEP = 5

program
  .name('dkup')
  .description('A small utility to perform backup on docker-compose projects')
  .requiredOption('-c, --config <path>', 'config path')
  .version(packageJson.version)

program.command('now [project]')
  .description('start an immediate backup')
  .action((project) => {
    const config = ConfigReader.getConfig(program.opts().config)
    const manager = new Manager()

    helpers.asyncForEach(config.projects, async (project) => {
      await handleProject(project, config)
    })

    // const limit = options.first ? 1 : undefined
    // console.log(str.split(options.separator, limit))
  })

program.command('schedule [project]')
  .description('check and execute backup based on frequencies')
  .action((project) => {
    // program.opts().config

    // const limit = options.first ? 1 : undefined
    // console.log(str.split(options.separator, limit))
  })

program.command('list')
  .description('list all projects in config file')
  .action(() => {
    const config = ConfigReader.getConfig(program.opts().config)
    config.projects.forEach(project => {
      console.log(project.slug)
    })
  })

program.parse()

async function handleProject (project, config) {
  const formatedDate = datefns.format(new Date(), 'yyyyMMdd_HHmmss')
  const slug = helpers.slugify(project.slug)
  const filename = slug + '-' + formatedDate
  const s3Filename = `${slug}-instant-${formatedDate}.tar.gz`
  const s3 = new Storage(config.awsAccessKeyId, config.awsSecretAccessKey, config.awsBucket)
  helpers.info('processing instant backup...', slug)
  try {
    // run pliz backup
    helpers.info('run pliz backup command', slug)
    const backup = await Backup.exec(project.path, filename)
    // upload to S3
    helpers.info(`upload ${s3Filename} to s3`, slug)
    await s3.uploadFile(backup, slug, s3Filename)
    // clean old backups
    const manager = new Manager()
    const filesList = await s3.listAllFilesForProject(slug)
    const instantToKeep = project.instantToKeep || config.instantToKeep || INSTANT_TO_KEEP
    helpers.info(`number of instant backups to keep: ${instantToKeep}`, slug)
    const toDelete = manager.checkInstantBackupToDelete(instantToKeep, filesList)
    await helpers.asyncForEach(toDelete, async (key) => {
      helpers.info(`delete ${key} from s3`, slug)
      await s3.deleteFile(key)
    })
    // delete local backup
    helpers.info(`delete local file ${backup}`, slug)
    fs.unlinkSync(backup)
  } catch (error) {
    console.log(error)
  }
}

// get config path
// try {
//   const rawdata = fs.readFileSync(argv._[0])

//   const config = JSON.parse(rawdata)
//   const manager = new Manager(config)

// ;(async function () {
//   // iterate over all projects to backup
//     helpers.asyncForEach(config.projects, async (project) => {
//       const slug = slugify(project.slug, {
//         replacement: '_',
//         remove: /[*+~.()'"!:@-]/g,
//         lower: true,
//         strict: true
//       })

//       helpers.info('processing...', slug)

//       // get all backups from S3
//       const s3 = new Storage(config.awsAccessKeyId, config.awsSecretAccessKey, config.awsBucket)
//       let filesList = await s3.listAllFilesForProject(slug)

//       // check for backup
//       const toProcess = manager.checkForBackup(project, filesList)

//       if (toProcess.length > 0) {
//         helpers.info(`prepare ${toProcess}`, slug)

//         const formatedDate = datefns.format(new Date(), 'yyyyMMdd_HHmmss')
//         const filename = slug + '-' + formatedDate

//         // backup, upload to S3 and clean old backups
//         try {
//           const backup = await Backup.exec(project.path, filename)
//           helpers.info('run pliz backup command', slug)

//           // sync upload to spare network
//           await helpers.asyncForEach(toProcess, async (frequency) => {
//             const s3Filename = `${slug}-${frequency}-${formatedDate}.tar.gz`
//             helpers.info(`upload ${s3Filename} to s3`, slug)
//             await s3.uploadFile(backup, slug, s3Filename)
//           })

//           // clean old backups
//           filesList = await s3.listAllFilesForProject(slug)
//           const toDelete = manager.checkForBackupToDelete(project, filesList)

//           // sync delete
//           await helpers.asyncForEach(toDelete, async (key) => {
//             helpers.info(`delete ${key} from s3`, slug)
//             await s3.deleteFile(key)
//           })

//           // delete local backup
//           helpers.info(`delete local file ${backup}`, slug)
//           fs.unlinkSync(backup)

//           // ping URL
//           https.get(project.pingUrl)
//         } catch (error) {
//           console.error(error)

//           // specific to provider(s)
//           // healthchecks.io
//           if (new URL(project.pingUrl).hostname === 'hc-ping.com') {
//             axios({
//               method: 'post',
//               url: project.pingUrl + '/fail',
//               data: error.message
//             })
//           }
//         }
//       } else {
//         https.get(project.pingUrl)
//         helpers.info('no backup to perform', slug)
//       }
//     })
//   })()
// } catch (err) {
//   console.error('Unable to open config file')
//   process.exit(1)
// }
