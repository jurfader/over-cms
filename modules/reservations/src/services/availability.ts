import {
  db,
  eq,
  and,
  sql,
  rsvAvailability,
  rsvBlockedDates,
  rsvReservations,
} from '@overcms/core'
import type { rsvServices } from '@overcms/core'
import { generateSlots, timeToMinutes } from '../utils/time'

type Service = typeof rsvServices.$inferSelect

export interface TimeSlot {
  startTime: string // "09:00"
  endTime: string   // "10:00"
  available: boolean
  remainingCapacity: number
}

/**
 * Get available time slots for a service on a given date.
 */
export async function getAvailableSlots(
  service: Service,
  dateStr: string,
): Promise<TimeSlot[]> {
  const date = new Date(dateStr)
  const dayOfWeek = date.getDay() // 0=Sunday

  // 1. Check if date is blocked
  const [blocked] = await db
    .select()
    .from(rsvBlockedDates)
    .where(
      and(
        eq(rsvBlockedDates.date, dateStr),
        sql`(${rsvBlockedDates.serviceId} IS NULL OR ${rsvBlockedDates.serviceId} = ${service.id})`,
      ),
    )
    .limit(1)

  if (blocked) return [] // Date is blocked

  // 2. Get availability rule for this day of week
  const [rule] = await db
    .select()
    .from(rsvAvailability)
    .where(
      and(
        eq(rsvAvailability.serviceId, service.id),
        eq(rsvAvailability.dayOfWeek, dayOfWeek),
        eq(rsvAvailability.active, true),
      ),
    )
    .limit(1)

  if (!rule) return [] // No availability on this day

  // 3. Generate all possible slots
  const duration = rule.slotDuration ?? service.durationMinutes
  const allSlots = generateSlots(rule.startTime, rule.endTime, duration)

  // 4. Get existing non-cancelled reservations for this service & date
  const existing = await db
    .select({
      startTime: rsvReservations.startTime,
      endTime: rsvReservations.endTime,
      guestCount: rsvReservations.guestCount,
    })
    .from(rsvReservations)
    .where(
      and(
        eq(rsvReservations.serviceId, service.id),
        eq(rsvReservations.date, dateStr),
        sql`${rsvReservations.status} != 'cancelled'`,
      ),
    )

  // 5. Calculate remaining capacity for each slot
  return allSlots.map((slot) => {
    // Count bookings that overlap this slot
    const overlapping = existing.filter((r) => {
      const rStart = timeToMinutes(r.startTime)
      const rEnd = timeToMinutes(r.endTime)
      const sStart = timeToMinutes(slot.startTime)
      const sEnd = timeToMinutes(slot.endTime)
      return rStart < sEnd && rEnd > sStart
    })

    const bookedCapacity = overlapping.reduce((sum, r) => sum + r.guestCount, 0)
    const remaining = service.capacity - bookedCapacity

    return {
      startTime: slot.startTime,
      endTime: slot.endTime,
      available: remaining > 0,
      remainingCapacity: Math.max(0, remaining),
    }
  })
}
