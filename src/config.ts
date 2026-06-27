// config.ts
// Config de entorno para la etapa de carga (load). El loader en sí queda
// pendiente como próximo ladrillo; esto deja el cableado listo.

export interface DbConfig {
  databaseUrl?: string;
  supabaseUrl?: string;
  supabaseServiceRoleKey?: string;
}

export function loadConfig(env: NodeJS.ProcessEnv = process.env): DbConfig {
  return {
    databaseUrl: env.DATABASE_URL,
    supabaseUrl: env.SUPABASE_URL,
    supabaseServiceRoleKey: env.SUPABASE_SERVICE_ROLE_KEY,
  };
}

export function requireDatabaseUrl(env: NodeJS.ProcessEnv = process.env): string {
  const url = env.DATABASE_URL;
  if (!url) {
    throw new Error('Falta DATABASE_URL (copiá .env.example a .env y completá).');
  }
  return url;
}
