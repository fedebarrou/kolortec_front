/**
 * tracking.js — Fire-and-forget event tracking against /public/track.
 *
 * Rules:
 *  - Uses the same fetch pattern as contentService (X-Account-Host, credentials:'include').
 *  - Never throws or blocks the render path.
 *  - Generates a random session_id on first call and persists it in localStorage.
 *    Subsequent calls within the same browser reuse the same id.
 */

import { useEffect, useRef } from 'react'
import { useLocation } from 'react-router-dom'
import { resolveAccountHost } from './accountHost'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || ''
const SESSION_KEY = 'kt_session_id'

// ---------------------------------------------------------------------------
// Enum guard — mirrors the back-end event_type enum (TRK-001).
// ---------------------------------------------------------------------------

/**
 * TRACK_EVENTS — canonical event_type values accepted by the API.
 * Any value outside this set is rejected client-side to avoid silent discards.
 */
export const TRACK_EVENTS = {
  PAGE_VIEW: 'page_view',
  PRODUCT_VIEW: 'product_view',
  SEARCH: 'search',
  ADD_TO_CART: 'add_to_cart',
  LOGIN: 'login',
}

// ---------------------------------------------------------------------------
// Session ID — persisted in localStorage across page loads.
// ---------------------------------------------------------------------------

function getOrCreateSessionId() {
  try {
    const existing = localStorage.getItem(SESSION_KEY)
    if (existing) return existing
    const id = `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 9)}`
    localStorage.setItem(SESSION_KEY, id)
    return id
  } catch {
    // Private browsing or storage blocked — use an in-memory value for this session.
    return `mem-${Date.now().toString(36)}`
  }
}

// ---------------------------------------------------------------------------
// Core — POST /public/track, fire-and-forget.
// ---------------------------------------------------------------------------

/**
 * trackEvent(payload)
 * payload: { event_type, path, product_id?, referrer?, meta? }
 * Sends a tracking event to /public/track. Never awaited by callers; errors are swallowed.
 */
export function trackEvent(payload) {
  if (!API_BASE_URL) return

  // Guard: reject unknown event_type values before they reach the network.
  if (!Object.values(TRACK_EVENTS).includes(payload.event_type)) {
    console.warn('[tracking] event_type inválido:', payload.event_type)
    return
  }

  const body = {
    session_id: getOrCreateSessionId(),
    referrer: document.referrer || undefined,
    ...payload,
  }

  const headers = { 'Content-Type': 'application/json' }
  const host = resolveAccountHost()
  if (host) headers['X-Account-Host'] = host

  // Fire and forget — intentionally not awaited.
  fetch(`${API_BASE_URL}/public/track`, {
    method: 'POST',
    headers,
    credentials: 'include',
    body: JSON.stringify(body),
  }).catch(() => {
    // Swallow all errors — tracking must never break the app.
  })
}

// ---------------------------------------------------------------------------
// Hook — page_view on every route change.
// ---------------------------------------------------------------------------

/**
 * usePageTracking()
 * Must be mounted inside <BrowserRouter>. Fires a page_view event on each
 * location change. Use once at the top of App.
 */
export function usePageTracking() {
  const location = useLocation()
  // Track the previously sent path to avoid double-firing in React StrictMode.
  const lastTracked = useRef(null)

  useEffect(() => {
    const path = location.pathname + location.search
    if (lastTracked.current === path) return
    lastTracked.current = path
    trackEvent({ event_type: 'page_view', path })
  }, [location])
}
