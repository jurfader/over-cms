import { createClient } from '@overcms/sdk'

export const cms = createClient({
  apiUrl:    process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001',
  apiKey:    process.env.OVERCMS_API_KEY,
  revalidate: 60,
})
