# dkup

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
* `pingUrl` an URL to call when the backyp is done 
* `frequency` a string which respect the following format `period:number_of_backups_to_keep`
  * `period`: hourly, daily, weekly or monthly
  * `number_of_backup`: a positive number

## 3. Execute dkup

```
dkup /etc/dkup/dkup.json
```
