/*
 * SPDX-License-Identifier: Apache-2.0
 *
 * The OpenSearch Contributors require contributions made to
 * this file be licensed under the Apache-2.0 license or a
 * compatible open source license.
 */

import {
  PluginInitializerContext,
  CoreSetup,
  CoreStart,
  Plugin,
  Logger,
} from '../../../src/core/server';

import { DashboardsJobSchedulerPluginSetup, DashboardsJobSchedulerPluginStart } from './types';
import { defineRoutes } from './routes';

export class DashboardsJobSchedulerPlugin
  implements Plugin<DashboardsJobSchedulerPluginSetup, DashboardsJobSchedulerPluginStart> {
  private readonly logger: Logger;

  constructor(initializerContext: PluginInitializerContext) {
    this.logger = initializerContext.logger.get();
  }

  public setup(core: CoreSetup) {
    this.logger.debug('dashboards-job-scheduler: Setup');
    const router = core.http.createRouter();

    // Register server side APIs
    defineRoutes(router);

    return {};
  }

  public start(core: CoreStart) {
    this.logger.debug('dashboards-job-scheduler: Started');
    return {};
  }

  public stop() {}
}
