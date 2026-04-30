/*
 *   Copyright OpenSearch Contributors
 *
 *   Licensed under the Apache License, Version 2.0 (the "License").
 *   You may not use this file except in compliance with the License.
 *   A copy of the License is located at
 *
 *       http://www.apache.org/licenses/LICENSE-2.0
 *
 *   or in the "license" file accompanying this file. This file is distributed
 *   on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either
 *   express or implied. See the License for the specific language governing
 *   permissions and limitations under the License.
 */

import React, { useState, useEffect } from 'react';
import { FormattedMessage, I18nProvider } from '@osd/i18n/react';

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

interface DashboardsJobSchedulerAppDeps {
  basename: string;
  notifications: CoreStart['notifications'];
  http: CoreStart['http'];
  navigation: NavigationPublicPluginStart;
}



const formatDateTime = (dateString: string) => {
  if (!dateString || dateString.toLowerCase() === 'none') return 'None';
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return 'Invalid Date';
  return date.toLocaleString('en-US', {
    month: '2-digit',
    day: '2-digit',
    year: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true
  });
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
          <strong>Cron Schedule Format:</strong><br/>
          * * * * * (minute hour day month weekday)<br/>
          Examples:<br/>
          • 0 9 * * * = Daily at 9:00 AM<br/>
          • 0 */2 * * * = Every 2 hours<br/>
          • 0 9 * * 1 = Every Monday at 9:00 AM
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
      <EuiContextMenu initialPanelId={0} panels={[
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
      ]} />
    </EuiPopover>
  );
};

const JobsTable = ({ jobs, locks, pageIndex, pageSize, onPageChange, jobTypeFilter, onJobTypeFilterChange, searchQuery, onSearchChange, onRefresh }: any) => {
  let filteredJobs = jobTypeFilter === 'all' ? jobs : jobs?.filter((job: any) => job.job_type === jobTypeFilter) || [];
  if (searchQuery) {
    filteredJobs = filteredJobs?.filter((job: any) => {
      const query = searchQuery.toLowerCase();
      return job.job_id?.toLowerCase().includes(query) ||
             job.name?.toLowerCase().includes(query) ||
             job.job_type?.toLowerCase().includes(query) ||
             job.last_execution_time?.toLowerCase().includes(query) ||
             job.next_expected_execution_time?.toLowerCase().includes(query) ||
             (job.schedule?.expression && job.schedule.expression.toLowerCase().includes(query)) ||
             (job.schedule?.timezone && job.schedule.timezone.toLowerCase().includes(query)) ||
             (job.enabled ? 'enabled' : 'disabled').includes(query) ||
             (job.descheduled ? 'descheduled' : job.enabled ? 'active' : 'inactive').includes(query);
    }) || [];
  }
  const startIndex = pageIndex * pageSize;
  const endIndex = startIndex + pageSize;
  const pageItems = filteredJobs?.slice(startIndex, endIndex) || [];
  
  const jobTypes = ['all', ...Array.from(new Set(jobs?.map((job: any) => job.job_type) || []))];
  const jobTypeOptions = jobTypes.map(type => ({ value: String(type), text: type === 'all' ? 'All Types' : String(type) }));
  
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
            onChange={(e: React.ChangeEvent<HTMLSelectElement>) => onJobTypeFilterChange(e.target.value)}
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
        render: (jobId: string, job: any) => {
          if (job.job_type === 'reports-scheduler') {
            const basePath = window.location.pathname.split('/app/')[0];
            return (
              <a href={`${window.location.origin}${basePath}/app/reports-dashboards#/report_definition_details/${jobId}`} target="_blank" rel="noopener noreferrer">
                {jobId}
              </a>
            );
          }
          return jobId;
        }
      },
      { field: 'name', name: 'Name' },
      { field: 'job_type', name: 'Type' },
      { 
        field: 'enabled', 
        name: 'Status',
        render: (enabled: boolean, job: any) => {
          if (!enabled) {
            return (
              <span>
                <span style={{ color: '#999', marginRight: '8px' , transform: 'scale(1.5)', display: 'inline-block' }}>●</span>
                Disabled
              </span>
            );
          }
          const lockKey = `${job.index_name}-${job.job_id}`;
          console.log('=== LOCKS DEBUG ===');
          console.log('All locks data:', locks);
          console.log('Job:', job.job_id, 'Index:', job.index_name);
          console.log('Lock key:', lockKey);
          console.log('Lock exists:', locks && locks[lockKey]);
          if (locks && locks[lockKey]) {
            console.log('Lock data:', locks[lockKey]);
          }
          console.log('==================');
          
          const isRunning = locks && locks[lockKey] && !locks[lockKey].released;
          if (isRunning) {
            return (
              <span>
                <span style={{ color: '#00BF63', marginRight: '8px' , transform: 'scale(1.5)', display: 'inline-block' }}>●</span>
                Running
              </span>
            );
          }
          return (
            <span>
              <span style={{ color: '#FDD835', marginRight: '8px', transform: 'scale(1.5)', display: 'inline-block' }}>●</span>
              Not Running
            </span>
          );
        }
      },
      { field: 'enabled', name: 'Enabled' },
      { 
        field: 'last_execution_time', 
        name: 'Last Execution',
        render: (time: string) => formatDateTime(time)
      },
      { 
        field: 'next_expected_execution_time', 
        name: 'Next Execution',
        render: (time: string) => formatDateTime(time)
      },
      { 
        field: 'schedule', 
        name: <ScheduleHeader />,
        render: (schedule: any) => {
          if (schedule?.type === 'cron') {
            return `Cron: ${schedule.expression} (${schedule.timezone})`;
          } else if (schedule?.type === 'interval') {
            return `Interval: ${schedule.interval} ${schedule.unit}`;
          }
          return 'N/A';
        }
      },
      { 
        name: 'Actions',
        render: (item: any) => <ActionButton onViewHistory={() => window.open(`#/history/${item.job_id}`, '_blank')} />
      },
    ]}
    pagination={{
      pageIndex,
      pageSize,
      totalItemCount: filteredJobs?.length || 0,
      pageSizeOptions: [5, 10, 20, 50]
    }}
    onChange={onPageChange}
    />
    </>
  );
};

const AllJobsPanel = ({ http, notifications }: any) => {
  const [jobs, setJobs] = useState<any>();
  const [locks, setLocks] = useState<any>();
  const [pageIndex, setPageIndex] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [jobTypeFilter, setJobTypeFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    http.get('/api/dashboards_job_scheduler/jobs')
      .then((jobsRes: any) => {
        setJobs(jobsRes.jobs);
        notifications.toasts.addSuccess('All jobs loaded');
        
        http.get('/api/dashboards_job_scheduler/locks')
          .then((locksRes: any) => {
            setLocks(locksRes.locks);
          })
          .catch(() => {
            setLocks({});
          });
      })
      .catch((error: any) => {
        notifications.toasts.addError(error, { title: 'Failed to fetch jobs' });
      });
  }, []);

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
            onRefresh={() => {
              http.get('/api/dashboards_job_scheduler/jobs')
                .then((jobsRes: any) => {
                  setJobs(jobsRes.jobs);
                  notifications.toasts.addSuccess('Jobs refreshed');
                  
                  http.get('/api/dashboards_job_scheduler/locks')
                    .then((locksRes: any) => {
                      setLocks(locksRes.locks);
                    })
                    .catch(() => {
                      setLocks({});
                    });
                })
                .catch((error: any) => {
                  notifications.toasts.addError(error, { title: 'Failed to refresh jobs' });
                });
            }}
          />
        </EuiPageContentBody>
      </EuiPageContent>
    </>
  );
};

const ActiveJobsPanel = ({ http, notifications }: any) => {
  const [jobs, setJobs] = useState<any>();
  const [locks, setLocks] = useState<any>();
  const [pageIndex, setPageIndex] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [jobTypeFilter, setJobTypeFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    http.get('/api/dashboards_job_scheduler/jobs')
      .then((jobsRes: any) => {
        http.get('/api/dashboards_job_scheduler/locks')
          .then((locksRes: any) => {
            const runningJobs = jobsRes.jobs?.filter((job: any) => {
              const lockKey = `${job.index_name}-${job.job_id}`;
              return job.enabled && locksRes.locks && locksRes.locks[lockKey] && !locksRes.locks[lockKey].released;
            }) || [];
            setJobs(runningJobs);
            setLocks(locksRes.locks);
          })
          .catch(() => {
            const runningJobs = jobsRes.jobs?.filter((job: any) => job.enabled && job.lock_duration && job.lock_duration !== 'no_lock') || [];
            setJobs(runningJobs);
            setLocks({});
          });
        notifications.toasts.addSuccess('Active jobs loaded');
      })
      .catch((error: any) => {
        notifications.toasts.addError(error, { title: 'Failed to fetch active jobs' });
      });
  }, []);

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
            onRefresh={() => {
              http.get('/api/dashboards_job_scheduler/jobs')
                .then((jobsRes: any) => {
                  http.get('/api/dashboards_job_scheduler/locks')
                    .then((locksRes: any) => {
                      const runningJobs = jobsRes.jobs?.filter((job: any) => {
                        const lockKey = `${job.index_name}-${job.job_id}`;
                        return job.enabled && locksRes.locks && locksRes.locks[lockKey] && !locksRes.locks[lockKey].released;
                      }) || [];
                      setJobs(runningJobs);
                      setLocks(locksRes.locks);
                    })
                    .catch(() => {
                      const runningJobs = jobsRes.jobs?.filter((job: any) => job.enabled && job.lock_duration && job.lock_duration !== 'no_lock') || [];
                      setJobs(runningJobs);
                      setLocks({});
                    });
                  notifications.toasts.addSuccess('Active jobs refreshed');
                })
                .catch((error: any) => {
                  notifications.toasts.addError(error, { title: 'Failed to refresh active jobs' });
                });
            }}
          />
        </EuiPageContentBody>
      </EuiPageContent>
    </>
  );
};

const HistoryPanel = ({ http, notifications, jobId }: any) => {
  const [history, setHistory] = useState<any[]>([]);
  const [pageIndex, setPageIndex] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    http.get('/api/dashboards_job_scheduler/history')
      .then((res: any) => {
        const historyArray = Object.entries(res.history || {}).map(([key, value]: [string, any]) => ({
          key,
          ...value,
          duration: value.end_time - value.start_time,
          status: value.completion_status === 0 ? 'Success' : 'Failed'
        }));
        const filteredHistory = jobId ? 
          historyArray.filter((h: any) => h.job_id === jobId) :
          historyArray;
        setHistory(filteredHistory.sort((a, b) => b.start_time - a.start_time));
        notifications.toasts.addSuccess('Job history loaded');
      })
      .catch((error: any) => {
        notifications.toasts.addError(error, { title: 'Failed to fetch job history' });
      });
  }, [jobId]);

  const filteredHistory = searchQuery ? 
    history.filter((h: any) => h.job_id?.toLowerCase().includes(searchQuery.toLowerCase())) :
    history;
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
            { field: 'start_time', name: 'Start Time', render: (time: number) => formatDateTime(new Date(time * 1000).toISOString()) },
            { field: 'end_time', name: 'End Time', render: (time: number) => formatDateTime(new Date(time * 1000).toISOString()) },
            { field: 'status', name: 'Status' },
            { field: 'duration', name: 'Duration (s)' },
          ]}
          pagination={{
            pageIndex,
            pageSize,
            totalItemCount: filteredHistory.length,
            pageSizeOptions: [5, 10, 20, 50]
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

const JobSchedulerDashboard = ({ http, notifications }: any) => {
  const [selectedTab, setSelectedTab] = useState('all');
  const [selectedJobId, setSelectedJobId] = useState<string | null>(null);

  const tabs = [
    { id: 'all', name: 'All Jobs' },
    { id: 'active', name: 'Active Jobs' },
    { id: 'history', name: 'History' }
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
          <EuiTitle size="l"><h1>Job Scheduler</h1></EuiTitle>
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
      {selectedTab === 'history' && <HistoryPanel http={http} notifications={notifications} jobId={selectedJobId} />}
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
