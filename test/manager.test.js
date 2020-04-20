const Manager = require('../src/Manager')
const datefns = require('date-fns')

test('Date extraction from filename', () => {
  const manager = new Manager()
  expect(datefns.isEqual(manager.extractDateFromFilename('my_project-daily-20200415_181502.tar.gz'), datefns.parse('20200415_181502', 'yyyyMMdd_HHmmss', new Date()))).toBe(true)
  expect(datefns.isEqual(manager.extractDateFromFilename('my_project-daily-20200415_181502'), datefns.parse('20200415_181502', 'yyyyMMdd_HHmmss', new Date()))).toBe(true)
  expect(manager.extractDateFromFilename('my-project-daily-20200415_181502.tar.gz')).toBe(null)
  expect(manager.extractDateFromFilename('badfilename')).toBe(null)
})

test('Period extraction from filename', () => {
  const manager = new Manager()
  expect(manager.extractPeriodFromFilename('my_project-hourly-20200415_181502.tar.gz')).toBe('hourly')
  expect(manager.extractPeriodFromFilename('my_project-daily-20200415_181502.tar.gz')).toBe('daily')
  expect(manager.extractPeriodFromFilename('my_project-weekly-20200415_181502.tar.gz')).toBe('weekly')
  expect(manager.extractPeriodFromFilename('my_project-monthly-20200415_181502.tar.gz')).toBe('monthly')
  expect(manager.extractPeriodFromFilename('my_project-every4hours-20200415_181502.tar.gz')).toBe('every4hours')
  expect(manager.extractPeriodFromFilename('my_project-badperiod-20200415_181502.tar.gz')).toBe(null)
  expect(manager.extractPeriodFromFilename('my-project-badperiod-20200415_181502.tar.gz')).toBe(null)
  expect(manager.extractPeriodFromFilename('badfilename')).toBe(null)
})

test('Extract last backup date from a list of files', () => {
  const manager = new Manager()

  const lastBackup1 = manager.extractLastBackup({
    hourly: [
      'my_project-hourly-20200420_180000.tar.gz',
      'my_project-hourly-20200420_190000.tar.gz',
      'my_project-hourly-20200420_200000.tar.gz'
    ]
  }, 'hourly')

  expect(datefns.isEqual(lastBackup1, datefns.parse('20200420_200000', 'yyyyMMdd_HHmmss', new Date())))

  expect(manager.extractLastBackup({ hourly: [] }, 'hourly')).toBe(null)
  expect(manager.extractLastBackup({}, 'hourly')).toBe(null)
})
