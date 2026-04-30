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
          path: '/_plugins/_job_scheduler/api/jobs'
        };
        const result = await client.transport.request(requestOptions);
        return response.ok({ body: result.body });
      } catch (error) {
        return response.customError({
          statusCode: error.statusCode || 500,
          body: error.message
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
          path: '/_plugins/_job_scheduler/api/locks'
        };
        const result = await client.transport.request(requestOptions);
        return response.ok({ body: result.body });
      } catch (error) {
        return response.customError({
          statusCode: error.statusCode || 500,
          body: error.message
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
          path: '/_plugins/_job_scheduler/api/history'
        };
        const result = await client.transport.request(requestOptions);
        return response.ok({ body: result.body });
      } catch (error) {
        return response.customError({
          statusCode: error.statusCode || 500,
          body: error.message
        });
      }
    }
  );
}
