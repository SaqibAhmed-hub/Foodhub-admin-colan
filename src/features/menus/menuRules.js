// Form rules for the menu builder. They mirror the backend's checks so mistakes are caught before sending;
// the backend still enforces them.

export const DEFAULT_TIMES = {
  orderOpenTime: '09:00',
  orderCloseTime: '13:00',
  pickupStartTime: '13:00',
  pickupEndTime: '15:00',
}

let rowCounter = 0
export const newRow = (over = {}) => ({ key: `r${++rowCounter}`, foodItemId: '', qty: '20', price: '', orderedQty: 0, ...over })

export function formFromMenu(menu) {
  return {
    menuDate: menu.menuDate,
    orderOpenTime: menu.orderOpenTime.slice(0, 5),
    orderCloseTime: menu.orderCloseTime.slice(0, 5),
    pickupStartTime: menu.pickupStartTime.slice(0, 5),
    pickupEndTime: menu.pickupEndTime.slice(0, 5),
    rows: menu.items.map((i) => newRow({
      foodItemId: String(i.foodItemId), qty: String(i.totalQty), price: String(i.price), orderedQty: i.orderedQty,
    })),
  }
}

/** Returns { times, date, rows: { [rowKey]: { dish?, qty?, price? } }, general } (empty object when valid). */
export function validateMenu(form, { editing, today }) {
  const errors = {}

  if (!editing) {
    if (!form.menuDate) errors.date = 'Choose a date.'
    else if (form.menuDate < today) errors.date = 'The date cannot be in the past.'
  }

  const { orderOpenTime: o, orderCloseTime: c, pickupStartTime: ps, pickupEndTime: pe } = form
  if (!o || !c || !ps || !pe) errors.times = 'Fill in all four times.'
  else if (!(o < c && c <= ps && ps < pe)) {
    errors.times = 'Order: opens before it closes, and it must close by the time pickup starts. Pickup must end after it starts.'
  }

  if (form.rows.length === 0) errors.general = 'Add at least one dish.'

  const seen = new Set()
  const rows = {}
  for (const r of form.rows) {
    const e = {}
    if (!r.foodItemId) e.dish = 'Choose a dish.'
    else if (seen.has(r.foodItemId)) e.dish = 'This dish is already on the menu.'
    seen.add(r.foodItemId)

    const qty = Number(r.qty)
    if (!Number.isInteger(qty) || qty < 1) e.qty = 'Whole number, 1 or more.'
    else if (qty < r.orderedQty) e.qty = `${r.orderedQty} already ordered.`

    if (r.price !== '' && (Number.isNaN(Number(r.price)) || Number(r.price) < 0)) e.price = 'Invalid price.'
    if (Object.keys(e).length) rows[r.key] = e
  }
  if (Object.keys(rows).length) errors.rows = rows

  return errors
}

export function toItems(rows) {
  return rows.map((r) => ({
    foodItemId: Number(r.foodItemId),
    qty: Number(r.qty),
    ...(r.price === '' ? {} : { price: Number(r.price) }), // omitted price = catalogue price (or keep the current one)
  }))
}
