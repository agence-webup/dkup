const AWS = require('aws-sdk')
const fs = require('fs')

module.exports = class Storage {
  constructor (accessKeyId, secretAccessKey, bucket) {
    this.bucket = bucket
    AWS.config.update({
      accessKeyId,
      secretAccessKey,
      bucket: this.bucket
    })

    this.s3 = new AWS.S3({ signatureVersion: 'v4' })
  }

  uploadFile (path, folder, name) {
    return new Promise((resolve, reject) => {
      this.s3.upload({
        Bucket: this.bucket,
        Key: folder + '/' + name,
        Body: fs.createReadStream(path)
      }, (err, data) => {
        if (err) reject(err)
        resolve(data)
      })
    })
  }

  listAllFilesForProject (slug) {
    return new Promise((resolve, reject) => {
      this.s3.listObjectsV2({
        Bucket: this.bucket,
        Prefix: slug
      }, (err, data) => {
        if (err) reject(err)
        resolve(data.Contents)
      })
    })
  }

  deleteFile (key) {
    return new Promise((resolve, reject) => {
      this.s3.deleteObject({
        Bucket: this.bucket,
        Key: key
      }, function (err, data) {
        if (err) reject(err)
        resolve(data)
      })
    })
  }
}
