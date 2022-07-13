# Dkup

[![CircleCI](https://circleci.com/gh/agence-webup/dkup.svg?style=svg)](https://circleci.com/gh/agence-webup/dkup)

Dkup doesn't use any local database and automatically sync with your storage provider (S3 for now) to manage backups lifecycle.

## 1. Download executable 

You can find latest release here: https://github.com/agence-webup/dkup/releases

## 2. Create a dkup.json config (for example in /etc/dkup)

```json
{
  "awsAccessKeyId": "HERE_YOUR_AWS_ACCESS_KEY",
  "awsSecretAccessKey": "HERE_YOUR_AWS_SECRET",
  "awsBucket": "HERE_YOUR_AWS_BUCKET",
  "command": "pliz backup -q --files --db -o @FILENAME",
  "instantToKeep": 3,
  "projects": [
    {
      "slug": "project1",
      "path": "/path/to/project1",
      "pingUrl": "https://example.com/project1",
      "frequencies": ["monthly:1", "weekly:4", "daily:7", "hourly:4"],
      "instantToKeep": 2,
      "command": "custom command @FILENAME",
    },
    {
      "slug": "projet2",
      "path": "/path/to/project2",
      "pingUrl": "https://example.com/project2",
      "frequencies": ["monthly:1", "weekly:1", "daily:1", "every4hours:6"]
    }
  ]
}
```

* `slug` a string which will be used to store the file on s3
* `path` path to the docker-compose + pliz project
* `pingUrl` an URL to call when the backup is done 
* `frequency` a string which respect the following format `period:number_of_backups_to_keep`
  * `period`: hourly, every4hours, daily, weekly or monthly
  * `number_of_backup`: the number of backup files to keep for the period (1 will keep one backup file, 3 will keep three backup files, 0 for no limit)
* `instantToKeep`: number of instant backups to keep (global or per project option), default is 5
* `command`: command used to backup (global or per project option), @FILENAME is replaced with backup filenam

Note: dkup will automatically detect https://healthchecks.io as a provider and enhance log with [errors](https://healthchecks.io/docs/attaching_logs/) (more providers coming soon)

## 3. Execute dkup

```
Usage: dkup [options] [command]

A small utility to perform backup on docker-compose projects

Options:
  -c, --config <path>  config path
  -V, --version        output the version number
  -h, --help           display help for command

Commands:
  now [project]        start an immediate backup
  schedule [options]   check and execute backup based on frequencies
  list                 list all projects
  help [command]       display help for command
```

## 4. Examples

### Execute an instant backup of all projects

```
dkup --config /etc/dkup/dkup.json now
```

### Execute an instant backup for a given project

```
dkup --config /etc/dkup/dkup.json now project1
```

### Check and execute schedule backups

You need to execute dkup every hour. An example with cron:

```
@hourly dkup --config /etc/dkup/dkup.json schedule
```
 
### Test schedule backups (without upload or delete + verbose mode)

```
dkup --config /etc/dkup/dkup.json schedule --test
```

### Check version

```
dkup --version
```

## 5. Output example

```
[05:04:47] projet1 | processing...
[05:04:48] projet1 | prepare hourly
[05:04:49] projet1 | run pliz backup command
[05:04:49] projet1 | upload projet1-hourly-20200414_053148.tar.gz to s3
[05:04:49] projet1 | delete projet1/projet1-hourly-20200414_035013.tar.gz from s3
[05:04:50] projet2 | processing...
[05:04:50] projet2 | prepare hourly
[05:04:51] projet2 | run pliz backup command
[05:04:51] projet2 | upload projet2-hourly-20200414_053150.tar.gz to s3
```
