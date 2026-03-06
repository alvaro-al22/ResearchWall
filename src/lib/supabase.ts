import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://tu-proyecto.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'tu-anon-key';

// Este cliente está preparado para conectar a tus tablas reales:
// - characters (Post-its de personajes)
// - relationships (Conexiones/hilos entre ellos)
export const supabase = createClient(supabaseUrl, supabaseAnonKey);
