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

const INSTANT_TO_KEEP = 5
const FILE_EXTENSION = 'tar.gz'

program
  .name('dkup')
  .description('A small utility to perform backup on docker-compose projects')
  .requiredOption('-c, --config <path>', 'config path')
  .version(packageJson.version)

program.command('now [project]')
  .description('start an immediate backup')
  .action(async (project) => {
    const config = ConfigReader.getConfig(program.opts().config)
    if (project) {
      const index = config.projects.findIndex(o => o.slug === project)
      // if project exist in config
      if (index !== -1) {
        await handleProject(config.projects[index], config)
      } else {
        program.error(`${project} doesn't exist in config file`)
      }
    } else {
      helpers.asyncForEach(config.projects, async (project) => {
        await handleProject(project, config)
      })
    }
  })

program.command('schedule')
  .description('check and execute backup based on frequencies')
  .option('--test', 'run backup without upload / delete + verbose mode')
  .action((options) => {
    const config = ConfigReader.getConfig(program.opts().config)
    const s3 = new Storage(config.awsAccessKeyId, config.awsSecretAccessKey, config.awsBucket)
    const manager = new Manager(config)
    helpers.asyncForEach(config.projects, async (project) => {
      const slug = helpers.slugify(project.slug)
      const filesList = await s3.listAllFilesForProject(slug)
      const toProcess = manager.checkForBackup(project, filesList)
      if (toProcess.length > 0) {
        await handleProject(project, config, toProcess, options.test)
      } else {
        healthcheck(project.pingUrl)
        helpers.info('No backup to perform', slug)
      }
    })
  })

program.command('list')
  .description('list all projects')
  .action(() => {
    const config = ConfigReader.getConfig(program.opts().config)
    config.projects.forEach(project => {
      console.log(project.slug)
    })
  })

program.parse()

async function healthcheck (pingUrl, error = null) {
  if (error) {
    if (new URL(pingUrl).hostname === 'hc-ping.com') {
      axios({
        method: 'post',
        url: pingUrl + '/fail',
        data: error
      })
    }
  } else {
    https.get(pingUrl)
  }
}
async function handleProject (project, config, frequencies = null, testMode = false) {
  const formatedDate = datefns.format(new Date(), 'yyyyMMdd_HHmmss')
  const slug = helpers.slugify(project.slug)
  const fileExtension = project.fileExtension || config.fileExtension || FILE_EXTENSION
  const filename = slug + '-' + formatedDate

  const s3 = new Storage(config.awsAccessKeyId, config.awsSecretAccessKey, config.awsBucket)
  const manager = new Manager()

  try {
    // manage custom command
    const command = project.command || config.command || null
    if (command === null) throw new Error('No command specified')

    if (testMode) helpers.info('### TEST MODE ###', slug)

    // run pliz backup
    const backup = new Backup(filename, command, project.path)
    helpers.info(`Run custom command -> ${backup.getCustomCommand()}`, slug)

    const backupPath = await backup.exec()

    // two cases to handle : instant or schedule backup
    if (frequencies) {
      helpers.info('Processing scheduled backup', slug)

      // upload to S3 (one backup at a time)
      await helpers.asyncForEach(frequencies, async (frequency) => {
        const s3Filename = `${slug}-${frequency}-${formatedDate}.${fileExtension}`
        helpers.info(`Upload ${s3Filename} to s3`, slug)
        if (!testMode) {
          await s3.uploadFile(backupPath, slug, s3Filename)
        }
      })

      // clean old backups
      const filesList = await s3.listAllFilesForProject(slug)
      const toDelete = manager.checkForBackupToDelete(project, filesList)

      // sync delete
      await helpers.asyncForEach(toDelete, async (key) => {
        helpers.info(`Delete ${key} from s3`, slug)
        if (!testMode) {
          await s3.deleteFile(key)
        }
      })

      // delete local backup
      helpers.info(`Delete local file ${backupPath}`, slug)
      fs.unlinkSync(backupPath)

      // ping healthcheck
      healthcheck(project.pingUrl)
    } else {
      helpers.info('Processing instant backup...', slug)

      // upload to S3
      const s3Filename = `${slug}-instant-${formatedDate}.${fileExtension}`
      helpers.info(`Upload ${s3Filename} to s3`, slug)
      await s3.uploadFile(backupPath, slug, s3Filename)

      // clean old backups
      const filesList = await s3.listAllFilesForProject(slug)
      const instantToKeep = project.instantToKeep || config.instantToKeep || INSTANT_TO_KEEP
      helpers.info(`Number of instant backups to keep: ${instantToKeep}`, slug)
      const toDelete = manager.checkInstantBackupToDelete(instantToKeep, filesList)
      await helpers.asyncForEach(toDelete, async (key) => {
        helpers.info(`Delete ${key} from s3`, slug)
        await s3.deleteFile(key)
      })
      // delete local backup
      helpers.info(`Delete local file ${backupPath}`, slug)
      fs.unlinkSync(backupPath)

      // ping healthcheck
      healthcheck(project.pingUrl)
    }
  } catch (error) {
    helpers.info(`Error: ${error.message}`, slug)
    healthcheck(project.pingUrl, error.message)
  }
}
