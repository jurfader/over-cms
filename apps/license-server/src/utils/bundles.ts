import { eq, and, or, gt, isNull } from 'drizzle-orm'
import { db } from '../db/index.js'
import { licenseBundles } from '../db/schema.js'

/**
 * Katalog pakietów licencyjnych OVERCRM.
 *
 * MUSI zgadzać się 1:1 z `MarketplaceService::BUNDLE_LABELS` po stronie
 * OVERCRM. Identyfikator spoza tej listy niczego nie wywali — moduł po prostu
 * nigdy się nie odblokuje, bo CRM nie zna takiej nazwy i nie pokaże etykiety.
 * Cichy błąd, za który płaci klient, więc jedno i drugie pilnuje test.
 *
 * `overcrm-core` NIE jest tu wymieniony celowo — jest wliczony w licencję
 * i CRM traktuje go jako posiadany dla każdej ważnej licencji. Nadawanie go
 * osobno nic nie zmienia, a myli obraz w panelu.
 */
export const OVERCRM_BUNDLES: Record<string, string> = {
  'overcrm-ai':          'Pakiet AI',
  'overcrm-komunikacja': 'Pakiet Komunikacja',
  'overcrm-telefonia':   'Pakiet Telefonia',
  'overcrm-analityka':   'Pakiet Analityka',
  'overcrm-sprzedaz':    'Pakiet Sprzedaż',
  'overcrm-pliki':       'Pakiet Pliki',
  'overcrm-wdrozenie':   'Pakiet Wdrożenie',
}

/** Pakiet wliczony w licencję podstawową — nigdy nie nadawany osobno. */
export const BUNDLE_CORE = 'overcrm-core'

export function isKnownBundle(bundle: string): boolean {
  return Object.prototype.hasOwnProperty.call(OVERCRM_BUNDLES, bundle)
}

/**
 * Pakiety aktywne dla licencji — z pominięciem tych, którym minęła data.
 *
 * Filtrowanie po dacie robi baza, a nie kod, żeby wygasły trial nie przeszedł
 * przypadkiem przez odczyt z pamięci podręcznej ani przez pomyłkę w porównaniu
 * stref czasowych.
 */
export async function activeBundlesFor(licenseId: string): Promise<string[]> {
  const rows = await db
    .select({ bundle: licenseBundles.bundle })
    .from(licenseBundles)
    .where(and(
      eq(licenseBundles.licenseId, licenseId),
      or(isNull(licenseBundles.expiresAt), gt(licenseBundles.expiresAt, new Date())),
    ))
    .orderBy(licenseBundles.bundle)

  return rows.map((r) => r.bundle)
}
