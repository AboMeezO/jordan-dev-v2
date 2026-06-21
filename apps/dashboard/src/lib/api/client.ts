import { env } from '#/env'

import { ApiClientError, normalizeApiError } from './errors'

import type { ApiError } from './errors'
import type { z } from 'zod'

type HttpMethod = 'DELETE' | 'GET' | 'PATCH' | 'POST'

type ApiRequestOptions = Omit<RequestInit, 'body' | 'credentials' | 'method'> & {
  body?: unknown
  method?: HttpMethod
}

export async function apiRequest<T>(
  path: string,
  options: ApiRequestOptions = {},
  schema?: z.ZodType<T>,
): Promise<T> {
  const response = await fetch(buildApiUrl(path), {
    ...options,
    body: serializeBody(options.body),
    credentials: 'include',
    headers: buildHeaders(options.headers, options.body),
    method: options.method ?? 'GET',
  })

  const payload = await parseJsonResponse(response)

  if (!response.ok) {
    throw new ApiClientError(normalizeApiError(payload), response.status)
  }

  if (!schema) {
    return payload as T
  }

  const parsed = schema.safeParse(payload)

  if (!parsed.success) {
    const apiError: ApiError = {
      code: 'invalid_response',
      message: 'The API returned an unexpected response.',
      fieldErrors: parsed.error.flatten().fieldErrors,
    }

    throw new ApiClientError(apiError, response.status)
  }

  return parsed.data
}

export async function parseJsonResponse(response: Response): Promise<unknown> {
  if (response.status === 204) {
    return undefined
  }

  const text = await response.text()

  if (text.trim().length === 0) {
    return undefined
  }

  const contentType = response.headers.get('content-type') ?? ''

  if (!contentType.toLowerCase().includes('application/json')) {
    return text
  }

  try {
    return JSON.parse(text) as unknown
  } catch (error) {
    throw new ApiClientError(normalizeApiError(error), response.status)
  }
}

function buildApiUrl(path: string) {
  if (/^https?:\/\//i.test(path)) {
    return path
  }

  const normalizedPath = path.startsWith('/') ? path : `/${path}`
  const baseUrl = env.VITE_API_URL?.replace(/\/$/, '')

  return baseUrl ? `${baseUrl}${normalizedPath}` : normalizedPath
}

function buildHeaders(headers: HeadersInit | undefined, body: unknown) {
  const requestHeaders = new Headers(headers)

  if (body !== undefined && !requestHeaders.has('content-type')) {
    requestHeaders.set('content-type', 'application/json')
  }

  return requestHeaders
}

function serializeBody(body: unknown) {
  if (body === undefined || body instanceof FormData || body instanceof Blob) {
    return body as BodyInit | undefined
  }

  if (typeof body === 'string') {
    return body
  }

  return JSON.stringify(body)
}
