import { createClient } from "@supabase/supabase-js";
import { config } from "dotenv";

config();

function getRequiredEnv(envName: string): string {
  const value = process.env[envName];

  if (!value) {
    throw new Error(`Missing required environment variable: ${envName}`);
  }

  return value;
}

const supabaseUrl = getRequiredEnv("SUPABASE_URL");
const supabaseAnonKey = getRequiredEnv("SUPABASE_ANON_KEY");
const supabaseServiceRoleKey = getRequiredEnv("SUPABASE_SERVICE_ROLE_KEY");

export const supabaseAnon = createClient(supabaseUrl, supabaseAnonKey);

export const supabaseAdmin = createClient(
  supabaseUrl,
  supabaseServiceRoleKey,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  },
);
