import { describe, it, expect } from 'vitest';
import { isAfter } from 'date-fns';

const isFutureDate = (date: Date) => {
  const today = new Date();
  today.setHours(23, 59, 59, 999);
  return isAfter(date, today);
};

const isMedicationTakenOnDate = (med: any, date: string) => {
  return med.medication_logs.some((log: any) => log.date_taken === date);
};

const calculateMonthlyAdherence = (medications: any[], today = new Date()): number => {
  const start = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), 1)); // Start of month UTC
  const end = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate())); // Today UTC
  const days: string[] = [];

  let current = new Date(start);
  while (current <= end) {
    const dayStr = current.toISOString().split('T')[0]; // 'YYYY-MM-DD'
    days.push(dayStr);
    current = new Date(Date.UTC(current.getUTCFullYear(), current.getUTCMonth(), current.getUTCDate() + 1));
  }

  let expected = 0;
  let taken = 0;

  for (const dateStr of days) {
    for (const med of medications) {
      expected++;
      const isTaken = med.medication_logs.some((log: any) => log.date_taken === dateStr);
      if (isTaken) taken++;
    }
  }

  return expected > 0 ? Math.round((taken / expected) * 100) : 0;
};

describe('PatientDashboard logic tests', () => {
  it('should return correct monthly adherence', () => {
    const mockMedications = [
      {
        medication_logs: [
          { date_taken: '2025-07-01' },
          { date_taken: '2025-07-02' },
        ],
      },
      {
        medication_logs: [
          { date_taken: '2025-07-01' },
        ],
      },
    ];


    const mockToday = new Date(Date.UTC(2025, 6, 2)); 

    const result = calculateMonthlyAdherence(mockMedications, mockToday);


    expect(result).toBe(75);
  });

  it('should return true for a future date', () => {
    const future = new Date();
    future.setDate(future.getDate() + 3);
    expect(isFutureDate(future)).toBe(true);
  });

  it('should detect if medication was taken on a specific date', () => {
    const med = {
      medication_logs: [
        { date_taken: '2025-07-04' },
      ],
    };
    expect(isMedicationTakenOnDate(med, '2025-07-04')).toBe(true);
    expect(isMedicationTakenOnDate(med, '2025-07-03')).toBe(false);
  });
});
