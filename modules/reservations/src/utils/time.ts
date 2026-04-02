/**
 * Convert "HH:MM" string to minutes since midnight.
 */
export function timeToMinutes(time: string): number {
  const [h, m] = time.split(':').map(Number) as [number, number]
  return h * 60 + m
}

/**
 * Convert minutes since midnight to "HH:MM" string.
 */
export function minutesToTime(minutes: number): string {
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`
}

/**
 * Generate time slots between startTime and endTime with given duration (minutes).
 */
export function generateSlots(
  startTime: string,
  endTime: string,
  durationMinutes: number,
): { startTime: string; endTime: string }[] {
  const start = timeToMinutes(startTime)
  const end = timeToMinutes(endTime)
  const slots: { startTime: string; endTime: string }[] = []

  for (let t = start; t + durationMinutes <= end; t += durationMinutes) {
    slots.push({
      startTime: minutesToTime(t),
      endTime: minutesToTime(t + durationMinutes),
    })
  }

  return slots
}
