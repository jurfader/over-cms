import type { user, session } from '@overcms/core'

export type UserRow = typeof user.$inferSelect
export type SessionRow = typeof session.$inferSelect

export type AppEnv = {
  Variables: {
    user: UserRow
    session: SessionRow
  }
}
