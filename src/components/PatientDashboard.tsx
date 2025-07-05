import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, addMonths, subMonths, isAfter } from "date-fns";
import { toast } from "sonner";
import { MedicationService } from "@/lib/medicationService";
import type { MedicationWithLogs } from "@/lib/supabase";
import { Check, Pill, Calendar, TrendingUp, ImageIcon, X, Eye, ChevronLeft, ChevronRight } from "lucide-react";

export default function PatientDashboard() {
  const [medications, setMedications] = useState<MedicationWithLogs[]>([]);
  const [selectedImages, setSelectedImages] = useState<{ [key: string]: File }>({});
  const [imagePreviews, setImagePreviews] = useState<{ [key: string]: string }>({});
  const [viewingMedication, setViewingMedication] = useState<any>(null);
  const [takingMedication, setTakingMedication] = useState<string | null>(null);
  const [uploadingImage, setUploadingImage] = useState<string | null>(null);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [monthlyAdherencePercentage, setMonthlyAdherencePercentage] = useState(0);
  const today = format(new Date(), "yyyy-MM-dd");

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (medications.length > 0) {
      setMonthlyAdherencePercentage(calculateMonthlyAdherence(medications, currentDate));
    }
  }, [medications, currentDate]);

  const loadData = async () => {
    try {
      const data = await MedicationService.getMedications();
      setMedications(data);
    } catch (err) {
      toast.error("Failed to load medications");
    }
  };

  const calculateMonthlyAdherence = (meds: MedicationWithLogs[], target: Date) => {
    const monthStart = startOfMonth(target);
    const monthEnd = endOfMonth(target);
    const today = new Date();

    if (isAfter(monthStart, today)) return 0;

    const days = eachDayOfInterval({ start: monthStart, end: isAfter(monthEnd, today) ? today : monthEnd });

    let total = 0, taken = 0;
    meds.forEach(med => {
      const freq = med.frequency.toLowerCase();
      let perDay = freq.includes("twice") ? 2 : freq.includes("three") ? 3 : freq.includes("four") ? 4 : 1;

      days.forEach(day => {
        const dateStr = format(day, "yyyy-MM-dd");
        const log = med.medication_logs.find(l => l.date_taken === dateStr);
        total += perDay;
        if (log) taken += perDay;
      });
    });

    return total > 0 ? Math.round((taken / total) * 100) : 0;
  };

  const handleMarkTaken = async (medId: string, date: string) => {
    try {
      setTakingMedication(medId);
      let imageUrl;

      if (date === today && selectedImages[medId]) {
        const file = selectedImages[medId];
        setUploadingImage(medId);
        imageUrl = await MedicationService.uploadImage(file);
        setUploadingImage(null);
      }

      await MedicationService.logMedicationTaken({ medication_id: medId, date_taken: date, image_url: imageUrl });
      toast.success("Marked as taken");
      removeImage(medId);
      loadData();
    } catch {
      toast.error("Failed to mark taken");
    } finally {
      setTakingMedication(null);
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>, medId: string) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedImages(prev => ({ ...prev, [medId]: file }));
      const reader = new FileReader();
      reader.onloadend = () => setImagePreviews(prev => ({ ...prev, [medId]: reader.result as string }));
      reader.readAsDataURL(file);
    }
  };

  const removeImage = (medId: string) => {
    setSelectedImages(prev => {
      const copy = { ...prev };
      delete copy[medId];
      return copy;
    });
    setImagePreviews(prev => {
      const copy = { ...prev };
      delete copy[medId];
      return copy;
    });
  };

  const getTodaysLog = (med: MedicationWithLogs) => med.medication_logs.find(log => log.date_taken === today);
  const isTakenToday = (med: MedicationWithLogs) => !!getTodaysLog(med);
  const navigateMonth = (dir: "prev" | "next") => setCurrentDate(prev => dir === "prev" ? subMonths(prev, 1) : addMonths(prev, 1));
  const isFuture = (date: Date) => isAfter(date, new Date());

  return (
    <div className="flex gap-6">
      {/* Main */}
      <div className="flex-1 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <StatCard label="Total Medications" icon={<Pill />} value={medications.length} color="blue" />
          <StatCard label="Monthly Adherence" icon={<TrendingUp />} value={`${monthlyAdherencePercentage}%`} color="green" />
          <StatCard label="Today's Progress" icon={<Calendar />} value={`${medications.filter(isTakenToday).length}/${medications.length}`} color="purple" />
        </div>

        <Card>
          <CardHeader><CardTitle>My Medications</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            {medications.map(med => {
              const isTaken = isTakenToday(med);
              const log = getTodaysLog(med);
              const hasImage = imagePreviews[med.id];
              return (
                <Card key={med.id} className={`transition-all ${isTaken ? "bg-green-50 border-green-200" : ""}`}>
                  <CardContent className="p-4 flex justify-between items-center">
                    <div>
                      <div className="font-semibold">{med.name}</div>
                      <div className="text-sm text-muted-foreground">{med.dosage} • {med.frequency}</div>
                      {med.instructions && <div className="text-xs mt-1">{med.instructions}</div>}
                      {isTaken && log?.image_url && (
                        <img src={log.image_url} alt="Proof" className="mt-2 w-32 rounded border" />
                      )}
                    </div>
                    <div className="flex gap-2 items-center">
                      {!isTaken && (
                        <>
                          {!hasImage ? (
                            <div className="flex items-center gap-2 p-2 border rounded bg-gray-50">
                              <Label htmlFor={`img-${med.id}`} className="text-xs cursor-pointer">
                                <ImageIcon className="w-3 h-3 inline" /> Add Photo
                              </Label>
                              <Input id={`img-${med.id}`} type="file" onChange={(e) => handleImageChange(e, med.id)} className="hidden" />
                            </div>
                          ) : (
                            <div className="relative">
                              <img src={imagePreviews[med.id]} className="w-12 h-12 rounded border" />
                              <Button size="sm" variant="ghost" className="absolute -top-2 -right-2 h-6 w-6 bg-red-500 text-white p-0" onClick={() => removeImage(med.id)}><X className="w-3 h-3" /></Button>
                            </div>
                          )}
                          <Button onClick={() => handleMarkTaken(med.id, today)} size="sm" className="bg-green-600 hover:bg-green-700" disabled={takingMedication === med.id || uploadingImage === med.id}>
                            {takingMedication === med.id ? "Saving..." : <><Check className="w-4 h-4 mr-1" /> Mark Taken</>}
                          </Button>
                        </>
                      )}
                      {isTaken && (
                        <Badge variant="secondary" className="bg-green-100 text-green-800"><Check className="w-3 h-3 mr-1" /> Taken Today</Badge>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </CardContent>
        </Card>
      </div>

      {/* Calendar */}
      <div className="w-80">
        <Card className="sticky top-4">
          <CardHeader className="flex justify-between items-center">
            <CardTitle>Calendar</CardTitle>
            <div className="flex gap-2">
              <Button size="sm" variant="outline" onClick={() => navigateMonth("prev")}><ChevronLeft className="w-4 h-4" /></Button>
              <Button size="sm" variant="outline" onClick={() => navigateMonth("next")}><ChevronRight className="w-4 h-4" /></Button>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-sm mb-2">{format(currentDate, "MMMM yyyy")}</p>
            <div className="grid grid-cols-7 gap-1 text-xs text-center mb-2">
              {["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"].map(d => <div key={d}>{d}</div>)}
            </div>
            <div className="grid grid-cols-7 gap-1">
              {eachDayOfInterval({ start: startOfMonth(currentDate), end: endOfMonth(currentDate) }).map(date => {
                const dateStr = format(date, "yyyy-MM-dd");
                const isToday = isSameDay(date, new Date());
                const isFutureDate = isFuture(date);
                const hasActivity = medications.some(med => med.medication_logs.some(log => log.date_taken === dateStr));
                return (
                  <Button key={dateStr} size="sm" variant="ghost" disabled={isFutureDate}
                    className={`h-8 text-xs ${isToday ? "bg-blue-100 font-semibold" : ""} ${hasActivity && !isFutureDate ? "bg-green-50 border-green-200" : ""}`}
                    onClick={() => setSelectedDate(date)}>
                    {format(date, "d")}
                  </Button>
                );
              })}
            </div>
            {selectedDate && (
              <div className="mt-4 text-xs">
                <h4 className="font-semibold text-sm">{format(selectedDate, "MMMM d, yyyy")}</h4>
                {medications.map(med => {
                  const dateStr = format(selectedDate, "yyyy-MM-dd");
                  const log = med.medication_logs.find(log => log.date_taken === dateStr);
                  return (
                    <div key={med.id} className="flex justify-between mt-1">
                      <span className={`${log ? "text-green-600" : "text-muted-foreground"}`}>{med.name}</span>
                      {log && <Check className="w-3 h-3 text-green-600" />}
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

const StatCard = ({ label, value, icon, color }: { label: string; value: string | number; icon: any; color: string }) => (
  <Card className={`bg-gradient-to-br from-${color}-50 to-${color}-100 border-${color}-200`}>
    <CardContent className="flex items-center gap-4 p-6">
      <div className={`p-3 bg-${color}-500 rounded-full`}>{icon}</div>
      <div>
        <p className={`text-sm text-${color}-600`}>{label}</p>
        <p className={`text-2xl font-bold text-${color}-800`}>{value}</p>
      </div>
    </CardContent>
  </Card>
);
