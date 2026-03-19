import { betterAuth } from 'better-auth'
import { drizzleAdapter } from 'better-auth/adapters/drizzle'
import bcrypt from 'bcryptjs'
import { db, user, session, account, verification } from '@overcms/core'

export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: 'pg',
    schema: { user, session, account, verification },
  }),

  emailAndPassword: {
    enabled: true,
    password: {
      hash: (password: string) => bcrypt.hash(password, 10),
      verify: ({ hash, password }: { hash: string; password: string }) =>
        bcrypt.compare(password, hash),
    },
  },

  session: {
    expiresIn: 60 * 60 * 24 * 7, // 7 dni
    updateAge: 60 * 60 * 24,     // Odśwież sesję po 24h
    cookieCache: {
      enabled: true,
      maxAge: 60 * 5, // Cache sesji 5 min
    },
  },

  trustedOrigins: process.env['ADMIN_CORS_ORIGINS']?.split(',') ?? [
    'http://localhost:3000',
  ],

  advanced: {
    useSecureCookies: process.env['NODE_ENV'] === 'production',
    crossSubDomainCookies: { enabled: false },
  },

  user: {
    additionalFields: {
      role: {
        type: 'string',
        defaultValue: 'editor',
        input: false,
      },
    },
  },
})

export type Auth = typeof auth
