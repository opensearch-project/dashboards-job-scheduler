/*
 * SPDX-License-Identifier: Apache-2.0
 *
 * The OpenSearch Contributors require contributions made to
 * this file be licensed under the Apache-2.0 license or a
 * compatible open source license.
 */

import {
  filterHistoryByJobId,
  filterHistoryBySearchQuery,
  filterJobs,
  getActiveJobs,
  getJobLockKey,
  getJobsWithLockDuration,
  getLifecycleLabel,
  getSearchableJobFields,
  isJobRunning,
  mapHistoryEntries,
  sortHistoryByStartTimeDesc,
  Job,
  JobLocks,
} from '../job_utils';

const jobs: Job[] = [
  {
    job_id: 'report-1',
    name: 'Weekly report',
    job_type: 'reports-scheduler',
    index_name: '.opensearch-reports-definitions',
    enabled: true,
    schedule: {
      type: 'cron',
      expression: '0 9 * * 1',
      timezone: 'UTC',
    },
  },
  {
    job_id: 'rollup-1',
    name: 'Rollup job',
    job_type: 'rollup',
    index_name: '.opendistro-ism-config',
    enabled: false,
    descheduled: true,
    lock_duration: 'no_lock',
  },
  {
    job_id: 'monitor-1',
    name: 'Monitor job',
    job_type: 'alerting',
    index_name: '.opensearch-alerting-config',
    enabled: true,
    lock_duration: '15m',
  },
];

describe('job utils', () => {
  it('builds the Job Scheduler lock key from index name and job ID', () => {
    expect(getJobLockKey(jobs[0])).toBe('.opensearch-reports-definitions-report-1');
  });

  it('marks enabled jobs with unreleased locks as running', () => {
    const locks: JobLocks = {
      '.opensearch-reports-definitions-report-1': { released: false },
      '.opensearch-alerting-config-monitor-1': { released: true },
    };

    expect(isJobRunning(jobs[0], locks)).toBe(true);
    expect(isJobRunning(jobs[2], locks)).toBe(false);
    expect(isJobRunning(jobs[1], locks)).toBe(false);
  });

  it('derives lifecycle labels from descheduled and enabled flags', () => {
    expect(getLifecycleLabel(jobs[0])).toBe('active');
    expect(getLifecycleLabel(jobs[1])).toBe('descheduled');
    expect(getLifecycleLabel({ job_id: 'disabled', enabled: false })).toBe('inactive');
  });

  it('collects searchable job fields', () => {
    expect(getSearchableJobFields(jobs[0])).toEqual(
      expect.arrayContaining([
        'report-1',
        'Weekly report',
        'reports-scheduler',
        '0 9 * * 1',
        'UTC',
        'enabled',
        'active',
      ])
    );
  });

  it('filters jobs by type and search query', () => {
    expect(filterJobs(jobs, 'reports-scheduler', '')).toEqual([jobs[0]]);
    expect(filterJobs(jobs, 'all', 'weekly')).toEqual([jobs[0]]);
    expect(filterJobs(jobs, 'rollup', 'descheduled')).toEqual([jobs[1]]);
  });

  it('filters active jobs using lock state', () => {
    expect(
      getActiveJobs(jobs, {
        '.opensearch-reports-definitions-report-1': { released: false },
      })
    ).toEqual([jobs[0]]);
  });

  it('falls back to lock duration when lock API results are unavailable', () => {
    expect(getJobsWithLockDuration(jobs)).toEqual([jobs[2]]);
  });
});

describe('history utils', () => {
  const mappedHistory = mapHistoryEntries({
    'reports-report-1': {
      job_id: 'report-1',
      job_index_name: '.opensearch-reports-definitions',
      start_time: 100,
      end_time: 130,
      completion_status: 0,
    },
    'alerts-monitor-1': {
      job_id: 'monitor-1',
      job_index_name: '.opensearch-alerting-config',
      start_time: 200,
      end_time: 215,
      completion_status: 1,
    },
  });

  it('maps history records to table entries', () => {
    expect(mappedHistory).toEqual([
      {
        key: 'reports-report-1',
        job_id: 'report-1',
        job_index_name: '.opensearch-reports-definitions',
        start_time: 100,
        end_time: 130,
        completion_status: 0,
        duration: 30,
        status: 'Success',
      },
      {
        key: 'alerts-monitor-1',
        job_id: 'monitor-1',
        job_index_name: '.opensearch-alerting-config',
        start_time: 200,
        end_time: 215,
        completion_status: 1,
        duration: 15,
        status: 'Failed',
      },
    ]);
  });

  it('filters history by selected job ID', () => {
    expect(filterHistoryByJobId(mappedHistory, 'report-1')).toEqual([mappedHistory[0]]);
    expect(filterHistoryByJobId(mappedHistory, null)).toEqual(mappedHistory);
  });

  it('filters history by search query', () => {
    expect(filterHistoryBySearchQuery(mappedHistory, 'monitor')).toEqual([mappedHistory[1]]);
    expect(filterHistoryBySearchQuery(mappedHistory, '')).toEqual(mappedHistory);
  });

  it('sorts newest history entries first without mutating input', () => {
    const sortedHistory = sortHistoryByStartTimeDesc(mappedHistory);

    expect(sortedHistory).toEqual([mappedHistory[1], mappedHistory[0]]);
    expect(mappedHistory).toEqual([mappedHistory[0], mappedHistory[1]]);
  });
});
