// src/lib/medicationService.ts
import { supabase } from './supabase';
import type { 
  Medication, 
  MedicationLog, 
  MedicationWithLogs, 
  CreateMedicationInput, 
  CreateMedicationLogInput 
} from './supabase';

export class MedicationService {
  // Get all medications for the current user
  static async getMedications(): Promise<MedicationWithLogs[]> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { data, error } = await supabase
      .from('medications')
      .select(`
        *,
        medication_logs (*)
      `)
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  }

  // Get medication by ID
  static async getMedicationById(id: string): Promise<MedicationWithLogs | null> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { data, error } = await supabase
      .from('medications')
      .select(`
        *,
        medication_logs (*)
      `)
      .eq('id', id)
      .eq('user_id', user.id)
      .single();

    if (error) throw error;
    return data;
  }

  // Create a new medication
  static async createMedication(input: CreateMedicationInput): Promise<Medication> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { data, error } = await supabase
      .from('medications')
      .insert({
        ...input,
        user_id: user.id
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  // Update medication
  static async updateMedication(id: string, input: Partial<CreateMedicationInput>): Promise<Medication> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { data, error } = await supabase
      .from('medications')
      .update(input)
      .eq('id', id)
      .eq('user_id', user.id)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  // Delete medication
  static async deleteMedication(id: string): Promise<void> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { error } = await supabase
      .from('medications')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id);

    if (error) throw error;
  }

  // Log medication taken
  static async logMedicationTaken(input: CreateMedicationLogInput): Promise<MedicationLog> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    console.log('Logging medication taken:', input);

    const { data, error } = await supabase
      .from('medication_logs')
      .insert({
        ...input,
        user_id: user.id,
        taken_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) {
      console.error('Error inserting medication log:', error);
      throw error;
    }
    
    console.log('Medication log created successfully:', data);
    return data;
  }

  // Get medication logs for a specific date
  static async getMedicationLogsForDate(date: string): Promise<MedicationLog[]> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { data, error } = await supabase
      .from('medication_logs')
      .select('*')
      .eq('user_id', user.id)
      .eq('date_taken', date)
      .order('taken_at', { ascending: false });

    if (error) throw error;
    return data || [];
  }

  // Check if medication was taken on a specific date
  static async isMedicationTakenOnDate(medicationId: string, date: string): Promise<boolean> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { data, error } = await supabase
      .from('medication_logs')
      .select('id')
      .eq('user_id', user.id)
      .eq('medication_id', medicationId)
      .eq('date_taken', date)
      .limit(1);

    if (error) throw error;
    return (data?.length || 0) > 0;
  }

  // Upload image to Supabase storage - IMPROVED VERSION
  static async uploadImage(file: File): Promise<string> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    console.log('Uploading image:', file.name, 'Size:', file.size);

    // Check if file is too large (5MB limit)
    if (file.size > 5 * 1024 * 1024) {
      throw new Error('File size too large. Maximum size is 5MB.');
    }

    // Check if file is an image
    if (!file.type.startsWith('image/')) {
      throw new Error('File must be an image');
    }

    const fileName = `${user.id}/${Date.now()}_${file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
    
    console.log('Uploading to path:', fileName);

    const { data, error } = await supabase.storage
      .from('medication-images')
      .upload(fileName, file, {
        cacheControl: '3600',
        upsert: false
      });

    if (error) {
      console.error('Storage upload error:', error);
      throw new Error(`Failed to upload image: ${error.message}`);
    }

    console.log('Upload successful:', data);

    const { data: { publicUrl } } = supabase.storage
      .from('medication-images')
      .getPublicUrl(fileName);

    console.log('Public URL:', publicUrl);
    return publicUrl;
  }

  // Calculate adherence percentage
  static async calculateAdherencePercentage(days: number = 30): Promise<number> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    
    const { data: medications } = await supabase
      .from('medications')
      .select('id')
      .eq('user_id', user.id);

    if (!medications || medications.length === 0) return 0;

    const { data: logs } = await supabase
      .from('medication_logs')
      .select('date_taken')
      .eq('user_id', user.id)
      .gte('date_taken', startDate.toISOString().split('T')[0]);

    if (!logs) return 0;

    const uniqueDates = new Set(logs.map(log => log.date_taken));
    const totalExpectedDays = days;
    const adherencePercentage = (uniqueDates.size / totalExpectedDays) * 100;

    return Math.round(adherencePercentage);
  }
}