/*
 * SPDX-License-Identifier: Apache-2.0
 *
 * The OpenSearch Contributors require contributions made to
 * this file be licensed under the Apache-2.0 license or a
 * compatible open source license.
 */

import { IRouter } from '../../../../src/core/server';

export function defineRoutes(router: IRouter) {
  router.get(
    {
      path: '/api/dashboards_job_scheduler/example',
      validate: false,
    },
    async (context, request, response) => {
      return response.ok({
        body: {
          time: new Date().toISOString(),
        },
      });
    }
  );

  router.get(
    {
      path: '/api/dashboards_job_scheduler/jobs',
      validate: false,
    },
    async (context, request, response) => {
      try {
        const client = context.core.opensearch.client.asCurrentUser;

        const requestOptions: any = {
          method: 'GET',
          path: '/_plugins/_job_scheduler/api/jobs',
        };
        const result = await client.transport.request(requestOptions);
        return response.ok({ body: result.body });
      } catch (error) {
        return response.customError({
          statusCode: error.statusCode || 500,
          body: error.message,
        });
      }
    }
  );

  router.get(
    {
      path: '/api/dashboards_job_scheduler/locks',
      validate: false,
    },
    async (context, request, response) => {
      try {
        const client = context.core.opensearch.client.asCurrentUser;

        const requestOptions: any = {
          method: 'GET',
          path: '/_plugins/_job_scheduler/api/locks',
        };
        const result = await client.transport.request(requestOptions);
        return response.ok({ body: result.body });
      } catch (error) {
        return response.customError({
          statusCode: error.statusCode || 500,
          body: error.message,
        });
      }
    }
  );

  router.get(
    {
      path: '/api/dashboards_job_scheduler/history',
      validate: false,
    },
    async (context, request, response) => {
      try {
        const client = context.core.opensearch.client.asCurrentUser;

        const requestOptions: any = {
          method: 'GET',
          path: '/_plugins/_job_scheduler/api/history',
        };
        const result = await client.transport.request(requestOptions);
        return response.ok({ body: result.body });
      } catch (error) {
        return response.customError({
          statusCode: error.statusCode || 500,
          body: error.message,
        });
      }
    }
  );
}
