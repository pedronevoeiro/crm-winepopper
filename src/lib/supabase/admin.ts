import { createClient } from '@supabase/supabase-js'

// NOTE: Database generic omitted because supabase-js v2.98 GenericSchema
// requirements don't match the hand-written types. The client works correctly
// at runtime; only compile-time inference is lost. Re-enable after running
// `supabase gen types` to generate a fully-compatible Database type.
export function createAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    },
  )
}
