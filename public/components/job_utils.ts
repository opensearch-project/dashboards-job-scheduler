/*
 * SPDX-License-Identifier: Apache-2.0
 *
 * The OpenSearch Contributors require contributions made to
 * this file be licensed under the Apache-2.0 license or a
 * compatible open source license.
 */

export interface JobSchedule {
  type?: string;
  expression?: string;
  timezone?: string;
  interval?: number | string;
  unit?: string;
}

export interface Job {
  job_id: string;
  name?: string;
  job_type?: string;
  index_name?: string;
  enabled?: boolean;
  descheduled?: boolean;
  lock_duration?: string;
  last_execution_time?: string;
  next_expected_execution_time?: string;
  schedule?: JobSchedule;
}

export interface JobLock {
  released?: boolean;
}

export type JobLocks = Record<string, JobLock>;

export interface JobHistoryRecord {
  job_id?: string;
  job_index_name?: string;
  start_time: number;
  end_time: number;
  completion_status?: number;
}

export interface JobHistoryEntry extends JobHistoryRecord {
  key: string;
  duration: number;
  status: string;
}

export const getJobLockKey = (job: Job) => `${job.index_name}-${job.job_id}`;

export const isJobRunning = (job: Job, locks?: JobLocks) => {
  const lockKey = getJobLockKey(job);
  return Boolean(job.enabled && locks?.[lockKey] && !locks[lockKey].released);
};

export const getLifecycleLabel = (job: Job) =>
  job.descheduled ? 'descheduled' : job.enabled ? 'active' : 'inactive';

export const getSearchableJobFields = (job: Job) =>
  [
    job.job_id,
    job.name,
    job.job_type,
    job.last_execution_time,
    job.next_expected_execution_time,
    job.schedule?.expression,
    job.schedule?.timezone,
    job.enabled ? 'enabled' : 'disabled',
    getLifecycleLabel(job),
  ]
    .filter((value): value is string | number | boolean => value !== undefined && value !== null)
    .map(String);

export const filterJobs = (jobs: Job[], jobTypeFilter: string, searchQuery: string) => {
  const jobsByType =
    jobTypeFilter === 'all' ? jobs : jobs.filter((job) => job.job_type === jobTypeFilter);
  if (!searchQuery) return jobsByType;

  const query = searchQuery.toLowerCase();
  return jobsByType.filter((job) =>
    getSearchableJobFields(job).some((value) => value.toLowerCase().includes(query))
  );
};

export const getActiveJobs = (jobs: Job[], locks?: JobLocks) =>
  jobs.filter((job) => isJobRunning(job, locks));

export const getJobsWithLockDuration = (jobs: Job[]) =>
  jobs.filter((job) => job.enabled && job.lock_duration && job.lock_duration !== 'no_lock');

export const mapHistoryEntries = (history?: Record<string, JobHistoryRecord>) =>
  Object.entries(history || {}).map(([key, value]) => ({
    key,
    ...value,
    duration: value.end_time - value.start_time,
    status: value.completion_status === 0 ? 'Success' : 'Failed',
  }));

export const filterHistoryByJobId = (history: JobHistoryEntry[], jobId: string | null) =>
  jobId ? history.filter((entry) => entry.job_id === jobId) : history;

export const filterHistoryBySearchQuery = (history: JobHistoryEntry[], searchQuery: string) =>
  searchQuery
    ? history.filter((entry) => entry.job_id?.toLowerCase().includes(searchQuery.toLowerCase()))
    : history;

export const sortHistoryByStartTimeDesc = (history: JobHistoryEntry[]) =>
  [...history].sort((a, b) => b.start_time - a.start_time);
