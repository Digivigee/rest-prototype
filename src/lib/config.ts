// Global configuration for SpiceHub Restaurant Prototype

export const CONFIG = {
  RESTAURANT_NAME: "SpiceHub Restaurant",
  CURRENCY: {
    SYMBOL: "₹",
    CODE: "INR",
  },
  TAX_RATE: 0.05, // 5% GST
  SERVICE_CHARGE: 0.00, // Optional
  DEFAULT_DISCOUNT: 0,
  ATTENDANCE: {
    HALF_DAY_THRESHOLD: 5, // hours
    SHIFTS: {
      MORNING: { start: "09:00", end: "17:00" },
      EVENING: { start: "17:00", end: "01:00" }
    } as Record<string, { start: string; end: string }>
  }
}

export function formatCurrency(amount: number) {
  return CONFIG.CURRENCY.SYMBOL + amount.toLocaleString('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })
}
