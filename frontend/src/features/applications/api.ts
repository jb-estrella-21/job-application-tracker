import { apiRequest } from '../../lib/api';

import type {
  ApplicationHistoryResponse,
  ApplicationResponse,
  ApplicationsQuery,
  ApplicationsResponse,
  CreateApplicationInput,
  UpdateApplicationInput,
} from '../../types/application';

export function deleteApplication(
  accessToken: string,
  id: string,
) {
  return apiRequest<void>(
    `/applications/${id}`,
    {
      method: 'DELETE',
    },
    accessToken,
  );
}

export async function getApplication(
  accessToken: string,
  id: string,
) {
  const response = await apiRequest<ApplicationResponse>(
    `/applications/${id}`,
    {},
    accessToken,
  );

  return response.application;
}

export function getApplicationHistory(
  accessToken: string,
  id: string,
) {
  return apiRequest<ApplicationHistoryResponse>(
    `/applications/${id}/history`,
    {},
    accessToken,
  );
}

export async function updateApplication(
  accessToken: string,
  id: string,
  input: UpdateApplicationInput,
) {
  const response = await apiRequest<ApplicationResponse>(
    `/applications/${id}`,
    {
      method: 'PATCH',
      body: JSON.stringify(input),
    },
    accessToken,
  );

  return response.application;
}

export async function createApplication(
  accessToken: string,
  input: CreateApplicationInput,
) {
  const response = await apiRequest<ApplicationResponse>(
    '/applications',
    {
      method: 'POST',
      body: JSON.stringify(input),
    },
    accessToken,
  );

  return response.application;
}

export function getApplications(
  accessToken: string,
  query: ApplicationsQuery = {},
) {
  const params = new URLSearchParams();

  if (query.page !== undefined) {
    params.set('page', String(query.page));
  }

  if (query.limit !== undefined) {
    params.set('limit', String(query.limit));
  }

  if (query.search) {
    params.set('search', query.search);
  }

  if (query.status) {
    params.set('status', query.status);
  }

  if (query.sort) {
    params.set('sort', query.sort);
  }

  if (query.order) {
    params.set('order', query.order);
  }

  const queryString = params.toString();

  const path = queryString
    ? `/applications?${queryString}`
    : '/applications';

  return apiRequest<ApplicationsResponse>(
    path,
    {},
    accessToken,
  );
}
