import { useEffect, useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogDescription,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  medicationSchema,
  MedicationSchema,
} from "@/lib/validation/medicationSchema";
import { toast } from "sonner";
import { Users, Bell, Pencil, Trash2, Plus, Check, Eye } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

// Using built-in date formatting instead of date-fns
const format = (date: Date, formatStr: string) => {
  if (formatStr === "yyyy-MM-dd") {
    return date.toISOString().split('T')[0];
  }
  if (formatStr === "MMMM d, yyyy") {
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  }
  if (formatStr === "PP") {
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
  }
  return date.toLocaleDateString();
};
import type { MedicationWithLogs, CreateMedicationInput } from "@/lib/supabase";
import { MedicationService } from "@/lib/medicationService";

const CaretakerDashboard = () => {
  const [medications, setMedications] = useState<MedicationWithLogs[]>([]);
  const [editingMedication, setEditingMedication] =
    useState<MedicationWithLogs | null>(null);
  const [viewingMedication, setViewingMedication] =
    useState<MedicationWithLogs | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [unreadNotifications, setUnreadNotifications] = useState<any[]>([]);
  const [notificationDialogOpen, setNotificationDialogOpen] = useState(false);
  const [seenLogIds, setSeenLogIds] = useState<Set<string>>(new Set());
  const [lastSeenTime, setLastSeenTime] = useState<Date>(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [lastUpdateTime, setLastUpdateTime] = useState<Date | null>(null);
  const [notificationLastUpdated, setNotificationLastUpdated] = useState<Date | null>(null);
  const [activeTab, setActiveTab] = useState("overview");

  const [adherenceData, setAdherenceData] = useState({
    adherenceRate: 0,
    currentStreak: 0,
    missedDays: 0,
    takenDays: 0,
  });

  const form = useForm<MedicationSchema>({
    resolver: zodResolver(medicationSchema),
    defaultValues: { name: "", dosage: "", frequency: "", instructions: "" },
  });

  const loadData = async () => {
    try {
      const meds = await MedicationService.getMedications();
      setMedications(meds);
      setLastUpdateTime(new Date());

      const todayStr = format(new Date(), "yyyy-MM-dd");
      const newNotifications: any[] = [];

      meds.forEach((med) => {
        const logs = med.medication_logs.filter(
          (log) => log.date_taken === todayStr
        );
        
        logs.forEach((log) => {
          const logTime = new Date(log.created_at);
          // Only show notifications for logs created after last seen time
          if (logTime > lastSeenTime && !seenLogIds.has(log.id)) {
            newNotifications.push({
              id: log.id,
              type: "success",
              message: `${med.name} taken at ${logTime.toLocaleTimeString()}`,
              timestamp: logTime,
            });
            seenLogIds.add(log.id);
          }
        });
      });

      if (newNotifications.length > 0) {
        // Sort new notifications by timestamp (newest first)
        const sortedNew = newNotifications.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
        setNotifications((prev) => [...sortedNew, ...prev].slice(0, 10));
        setUnreadNotifications(sortedNew); // Only set new notifications as unread
        setSeenLogIds(new Set(seenLogIds));
        setNotificationLastUpdated(new Date());
      }
    } catch (err) {
      toast.error("Failed to load medications");
    }
  };

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 30000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (medications.length === 0) {
      setAdherenceData({
        adherenceRate: 0,
        currentStreak: 0,
        missedDays: 0,
        takenDays: 0,
      });
      return;
    }

    const today = new Date();
    let totalDoses = 0;
    let takenDoses = 0;
    let streak = 0;

    const allDates = new Set<string>();

    medications.forEach((med) => {
      const freq = med.frequency.toLowerCase();
      const perDay = freq.includes("four")
        ? 4
        : freq.includes("three")
        ? 3
        : freq.includes("twice")
        ? 2
        : 1;
      const createdDate = new Date(med.created_at);
      const daysSince =
        Math.floor(
          (today.getTime() - createdDate.getTime()) / (1000 * 60 * 60 * 24)
        ) + 1;

      for (let i = 0; i < daysSince; i++) {
        const date = new Date(createdDate);
        date.setDate(date.getDate() + i);
        const dateStr = format(date, "yyyy-MM-dd");
        allDates.add(dateStr);
        totalDoses += perDay;

        const taken = med.medication_logs.some(
          (log) => log.date_taken === dateStr
        );
        if (taken) {
          takenDoses += perDay;
        }
      }
    });

    // Streak: count how many previous days had logs from most recent to past
    const sortedDates = Array.from(allDates).sort((a, b) => b.localeCompare(a));
    for (const dateStr of sortedDates) {
      const dayTaken = medications.some((med) =>
        med.medication_logs.some((log) => log.date_taken === dateStr)
      );
      if (dayTaken) streak++;
      else break;
    }

    const adherenceRate =
      totalDoses > 0 ? Math.round((takenDoses / totalDoses) * 100) : 0;

    setAdherenceData({
      adherenceRate,
      takenDays: takenDoses,
      missedDays: totalDoses - takenDoses,
      currentStreak: streak,
    });
  }, [medications]);

  const onSubmit = async (data: MedicationSchema) => {
    try {
      const payload: CreateMedicationInput = {
        name: data.name,
        dosage: data.dosage,
        frequency: data.frequency,
        instructions: data.instructions ?? "",
      };

      if (editingMedication) {
        await MedicationService.updateMedication(editingMedication.id, payload);
        toast.success("Medication updated");
      } else {
        await MedicationService.createMedication(payload);
        toast.success("Medication created");
      }

      form.reset();
      setDialogOpen(false);
      setEditingMedication(null);
      loadData();
    } catch {
      toast.error("Error saving medication");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this medication?")) return;
    try {
      await MedicationService.deleteMedication(id);
      toast.success("Medication deleted");
      loadData();
    } catch {
      toast.error("Error deleting");
    }
  };

  const handleNotificationDialogOpen = (open: boolean) => {
    setNotificationDialogOpen(open);
    if (open) {
      // Mark all notifications as read when dialog opens
      setUnreadNotifications([]);
      setLastSeenTime(new Date()); // Update last seen time
    }
  };

  const clearAllNotifications = () => {
    setNotifications([]);
    setUnreadNotifications([]);
    setLastSeenTime(new Date()); // Reset last seen time
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-green-500 to-blue-500 rounded-2xl p-8 text-white">
        <div className="flex justify-between mb-6">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-white/20 rounded-xl flex items-center justify-center">
              <Users className="w-8 h-8" />
            </div>
            <div>
              <h2 className="text-3xl font-bold">Caretaker Dashboard</h2>
              <p className="text-white/90 text-lg">
                Monitoring medication adherence
              </p>
            </div>
          </div>
          <div className="flex items-center gap-4 text-sm">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-green-400 rounded-full" />
              Online
            </div>
            <div>Last update: {lastUpdateTime?.toLocaleTimeString()}</div>

            {/* Bell Icon */}
            <Dialog open={notificationDialogOpen} onOpenChange={handleNotificationDialogOpen}>
              <DialogTrigger asChild>
                <button className="relative">
                  <Bell className="w-6 h-6 text-white" />
                  {unreadNotifications.length > 0 && (
                    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs w-4 h-4 flex items-center justify-center rounded-full">
                      {unreadNotifications.length}
                    </span>
                  )}
                </button>
              </DialogTrigger>
              <DialogContent className="max-w-sm">
                <DialogHeader>
                  <DialogTitle>Recent Notifications</DialogTitle>
                  <DialogDescription>
                    Logs received in the last few refreshes.
                    {notificationLastUpdated && (
                      <div className="text-xs text-muted-foreground mt-1">
                        Last updated: {notificationLastUpdated.toLocaleTimeString()}
                      </div>
                    )}
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-2 text-sm max-h-64 overflow-y-auto">
                  {notifications.length === 0 ? (
                    <p className="text-muted-foreground">No new notifications.</p>
                  ) : (
                    // Sort notifications by timestamp (newest first) before displaying
                    notifications
                      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
                      .map((n) => (
                        <div key={n.id} className="flex items-center gap-2">
                          <div className="w-2 h-2 bg-green-500 rounded-full" />
                          {n.message}
                          <span className="ml-auto text-xs text-gray-500">
                            {n.timestamp.toLocaleTimeString()}
                          </span>
                        </div>
                      ))
                  )}
                </div>
                {notifications.length > 0 && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={clearAllNotifications}
                    className="mt-4 w-full"
                  >
                    Clear All
                  </Button>
                )}
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <MetricCard
            label="Adherence Rate"
            value={`${adherenceData.adherenceRate}%`}
          />
          <MetricCard
            label="Current Streak"
            value={adherenceData.currentStreak}
          />
          <MetricCard
            label="Missed Recently"
            value={adherenceData.missedDays}
          />
          <MetricCard label="Taken Recently" value={adherenceData.takenDays} />
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="w-full grid grid-cols-2 mb-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="activity">Recent Activity</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview">
          <div className="flex flex-col md:flex-row gap-6">
            <div className="flex-1 space-y-4">
              <Card>
                <CardHeader className="flex justify-between items-center">
                  <CardTitle>Medications</CardTitle>
                  <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                    <DialogTrigger asChild>
                      <Button
                        onClick={() => {
                          setEditingMedication(null);
                          form.reset();
                        }}
                      >
                        <Plus className="w-4 h-4 mr-2" /> Add Medication
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>
                          {editingMedication
                            ? "Edit Medication"
                            : "Add New Medication"}
                        </DialogTitle>
                        <DialogDescription>
                          Fill out the form below to{" "}
                          {editingMedication ? "update" : "create"} a
                          medication.
                        </DialogDescription>
                      </DialogHeader>

                      <div
                        onSubmit={form.handleSubmit(onSubmit)}
                        className="space-y-4"
                      >
                        <div>
                          <label className="text-sm font-medium">
                            Medication Name
                          </label>
                          <Input
                            placeholder="Enter medication name"
                            {...form.register("name")}
                            required
                          />
                        </div>

                        <div>
                          <label className="text-sm font-medium">Dosage</label>
                          <Input
                            placeholder="e.g., 1 tablet, 10mg"
                            {...form.register("dosage")}
                            required
                          />
                        </div>

                        <div>
                          <label className="text-sm font-medium">
                            Frequency
                          </label>
                          <Select
                            onValueChange={(value) =>
                              form.setValue("frequency", value)
                            }
                            value={form.watch("frequency")}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select frequency" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="once daily">
                                Once daily
                              </SelectItem>
                              <SelectItem value="twice daily">
                                Twice daily
                              </SelectItem>
                              <SelectItem value="three times a day">
                                Three times a day
                              </SelectItem>
                              <SelectItem value="four times a day">
                                Four times a day
                              </SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        <div>
                          <label className="text-sm font-medium">
                            Description (Optional)
                          </label>
                          <Input
                            placeholder="Additional notes about the medication"
                            {...form.register("instructions")}
                          />
                        </div>

                        <div className="flex justify-end gap-2 pt-2">
                          <Button
                            variant="outline"
                            type="button"
                            onClick={() => setDialogOpen(false)}
                          >
                            Cancel
                          </Button>
                          <Button onClick={form.handleSubmit(onSubmit)}>
                            {editingMedication ? "Update" : "Add Medication"}
                          </Button>
                        </div>
                      </div>
                    </DialogContent>
                  </Dialog>
                </CardHeader>
                <CardContent className="space-y-4">
                  {medications.map((med) => (
                    <div
                      key={med.id}
                      className="border rounded-lg p-3 flex justify-between items-center"
                    >
                      <div>
                        <div className="font-semibold">{med.name}</div>
                        <div className="text-sm text-muted-foreground">
                          {med.dosage} • {med.frequency}
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => setViewingMedication(med)}
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setEditingMedication(med);
                            setDialogOpen(true);
                            form.reset(med);
                          }}
                        >
                          <Pencil className="w-4 h-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => handleDelete(med.id)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>

            <div className="w-full md:w-80">
              <Card className="sticky top-4">
                <CardHeader>
                  <CardTitle>Calendar</CardTitle>
                </CardHeader>
                <CardContent>
                  <Calendar
                    mode="single"
                    selected={selectedDate}
                    onSelect={(d) => d && setSelectedDate(d)}
                  />
                  <div className="mt-4 text-xs">
                    <h4 className="font-semibold text-sm">
                      {format(selectedDate, "MMMM d, yyyy")}
                    </h4>
                    {medications.map((med) => {
                      const dateStr = format(selectedDate, "yyyy-MM-dd");
                      const log = med.medication_logs.find(
                        (log) => log.date_taken === dateStr
                      );
                      return (
                        <div key={med.id} className="mt-3 border-b pb-3">
                          <div className="flex justify-between items-center">
                            <span
                              className={`font-medium ${
                                log ? "text-green-600" : "text-muted-foreground"
                              }`}
                            >
                              {med.name}
                            </span>
                            {log && (
                              <Check className="w-4 h-4 text-green-600" />
                            )}
                          </div>
                          {log?.image_url && (
                            <img
                              src={log.image_url}
                              alt="Proof"
                              className="mt-2 w-32 rounded border"
                            />
                          )}
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        {/* Activity Tab */}
        <TabsContent value="activity">
          <Card className="border-blue-200 bg-blue-50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="w-5 h-5 text-blue-600" /> Recent Updates
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {notifications.length === 0 && (
                <p className="text-sm text-muted-foreground">
                  No recent activity yet.
                </p>
              )}
              {/* Sort notifications by timestamp (newest first) for activity tab */}
              {notifications
                .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
                .map((n) => (
                  <div key={n.id} className="flex items-center gap-2 text-sm">
                    <div className="w-2 h-2 rounded-full bg-green-500" />
                    {n.message}
                    <span className="text-xs text-gray-500 ml-auto">
                      {n.timestamp.toLocaleTimeString()}
                    </span>
                  </div>
                ))}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Eye Dialog */}
      {viewingMedication && (
        <Dialog
          open={!!viewingMedication}
          onOpenChange={() => setViewingMedication(null)}
        >
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Logs for: {viewingMedication.name}</DialogTitle>
              <DialogDescription>
                Review all the logs and proof of medication intake below.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-3 max-h-80 overflow-y-auto">
              {viewingMedication.medication_logs.length === 0 && (
                <p className="text-muted-foreground text-sm">
                  No logs available.
                </p>
              )}
              {viewingMedication.medication_logs
                .sort((a, b) => b.created_at.localeCompare(a.created_at))
                .map((log) => (
                  <div key={log.id} className="border rounded p-2 space-y-1">
                    <div className="text-sm font-medium">
                      📅 {format(new Date(log.date_taken), "PP")} at{" "}
                      {new Date(log.created_at).toLocaleTimeString()}
                    </div>
                    {log.image_url ? (
                      <img
                        src={log.image_url}
                        alt="Proof"
                        className="w-32 rounded border"
                      />
                    ) : (
                      <div className="text-xs text-muted-foreground">
                        No image uploaded.
                      </div>
                    )}
                  </div>
                ))}
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};

const MetricCard = ({
  label,
  value,
}: {
  label: string;
  value: string | number;
}) => (
  <div className="bg-white/10 rounded-xl p-4 backdrop-blur-sm text-white">
    <div className="text-2xl font-bold">{value}</div>
    <div className="text-white/80">{label}</div>
  </div>
);

export default CaretakerDashboard;