# Dkup

Dkup doesn't use any local database and automatically sync with your storage provider (S3 for now) to manage backups lifecycle.

## 1. Download executable 

You can find latest release here: https://github.com/agence-webup/dkup/releases

## 2. Create a dkup.json config (for example in /etc/dkup)

```json
{
  "awsAccessKeyId": "HERE_YOUR_AWS_ACCESS_KEY",
  "awsSecretAccessKey": "HERE_YOUR_AWS_SECRET",
  "awsBucket": "HERE_YOUR_AWS_BUCKET",
  "projects": [
    {
      "slug": "project1",
      "path": "/path/to/project1",
      "pingUrl": "https://example.com/project1",
      "frequencies": ["monthly:1", "weekly:4", "daily:7", "hourly:4"]
    },
    {
      "slug": "projet2",
      "path": "/path/to/project2",
      "pingUrl": "https://example.com/project2",
      "frequencies": ["monthly:1", "weekly:1", "daily:1", "hourly:2"]
    }
  ]
}
```

* `slug` a string which will be used to store the file on s3
* `path` path to the docker-compose + pliz project
* `pingUrl` an URL to call when the backup is done 
* `frequency` a string which respect the following format `period:number_of_backups_to_keep`
  * `period`: hourly, daily, weekly or monthly
  * `number_of_backup`: a positive number

Note: dkup will automatically detect https://healthchecks.io as a provider and enhance log with [errors](https://healthchecks.io/docs/attaching_logs/) (more providers coming soon)

## 3. Execute dkup

You need to execute dkup every hour. An example with cron:

```
@hourly dkup /etc/dkup/dkup.json
```
