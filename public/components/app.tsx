/*
 * SPDX-License-Identifier: Apache-2.0
 *
 * The OpenSearch Contributors require contributions made to
 * this file be licensed under the Apache-2.0 license or a
 * compatible open source license.
 */

import React, { useCallback, useState, useEffect } from 'react';
import { i18n } from '@osd/i18n';
import { FormattedDate, I18nProvider } from '@osd/i18n/react';

import {
  EuiButton,
  EuiPage,
  EuiPageBody,
  EuiPageContent,
  EuiPageContentBody,
  EuiPageHeader,
  EuiTitle,
  EuiText,
  EuiBasicTable,
  EuiSelect,
  EuiFlexGroup,
  EuiFlexItem,
  EuiFieldSearch,
  EuiTabs,
  EuiTab,
  EuiPopover,
  EuiContextMenu,
  EuiIcon,
} from '@elastic/eui';

import { CoreStart } from '../../../../src/core/public';
import { NavigationPublicPluginStart } from '../../../../src/plugins/navigation/public';

import { PLUGIN_ID } from '../../common';
import {
  filterHistoryByJobId,
  filterHistoryBySearchQuery,
  filterJobs,
  getActiveJobs,
  getJobsWithLockDuration,
  isJobRunning,
  mapHistoryEntries,
  sortHistoryByStartTimeDesc,
  Job,
  JobHistoryEntry,
  JobHistoryRecord,
  JobLocks,
  JobSchedule,
} from './job_utils';

interface DashboardsJobSchedulerAppDeps {
  basename: string;
  notifications: CoreStart['notifications'];
  http: CoreStart['http'];
  navigation: NavigationPublicPluginStart;
}

const API_PATHS = {
  jobs: '/api/dashboards_job_scheduler/jobs',
  locks: '/api/dashboards_job_scheduler/locks',
  history: '/api/dashboards_job_scheduler/history',
};

const EMPTY_DATE_LABEL = i18n.translate('dashboardsJobScheduler.emptyDateLabel', {
  defaultMessage: 'None',
});

const INVALID_DATE_LABEL = i18n.translate('dashboardsJobScheduler.invalidDateLabel', {
  defaultMessage: 'Invalid date',
});

const formatDateTime = (dateString?: string) => {
  if (!dateString || dateString.toLowerCase() === 'none') return EMPTY_DATE_LABEL;
  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) return INVALID_DATE_LABEL;
  return (
    <FormattedDate
      value={date}
      month="2-digit"
      day="2-digit"
      year="2-digit"
      hour="2-digit"
      minute="2-digit"
    />
  );
};

const ScheduleHeader = () => {
  const [isPopoverOpen, setIsPopoverOpen] = useState(false);
  return (
    <span>
      Schedule{' '}
      <EuiPopover
        button={
          <EuiIcon
            type="questionInCircle"
            size="m"
            style={{ cursor: 'pointer' }}
            onClick={() => setIsPopoverOpen(!isPopoverOpen)}
          />
        }
        isOpen={isPopoverOpen}
        closePopover={() => setIsPopoverOpen(false)}
      >
        <div style={{ padding: '8px', maxWidth: '400px' }}>
          <strong>Cron Schedule Format:</strong>
          <br />
          * * * * * (minute hour day month weekday)
          <br />
          Examples:
          <br />
          • 0 9 * * * = Daily at 9:00 AM
          <br />
          • 0 */2 * * * = Every 2 hours
          <br />• 0 9 * * 1 = Every Monday at 9:00 AM
        </div>
      </EuiPopover>
    </span>
  );
};

const ActionButton = ({ onViewHistory }: { onViewHistory: () => void }) => {
  const [isPopoverOpen, setIsPopoverOpen] = useState(false);
  return (
    <EuiPopover
      button={
        <EuiButton
          size="s"
          iconType="boxesHorizontal"
          fill={false}
          onClick={() => setIsPopoverOpen(!isPopoverOpen)}
        />
      }
      isOpen={isPopoverOpen}
      closePopover={() => setIsPopoverOpen(false)}
      panelPaddingSize="none"
    >
      <EuiContextMenu
        initialPanelId={0}
        panels={[
          {
            id: 0,
            items: [
              {
                name: 'View History',
                icon: 'clock',
                onClick: () => {
                  setIsPopoverOpen(false);
                  onViewHistory();
                },
              },
            ],
          },
        ]}
      />
    </EuiPopover>
  );
};

interface JobsTableProps {
  jobs?: Job[];
  locks?: JobLocks;
  pageIndex: number;
  pageSize: number;
  onPageChange: ({ page }: { page?: { index: number; size: number } }) => void;
  jobTypeFilter: string;
  onJobTypeFilterChange: (filter: string) => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  onRefresh: () => void;
}

const JobsTable = ({
  jobs = [],
  locks,
  pageIndex,
  pageSize,
  onPageChange,
  jobTypeFilter,
  onJobTypeFilterChange,
  searchQuery,
  onSearchChange,
  onRefresh,
}: JobsTableProps) => {
  const filteredJobs = filterJobs(jobs, jobTypeFilter, searchQuery);
  const startIndex = pageIndex * pageSize;
  const endIndex = startIndex + pageSize;
  const pageItems = filteredJobs.slice(startIndex, endIndex);

  const jobTypes = ['all', ...Array.from(new Set(jobs.map((job) => job.job_type).filter(Boolean)))];
  const jobTypeOptions = jobTypes.map((type) => ({
    value: String(type),
    text: type === 'all' ? 'All Types' : String(type),
  }));

  return (
    <>
      <EuiFlexGroup gutterSize="m">
        <EuiFlexItem>
          <EuiFieldSearch
            placeholder="Search"
            value={searchQuery}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => onSearchChange(e.target.value)}
          />
        </EuiFlexItem>
        <EuiFlexItem grow={false}>
          <EuiSelect
            options={jobTypeOptions}
            value={jobTypeFilter}
            onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
              onJobTypeFilterChange(e.target.value)
            }
          />
        </EuiFlexItem>
        <EuiFlexItem grow={false}>
          <EuiButton onClick={onRefresh} iconType="refresh">
            Refresh
          </EuiButton>
        </EuiFlexItem>
      </EuiFlexGroup>
      <EuiBasicTable
        items={pageItems}
        columns={[
          {
            field: 'job_id',
            name: 'Job ID',
            render: (jobId: string, job: Job) => {
              if (job.job_type === 'reports-scheduler') {
                const basePath = window.location.pathname.split('/app/')[0];
                return (
                  <a
                    href={`${window.location.origin}${basePath}/app/reports-dashboards#/report_definition_details/${jobId}`}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    {jobId}
                  </a>
                );
              }
              return jobId;
            },
          },
          { field: 'name', name: 'Name' },
          { field: 'job_type', name: 'Type' },
          {
            field: 'enabled',
            name: 'Status',
            render: (enabled: boolean, job: Job) => {
              if (!enabled) {
                return (
                  <span>
                    <span className="dashboardsJobSchedulerStatusDot dashboardsJobSchedulerStatusDot--disabled">
                      ●
                    </span>
                    Disabled
                  </span>
                );
              }
              if (isJobRunning(job, locks)) {
                return (
                  <span>
                    <span className="dashboardsJobSchedulerStatusDot dashboardsJobSchedulerStatusDot--running">
                      ●
                    </span>
                    Running
                  </span>
                );
              }
              return (
                <span>
                  <span className="dashboardsJobSchedulerStatusDot dashboardsJobSchedulerStatusDot--idle">
                    ●
                  </span>
                  Not Running
                </span>
              );
            },
          },
          { field: 'enabled', name: 'Enabled' },
          {
            field: 'last_execution_time',
            name: 'Last Execution',
            render: (time: string) => formatDateTime(time),
          },
          {
            field: 'next_expected_execution_time',
            name: 'Next Execution',
            render: (time: string) => formatDateTime(time),
          },
          {
            field: 'schedule',
            name: <ScheduleHeader />,
            render: (schedule: JobSchedule) => {
              if (schedule?.type === 'cron') {
                return `Cron: ${schedule.expression} (${schedule.timezone})`;
              } else if (schedule?.type === 'interval') {
                return `Interval: ${schedule.interval} ${schedule.unit}`;
              }
              return 'N/A';
            },
          },
          {
            name: 'Actions',
            render: (item: Job) => (
              <ActionButton
                onViewHistory={() => window.open(`#/history/${item.job_id}`, '_blank')}
              />
            ),
          },
        ]}
        pagination={{
          pageIndex,
          pageSize,
          totalItemCount: filteredJobs.length,
          pageSizeOptions: [5, 10, 20, 50],
        }}
        onChange={onPageChange}
      />
    </>
  );
};

interface PanelDeps {
  http: CoreStart['http'];
  notifications: CoreStart['notifications'];
}

const AllJobsPanel = ({ http, notifications }: PanelDeps) => {
  const [jobs, setJobs] = useState<Job[]>();
  const [locks, setLocks] = useState<JobLocks>();
  const [pageIndex, setPageIndex] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [jobTypeFilter, setJobTypeFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  const loadJobs = useCallback(
    async (successMessage: string) => {
      try {
        const jobsRes = await http.get<{ jobs?: Job[] }>(API_PATHS.jobs);
        setJobs(jobsRes.jobs || []);
        notifications.toasts.addSuccess(successMessage);

        try {
          const locksRes = await http.get<{ locks?: JobLocks }>(API_PATHS.locks);
          setLocks(locksRes.locks || {});
        } catch {
          setLocks({});
        }
      } catch (error) {
        notifications.toasts.addError(error as Error, { title: 'Failed to fetch jobs' });
      }
    },
    [http, notifications.toasts]
  );

  useEffect(() => {
    loadJobs('All jobs loaded');
  }, [loadJobs]);

  return (
    <>
      <EuiPageContent>
        <EuiPageContentBody>
          <JobsTable
            jobs={jobs}
            locks={locks}
            pageIndex={pageIndex}
            pageSize={pageSize}
            jobTypeFilter={jobTypeFilter}
            searchQuery={searchQuery}
            onJobTypeFilterChange={(filter: string) => {
              setJobTypeFilter(filter);
              setPageIndex(0);
            }}
            onSearchChange={(query: string) => {
              setSearchQuery(query);
              setPageIndex(0);
            }}
            onPageChange={({ page }: { page?: { index: number; size: number } }) => {
              if (page) {
                setPageIndex(page.index);
                setPageSize(page.size);
              }
            }}
            onRefresh={() => loadJobs('Jobs refreshed')}
          />
        </EuiPageContentBody>
      </EuiPageContent>
    </>
  );
};

const ActiveJobsPanel = ({ http, notifications }: PanelDeps) => {
  const [jobs, setJobs] = useState<Job[]>();
  const [locks, setLocks] = useState<JobLocks>();
  const [pageIndex, setPageIndex] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [jobTypeFilter, setJobTypeFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  const loadActiveJobs = useCallback(
    async (successMessage: string) => {
      try {
        const jobsRes = await http.get<{ jobs?: Job[] }>(API_PATHS.jobs);
        const allJobs = jobsRes.jobs || [];
        try {
          const locksRes = await http.get<{ locks?: JobLocks }>(API_PATHS.locks);
          const activeLocks = locksRes.locks || {};
          setJobs(getActiveJobs(allJobs, activeLocks));
          setLocks(activeLocks);
        } catch {
          setJobs(getJobsWithLockDuration(allJobs));
          setLocks({});
        }
        notifications.toasts.addSuccess(successMessage);
      } catch (error) {
        notifications.toasts.addError(error as Error, { title: 'Failed to fetch active jobs' });
      }
    },
    [http, notifications.toasts]
  );

  useEffect(() => {
    loadActiveJobs('Active jobs loaded');
  }, [loadActiveJobs]);

  return (
    <>
      <EuiPageContent>
        <EuiPageContentBody>
          <JobsTable
            jobs={jobs}
            locks={locks}
            pageIndex={pageIndex}
            pageSize={pageSize}
            jobTypeFilter={jobTypeFilter}
            searchQuery={searchQuery}
            onJobTypeFilterChange={(filter: string) => {
              setJobTypeFilter(filter);
              setPageIndex(0);
            }}
            onSearchChange={(query: string) => {
              setSearchQuery(query);
              setPageIndex(0);
            }}
            onPageChange={({ page }: { page?: { index: number; size: number } }) => {
              if (page) {
                setPageIndex(page.index);
                setPageSize(page.size);
              }
            }}
            onRefresh={() => loadActiveJobs('Active jobs refreshed')}
          />
        </EuiPageContentBody>
      </EuiPageContent>
    </>
  );
};

const HistoryPanel = ({ http, notifications, jobId }: PanelDeps & { jobId: string | null }) => {
  const [history, setHistory] = useState<JobHistoryEntry[]>([]);
  const [pageIndex, setPageIndex] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const loadHistory = async () => {
      try {
        const res = await http.get<{
          history?: Record<string, JobHistoryRecord>;
        }>(API_PATHS.history);
        const filteredHistory = filterHistoryByJobId(mapHistoryEntries(res.history), jobId);
        setHistory(sortHistoryByStartTimeDesc(filteredHistory));
        notifications.toasts.addSuccess('Job history loaded');
      } catch (error) {
        notifications.toasts.addError(error as Error, { title: 'Failed to fetch job history' });
      }
    };

    loadHistory();
  }, [http, jobId, notifications.toasts]);

  const filteredHistory = filterHistoryBySearchQuery(history, searchQuery);
  const startIndex = pageIndex * pageSize;
  const endIndex = startIndex + pageSize;
  const pageItems = filteredHistory.slice(startIndex, endIndex);

  return (
    <EuiPageContent>
      <EuiPageContentBody>
        <EuiFlexGroup gutterSize="m">
          <EuiFlexItem>
            <EuiFieldSearch
              placeholder="Search by Job ID"
              value={searchQuery}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                setSearchQuery(e.target.value);
                setPageIndex(0);
              }}
            />
          </EuiFlexItem>
        </EuiFlexGroup>
        <EuiBasicTable
          items={pageItems}
          columns={[
            { field: 'job_id', name: 'Job ID' },
            { field: 'job_index_name', name: 'Index' },
            {
              field: 'start_time',
              name: 'Start Time',
              render: (time: number) => formatDateTime(new Date(time * 1000).toISOString()),
            },
            {
              field: 'end_time',
              name: 'End Time',
              render: (time: number) => formatDateTime(new Date(time * 1000).toISOString()),
            },
            { field: 'status', name: 'Status' },
            { field: 'duration', name: 'Duration (s)' },
          ]}
          pagination={{
            pageIndex,
            pageSize,
            totalItemCount: filteredHistory.length,
            pageSizeOptions: [5, 10, 20, 50],
          }}
          onChange={({ page }: { page?: { index: number; size: number } }) => {
            if (page) {
              setPageIndex(page.index);
              setPageSize(page.size);
            }
          }}
        />
      </EuiPageContentBody>
    </EuiPageContent>
  );
};

const JobSchedulerDashboard = ({ http, notifications }: PanelDeps) => {
  const [selectedTab, setSelectedTab] = useState('all');
  const [selectedJobId, setSelectedJobId] = useState<string | null>(null);

  const tabs = [
    { id: 'all', name: 'All Jobs' },
    { id: 'active', name: 'Active Jobs' },
    { id: 'history', name: 'History' },
  ];

  // Check URL hash for history view
  useEffect(() => {
    const hash = window.location.hash;
    if (hash.startsWith('#/history/')) {
      const jobId = hash.replace('#/history/', '');
      setSelectedJobId(jobId);
      setSelectedTab('history');
    }
  }, []);

  return (
    <>
      <EuiPageHeader>
        <div>
          <EuiTitle size="l">
            <h1>Job Scheduler</h1>
          </EuiTitle>
          <EuiText color="subdued">View all jobs on this cluster.</EuiText>
        </div>
      </EuiPageHeader>
      <EuiTabs>
        {tabs.map((tab) => (
          <EuiTab
            key={tab.id}
            isSelected={selectedTab === tab.id}
            onClick={() => {
              setSelectedTab(tab.id);
              if (tab.id !== 'history') setSelectedJobId(null);
            }}
          >
            {tab.name}
          </EuiTab>
        ))}
      </EuiTabs>
      {selectedTab === 'all' && <AllJobsPanel http={http} notifications={notifications} />}
      {selectedTab === 'active' && <ActiveJobsPanel http={http} notifications={notifications} />}
      {selectedTab === 'history' && (
        <HistoryPanel http={http} notifications={notifications} jobId={selectedJobId} />
      )}
    </>
  );
};

export const DashboardsJobSchedulerApp = ({
  basename,
  notifications,
  http,
  navigation,
}: DashboardsJobSchedulerAppDeps) => {
  return (
    <I18nProvider>
      <>
        <navigation.ui.TopNavMenu
          appName={PLUGIN_ID}
          showSearchBar={false}
          useDefaultBehaviors={true}
        />
        <EuiPage restrictWidth="2000px">
          <EuiPageBody component="main">
            <JobSchedulerDashboard http={http} notifications={notifications} />
          </EuiPageBody>
        </EuiPage>
      </>
    </I18nProvider>
  );
};
