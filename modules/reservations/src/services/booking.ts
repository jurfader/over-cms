import {
  db,
  eq,
  and,
  sql,
  rsvReservations,
} from '@overcms/core'
import type { rsvServices } from '@overcms/core'
import { minutesToTime, timeToMinutes } from '../utils/time'

type Service = typeof rsvServices.$inferSelect

interface BookingInput {
  date: string
  startTime: string
  customerName: string
  customerEmail: string
  customerPhone?: string
  guestCount: number
  notes?: string
}

type Reservation = typeof rsvReservations.$inferSelect

type BookingResult =
  | Reservation
  | { error: string }

/**
 * Create a reservation with conflict detection.
 * Uses a transaction to prevent double bookings.
 */
export async function createBooking(
  service: Service,
  input: BookingInput,
  ip: string,
): Promise<BookingResult> {
  const endMinutes = timeToMinutes(input.startTime) + service.durationMinutes
  const endTime = minutesToTime(endMinutes)

  return await db.transaction(async (tx) => {
    // Check availability within the transaction
    // Count existing non-cancelled reservations for this slot
    const [existing] = await tx
      .select({
        count: sql<number>`coalesce(sum(${rsvReservations.guestCount}), 0)::int`,
      })
      .from(rsvReservations)
      .where(
        and(
          eq(rsvReservations.serviceId, service.id),
          eq(rsvReservations.date, input.date),
          sql`${rsvReservations.status} != 'cancelled'`,
          // Overlap check: existing.start < new.end AND existing.end > new.start
          sql`${rsvReservations.startTime}::time < ${endTime}::time`,
          sql`${rsvReservations.endTime}::time > ${input.startTime}::time`,
        ),
      )

    const bookedCapacity = existing?.count ?? 0
    if (bookedCapacity + input.guestCount > service.capacity) {
      return { error: 'Slot is no longer available' }
    }

    // Insert reservation
    const [reservation] = await tx
      .insert(rsvReservations)
      .values({
        serviceId: service.id,
        date: input.date,
        startTime: input.startTime,
        endTime,
        status: service.price === 0 ? 'confirmed' : 'pending',
        customerName: input.customerName,
        customerEmail: input.customerEmail,
        customerPhone: input.customerPhone,
        guestCount: input.guestCount,
        notes: input.notes,
        totalPrice: service.price * input.guestCount,
        currency: service.currency,
        ip,
      })
      .returning()

    return reservation!
  })
}
