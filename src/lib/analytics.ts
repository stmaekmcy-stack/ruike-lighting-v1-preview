export type AnalyticsEventName =
  | 'view_home'
  | 'click_start_project'
  | 'click_phone'
  | 'view_wechat_qr'
  | 'submit_lead_success'
  | 'submit_lead_error'

export type AnalyticsProperties = {
  source?: 'navigation' | 'hero' | 'product' | 'contact' | 'project_form'
  reason?: 'validation' | 'network' | 'unconfigured' | 'simulated'
}

export type AnalyticsRecord = {
  event: AnalyticsEventName
  timestamp: string
  path: string
  properties: AnalyticsProperties
}

declare global {
  interface Window {
    __RUIKE_ANALYTICS_QUEUE__?: AnalyticsRecord[]
    dataLayer?: Array<Record<string, unknown>>
  }
}

const trackedOnce = new Set<string>()
const maxQueuedEvents = 100

export function trackEvent(
  event: AnalyticsEventName,
  properties: AnalyticsProperties = {},
) {
  if (typeof window === 'undefined') return

  const record: AnalyticsRecord = {
    event,
    timestamp: new Date().toISOString(),
    path: window.location.pathname,
    properties,
  }

  const queue = Array.isArray(window.__RUIKE_ANALYTICS_QUEUE__)
    ? window.__RUIKE_ANALYTICS_QUEUE__
    : []
  queue.push(record)
  if (queue.length > maxQueuedEvents) {
    queue.splice(0, queue.length - maxQueuedEvents)
  }
  window.__RUIKE_ANALYTICS_QUEUE__ = queue

  const dataLayerRecord = {
    event,
    page_path: record.path,
    event_timestamp: record.timestamp,
    ...properties,
  }

  if (Array.isArray(window.dataLayer)) {
    window.dataLayer.push(dataLayerRecord)
  } else {
    window.dataLayer = [dataLayerRecord]
  }

  window.dispatchEvent(new CustomEvent<AnalyticsRecord>('ruike:analytics', { detail: record }))
}

export function trackEventOnce(
  event: AnalyticsEventName,
  properties: AnalyticsProperties = {},
) {
  if (typeof window === 'undefined') return

  const key = `${window.location.pathname}:${event}:${properties.source ?? ''}`
  if (trackedOnce.has(key)) return

  trackedOnce.add(key)
  trackEvent(event, properties)
}
