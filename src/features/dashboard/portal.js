// Pure rules for opening and closing the ordering portal. No React, no network, easy to reason about.
//
// The backend has no "portal switch": ordering is open while  orderOpenTime <= now < orderCloseTime  (today,
// organisation timezone). So "open now" / "close now" are edits of those two times to the current minute.
// The backend requires:  open < close <= pickupStart < pickupEnd.
import { addMinutes, hm } from '../../shared/lib/time'

/** NOT_OPEN | ORDERING_OPEN | ORDERING_CLOSED | PICKUP_OPEN | ENDED, using HH:mm strings. */
export function phaseOf(menu, nowTime) {
  if (nowTime < hm(menu.orderOpenTime)) return 'NOT_OPEN'
  if (nowTime < hm(menu.orderCloseTime)) return 'ORDERING_OPEN'
  if (nowTime < hm(menu.pickupStartTime)) return 'ORDERING_CLOSED'
  if (nowTime < hm(menu.pickupEndTime)) return 'PICKUP_OPEN'
  return 'ENDED'
}

/**
 * Open (or reopen) ordering now, closing at `closeTime`.
 * If ordering is already open this only moves the closing time and keeps the original opening time.
 * Returns { patch } or { error }.
 */
export function planOpen(menu, nowTime, closeTime) {
  const pickupStart = hm(menu.pickupStartTime)
  if (!closeTime) return { error: 'Choose when ordering should close.' }
  if (nowTime >= pickupStart) {
    return { error: `Pickup has already started (${pickupStart}). Edit the menu's pickup times first.` }
  }
  if (closeTime <= nowTime) return { error: 'The closing time must be later than the current time.' }
  if (closeTime > pickupStart) {
    return { error: `Ordering must close by ${pickupStart}, when pickup starts. Pick an earlier time, or edit the menu's pickup times.` }
  }
  const alreadyOpen = phaseOf(menu, nowTime) === 'ORDERING_OPEN'
  return { patch: { orderOpenTime: alreadyOpen ? hm(menu.orderOpenTime) : nowTime, orderCloseTime: closeTime } }
}

/**
 * Close ordering right now. Returns { patch } or { error }.
 * The backend needs open < close. If ordering was opened in this very minute, the opening time is moved back
 * one minute so the portal can still be shut immediately.
 */
export function planClose(menu, nowTime) {
  const open = hm(menu.orderOpenTime)
  if (open < nowTime) return { patch: { orderCloseTime: nowTime } }
  if (open === nowTime) {
    const earlier = addMinutes(nowTime, -1)
    if (earlier < nowTime) return { patch: { orderOpenTime: earlier, orderCloseTime: nowTime } }
  }
  return { error: 'Ordering has not opened yet, so there is nothing to close.' }
}

/** Full PUT body: the menu's current values with `patch` applied. Items are sent unchanged. */
export function buildUpdateBody(menu, patch) {
  return {
    orderOpenTime: hm(menu.orderOpenTime),
    orderCloseTime: hm(menu.orderCloseTime),
    pickupStartTime: hm(menu.pickupStartTime),
    pickupEndTime: hm(menu.pickupEndTime),
    ...patch,
    items: menu.items.map((i) => ({ foodItemId: i.foodItemId, price: i.price, qty: i.totalQty })),
  }
}
