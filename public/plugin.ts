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

import { i18n } from '@osd/i18n';
import { AppMountParameters, CoreSetup, CoreStart, Plugin, DEFAULT_APP_CATEGORIES } from '../../../src/core/public';
import {
  DashboardsJobSchedulerPluginSetup,
  DashboardsJobSchedulerPluginStart,
  AppPluginStartDependencies,
} from './types';
import { PLUGIN_NAME } from '../common';

export class DashboardsJobSchedulerPlugin
  implements Plugin<DashboardsJobSchedulerPluginSetup, DashboardsJobSchedulerPluginStart> {
  public setup(core: CoreSetup): DashboardsJobSchedulerPluginSetup {
    // Register an application into the side navigation menu
    core.application.register({
      id: 'dashboardsJobScheduler',
      title: 'Job Scheduler',
      category: DEFAULT_APP_CATEGORIES.management,
      async mount(params: AppMountParameters) {
        // Load application bundle
        const { renderApp } = await import('./application');
        // Get start services as specified in opensearch_dashboards.json
        const [coreStart, depsStart] = await core.getStartServices();
        // Render the application
        return renderApp(coreStart, depsStart as AppPluginStartDependencies, params);
      },
    });

    // Return methods that should be available to other plugins
    return {
      getGreeting() {
        return i18n.translate('dashboardsJobScheduler.greetingText', {
          defaultMessage: 'Hello from {name}!',
          values: {
            name: PLUGIN_NAME,
          },
        });
      },
    };
  }

  public start(core: CoreStart): DashboardsJobSchedulerPluginStart {
    return {};
  }

  public stop() {}
}
