import { z } from "zod";

export const medicationSchema = z.object({
  name: z.string().min(1, "Name is required").max(100),
  dosage: z.string().min(1, "Dosage is required").max(50),
  frequency: z.string().min(1, "Select frequency"),
  instructions: z.string().max(500).optional().nullable(),
});

export type MedicationSchema = z.infer<typeof medicationSchema>;
