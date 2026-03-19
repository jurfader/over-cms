'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { motion } from 'framer-motion'
import { Eye, EyeOff, LogIn, AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { api, ApiError } from '@/lib/api'
import { useAuthStore } from '@/store/auth'

const loginSchema = z.object({
  email: z.string().email('Podaj poprawny adres e-mail'),
  password: z.string().min(1, 'Hasło jest wymagane'),
})

type LoginForm = z.infer<typeof loginSchema>

interface SignInResponse {
  user: {
    id: string
    name: string
    email: string
    role: string
    image?: string | null
  }
}

export default function LoginPage() {
  const router = useRouter()
  const { setUser } = useAuthStore()
  const [showPassword, setShowPassword] = useState(false)
  const [serverError, setServerError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
  })

  async function onSubmit(values: LoginForm) {
    setServerError(null)
    try {
      const res = await api.post<SignInResponse>('/api/auth/sign-in/email', {
        email: values.email,
        password: values.password,
      })
      setUser({
        id: res.user.id,
        name: res.user.name,
        email: res.user.email,
        role: res.user.role as 'super_admin' | 'admin' | 'editor' | 'viewer',
        image: res.user.image,
      })
      router.replace('/dashboard')
    } catch (err) {
      if (err instanceof ApiError) {
        setServerError(
          err.status === 401
            ? 'Nieprawidłowy e-mail lub hasło.'
            : 'Wystąpił błąd. Spróbuj ponownie.',
        )
      } else {
        setServerError('Nie można połączyć z serwerem.')
      }
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--color-background)] p-4">
      {/* Glow bg */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[400px] bg-[var(--color-primary)]/5 rounded-full blur-[120px]" />
        <div className="absolute top-1/3 left-1/3 w-[400px] h-[400px] bg-[var(--color-secondary)]/5 rounded-full blur-[120px]" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.4, 0, 0.2, 1] }}
        className="relative w-full max-w-sm"
      >
        {/* Logo */}
        <div className="flex flex-col items-center mb-8">
          <div className="w-14 h-14 rounded-[var(--radius-xl)] gradient-bg flex items-center justify-center glow-pink mb-4">
            <svg viewBox="0 0 24 24" fill="none" className="w-8 h-8 text-white" aria-hidden="true">
              <circle cx="12" cy="12" r="3" fill="currentColor" />
              <path
                d="M12 2C6.477 2 2 6.477 2 12s4.477 10 10 10 10-4.477 10-10S17.523 2 12 2z"
                stroke="currentColor"
                strokeWidth="1.5"
                fill="none"
                opacity="0.5"
              />
              <path
                d="M12 5a7 7 0 100 14A7 7 0 0012 5z"
                stroke="currentColor"
                strokeWidth="1.5"
                fill="none"
                opacity="0.75"
              />
            </svg>
          </div>
          <h1 className="text-2xl font-bold gradient-text">OverCMS</h1>
          <p className="text-sm text-[var(--color-muted-foreground)] mt-1">Panel administracyjny</p>
        </div>

        {/* Card */}
        <div className="glass-card rounded-[var(--radius-2xl)] p-8">
          <h2 className="text-lg font-semibold text-[var(--color-foreground)] mb-6">
            Zaloguj się
          </h2>

          <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
            {/* Email */}
            <div className="space-y-1.5">
              <Label htmlFor="email">E-mail</Label>
              <Input
                id="email"
                type="email"
                placeholder="admin@overcms.local"
                autoComplete="email"
                {...register('email')}
              />
              {errors.email && (
                <p className="text-xs text-[var(--color-destructive)]">{errors.email.message}</p>
              )}
            </div>

            {/* Password */}
            <div className="space-y-1.5">
              <Label htmlFor="password">Hasło</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  autoComplete="current-password"
                  className="pr-10"
                  {...register('password')}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--color-subtle)] hover:text-[var(--color-muted-foreground)] transition-colors"
                  aria-label={showPassword ? 'Ukryj hasło' : 'Pokaż hasło'}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {errors.password && (
                <p className="text-xs text-[var(--color-destructive)]">{errors.password.message}</p>
              )}
            </div>

            {/* Server error */}
            {serverError && (
              <motion.div
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center gap-2 rounded-[var(--radius)] bg-[var(--color-destructive)]/10 border border-[var(--color-destructive)]/20 px-3 py-2.5 text-sm text-[var(--color-destructive)]"
              >
                <AlertCircle className="w-4 h-4 shrink-0" />
                {serverError}
              </motion.div>
            )}

            <Button type="submit" className="w-full mt-2" disabled={isSubmitting}>
              {isSubmitting ? (
                <span className="flex items-center gap-2">
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Logowanie...
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  <LogIn className="w-4 h-4" />
                  Zaloguj się
                </span>
              )}
            </Button>
          </form>
        </div>

        <p className="text-center text-xs text-[var(--color-subtle)] mt-6">
          OverCMS &copy; {new Date().getFullYear()} OVERMEDIA
        </p>
      </motion.div>
    </div>
  )
}
