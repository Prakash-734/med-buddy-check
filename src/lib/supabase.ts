// src/lib/supabase.ts
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Database types
export interface Medication {
  id: string;
  user_id: string;
  name: string;
  dosage: string;
  frequency: string;
  instructions?: string;
  created_at: string;
  updated_at: string;
}

export interface MedicationLog {
  id: string;
  user_id: string;
  medication_id: string;
  taken_at: string;
  date_taken: string;
  image_url?: string;
  notes?: string;
  created_at: string;
}

export interface MedicationWithLogs extends Medication {
  medication_logs: MedicationLog[];
}

// Helper types
export interface CreateMedicationInput {
  name: string;
  dosage: string;
  frequency: string;
  instructions?: string;
}

export interface CreateMedicationLogInput {
  medication_id: string;
  date_taken: string;
  image_url?: string;
  notes?: string;
}