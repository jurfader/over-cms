-- Etap 2c anti-piracy: rotujący token bindujący instalację per domena.
-- Każdy /validate generuje nowy bindingToken, stary trafia do previousToken
-- jako 24h grace window (na wypadek network blip między rotacją a kolejnym
-- requestem klienta).
--
-- Klonowanie OVERCRM jest wykrywane:
--   1. Pirat klonuje wszystko z bindingToken=X
--   2. Prawdziwy klient robi /validate → server rotuje X → Y, zapisuje
--   3. Pirat robi /validate z X → server widzi że X != aktualny Y i nie ma
--      grace previousToken (bo legit klient już rotował dwa razy) → BINDING_MISMATCH
--   4. Status klienta pirata: invalid (max 24h opóźnienia detekcji)

ALTER TABLE "lic_activations"
  ADD COLUMN IF NOT EXISTS "binding_token"     varchar(64),
  ADD COLUMN IF NOT EXISTS "previous_token"    varchar(64),
  ADD COLUMN IF NOT EXISTS "token_rotated_at"  timestamp;
