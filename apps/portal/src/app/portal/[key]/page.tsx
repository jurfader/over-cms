import type { Metadata } from 'next'
import { notFound }      from 'next/navigation'
import { getLicense }    from '@/lib/license-api'
import { LicensePanel }  from '@/components/license-panel'

interface Props { params: Promise<{ key: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { key } = await params
  return { title: `Licencja ${key.toUpperCase()}` }
}

export default async function LicenseKeyPage({ params }: Props) {
  const { key } = await params
  const license = await getLicense(key)

  if (!license) notFound()

  return (
    <main className="max-w-3xl mx-auto px-6 py-12 fade-up">
      <LicensePanel license={license} licenseKey={key.toUpperCase()} />
    </main>
  )
}
