/*
 * SPDX-License-Identifier: Apache-2.0
 *
 * The OpenSearch Contributors require contributions made to
 * this file be licensed under the Apache-2.0 license or a
 * compatible open source license.
 */

import { PluginInitializerContext } from '../../../src/core/server';
import { DashboardsJobSchedulerPlugin } from './plugin';

// This exports static code and TypeScript types,
// as well as, OpenSearch Dashboards Platform `plugin()` initializer.

export function plugin(initializerContext: PluginInitializerContext) {
  return new DashboardsJobSchedulerPlugin(initializerContext);
}

export { DashboardsJobSchedulerPluginSetup, DashboardsJobSchedulerPluginStart } from './types';
