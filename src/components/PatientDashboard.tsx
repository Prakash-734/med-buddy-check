// src/components/PatientDashboard.tsx
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogDescription,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Plus,
  Pill,
  Calendar,
  TrendingUp,
  Clock,
  Check,
  Edit,
  Trash2,
  Upload,
  Image as ImageIcon,
  ChevronLeft,
  ChevronRight,
  X,
  Eye,
} from "lucide-react";
import {
  format,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  isSameMonth,
  isSameDay,
  addMonths,
  subMonths,
  parseISO,
  isAfter,
  isBefore,
} from "date-fns";
import { toast } from "sonner";
import { MedicationService } from "@/lib/medicationService";
import type { MedicationWithLogs, CreateMedicationInput } from "@/lib/supabase";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  medicationSchema,
  MedicationSchema,
} from "@/lib/validation/medicationSchema";



const PatientDashboard = () => {
  const [medications, setMedications] = useState<MedicationWithLogs[]>([]);
  const [monthlyAdherencePercentage, setMonthlyAdherencePercentage] =
    useState(0);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingMedication, setEditingMedication] =
    useState<MedicationWithLogs | null>(null);
  const [selectedImages, setSelectedImages] = useState<{ [key: string]: File }>(
    {}
  );
  const [imagePreviews, setImagePreviews] = useState<{ [key: string]: string }>(
    {}
  );
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [takingMedication, setTakingMedication] = useState<string | null>(null);
  const [viewingMedication, setViewingMedication] = useState<any>(null);
  const [uploadingImage, setUploadingImage] = useState<string | null>(null);

  const form = useForm<MedicationSchema>({
  resolver: zodResolver(medicationSchema),
  defaultValues: {
    name: "",
    dosage: "",
    frequency: "",
    instructions: "",
  },
});

  const today = format(new Date(), "yyyy-MM-dd");
  const todayDate = new Date();

  useEffect(() => {
    loadData();
  }, []);

  // Recalculate monthly adherence when calendar month changes
  useEffect(() => {
    if (medications.length > 0) {
      const monthlyAdherence = calculateMonthlyAdherence(
        medications,
        currentDate
      );
      setMonthlyAdherencePercentage(monthlyAdherence);
    }
  }, [currentDate, medications]);

  // Calculate monthly adherence percentage for the specified month
  const calculateMonthlyAdherence = (
    medications: MedicationWithLogs[],
    targetDate: Date = new Date()
  ) => {
    if (medications.length === 0) return 0;

    const monthStart = startOfMonth(targetDate);
    const monthEnd = endOfMonth(targetDate);
    const today = new Date();

    // Get all days in the target month up to today (don't count future days)
    const endDateForCalculation = isBefore(monthEnd, today) ? monthEnd : today;

    // If the target month is entirely in the future, return 0
    if (isAfter(monthStart, today)) {
      return 0;
    }

    const daysToConsider = eachDayOfInterval({
      start: monthStart,
      end: endDateForCalculation,
    });

    let totalExpectedDoses = 0;
    let totalTakenDoses = 0;

    medications.forEach((medication) => {
      const freq = medication.frequency.toLowerCase();
      let expectedPerDay = 1;

      if (freq.includes("twice")) expectedPerDay = 2;
      else if (freq.includes("three")) expectedPerDay = 3;
      else if (freq.includes("four")) expectedPerDay = 4;

      daysToConsider.forEach((day) => {
        const dayStr = format(day, "yyyy-MM-dd");
        totalExpectedDoses += expectedPerDay;

        const wasTaken = medication.medication_logs.some(
          (log) => log.date_taken === dayStr
        );
        if (wasTaken) {
          totalTakenDoses += expectedPerDay;
        }
      });
    });

    return totalExpectedDoses > 0
      ? Math.round((totalTakenDoses / totalExpectedDoses) * 100)
      : 0;
  };

  const loadData = async () => {
    try {
      setLoading(true);
      const medicationsData = await MedicationService.getMedications();
      setMedications(medicationsData);

      // Calculate monthly adherence for current month
      const monthlyAdherence = calculateMonthlyAdherence(
        medicationsData,
        currentDate
      );
      setMonthlyAdherencePercentage(monthlyAdherence);
    } catch (error) {
      console.error("Error loading data:", error);
      toast.error("Failed to load medications");
    } finally {
      setLoading(false);
    }
  };



const onSubmit = async (data: MedicationSchema) => {
  try {
    const payload: CreateMedicationInput = {
      name: data.name,
      dosage: data.dosage,
      frequency: data.frequency,
      instructions: data.instructions ?? "", // or remove this line if you want optional
    };

    if (editingMedication) {
      await MedicationService.updateMedication(editingMedication.id, payload);
      toast.success("Medication updated successfully");
    } else {
      await MedicationService.createMedication(payload);
      toast.success("Medication added successfully");
    }

    setDialogOpen(false);
    setEditingMedication(null);
    form.reset();
    loadData();
  } catch (error) {
    console.error("Error saving medication:", error);
    toast.error("Failed to save medication");
  }
};



  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this medication?")) return;

    try {
      await MedicationService.deleteMedication(id);
      toast.success("Medication deleted successfully");
      loadData();
    } catch (error) {
      console.error("Error deleting medication:", error);
      toast.error("Failed to delete medication");
    }
  };

  const handleImageChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    medicationId: string
  ) => {
    const file = e.target.files?.[0];
    if (file) {
      // Store the file
      setSelectedImages((prev) => ({ ...prev, [medicationId]: file }));

      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreviews((prev) => ({
          ...prev,
          [medicationId]: reader.result as string,
        }));
      };
      reader.readAsDataURL(file);
    }
  };

  const removeImage = (medicationId: string) => {
    setSelectedImages((prev) => {
      const newImages = { ...prev };
      delete newImages[medicationId];
      return newImages;
    });
    setImagePreviews((prev) => {
      const newPreviews = { ...prev };
      delete newPreviews[medicationId];
      return newPreviews;
    });
  };

  const handleMarkTaken = async (medicationId: string, date: string) => {
    // Prevent marking future dates
    const selectedDate = new Date(date);
    const today = new Date();
    today.setHours(23, 59, 59, 999); // Set to end of today

    if (isAfter(selectedDate, today)) {
      toast.error("Cannot mark future dates as taken");
      return;
    }

    try {
      setTakingMedication(medicationId);
      let imageUrl;

      // Upload image if selected (only for today's medication)
      if (date === format(new Date(), "yyyy-MM-dd")) {
        const imageFile = selectedImages[medicationId];

        if (imageFile) {
          const validTypes = ["image/jpeg", "image/png", "image/webp"];
          const maxSize = 2 * 1024 * 1024;

          if (!validTypes.includes(imageFile.type)) {
            toast.error("Only JPG, PNG, or WEBP files are allowed");
            return;
          }

          if (imageFile.size > maxSize) {
            toast.error("Image size must be less than 2MB");
            return;
          }

          setUploadingImage(medicationId);
          console.log("Uploading image...", imageFile);
          imageUrl = await MedicationService.uploadImage(imageFile);
          console.log("Image uploaded:", imageUrl);
          setUploadingImage(null);
        }
      }

      // Log medication with image URL
      await MedicationService.logMedicationTaken({
        medication_id: medicationId,
        date_taken: date,
        image_url: imageUrl,
      });

      toast.success(
        `Medication marked as taken for ${format(
          new Date(date),
          "MMM d, yyyy"
        )}`
      );

      // Clear the selected image and preview (only for today's medication)
      if (date === format(new Date(), "yyyy-MM-dd")) {
        removeImage(medicationId);
      }

      loadData();
    } catch (error) {
      console.error("Error marking medication as taken:", error);
      toast.error("Failed to mark medication as taken");
    } finally {
      setTakingMedication(null);
    }
  };

  const isMedicationTakenToday = (medication: MedicationWithLogs) => {
    return medication.medication_logs.some((log) => log.date_taken === today);
  };

  const isMedicationTakenOnDate = (
    medication: MedicationWithLogs,
    date: string
  ) => {
    return medication.medication_logs.some((log) => log.date_taken === date);
  };

  const getTodaysMedicationLog = (medication: MedicationWithLogs) => {
    return medication.medication_logs.find((log) => log.date_taken === today);
  };

  const handleViewTakenMedication = (medication: MedicationWithLogs) => {
    const todaysLog = getTodaysMedicationLog(medication);
    if (todaysLog) {
      setViewingMedication(todaysLog);
    }
  };

  const openAddDialog = () => {
  setEditingMedication(null);
  form.reset({
    name: "",
    dosage: "",
    frequency: "",
    instructions: "",
  }); // ✅ Clears form values
  setDialogOpen(true);
};

const openEditDialog = (medication: MedicationWithLogs) => {
  setEditingMedication(medication);
  form.reset({
    name: medication.name,
    dosage: medication.dosage,
    frequency: medication.frequency,
    instructions: medication.instructions || "",
  }); // ✅ Pre-fills form with selected medication
  setDialogOpen(true);
};


  // Calendar functions
  const getDaysInMonth = () => {
    const start = startOfMonth(currentDate);
    const end = endOfMonth(currentDate);
    return eachDayOfInterval({ start, end });
  };

  const navigateMonth = (direction: "prev" | "next") => {
    setCurrentDate((prev) =>
      direction === "prev" ? subMonths(prev, 1) : addMonths(prev, 1)
    );
  };

  const handleDateClick = (date: Date) => {
    setSelectedDate(date);
  };

  // Check if a date is in the future
  const isFutureDate = (date: Date) => {
    const today = new Date();
    today.setHours(23, 59, 59, 999);
    return isAfter(date, today);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="flex gap-6">
      {/* Main Content */}
      <div className="flex-1 space-y-6">
        {/* Header Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
            <CardContent className="flex items-center gap-4 p-6">
              <div className="p-3 bg-blue-500 rounded-full">
                <Pill className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="text-sm text-blue-600">Total Medications</p>
                <p className="text-2xl font-bold text-blue-800">
                  {medications.length}
                </p>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
            <CardContent className="flex items-center gap-4 p-6">
              <div className="p-3 bg-green-500 rounded-full">
                <TrendingUp className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="text-sm text-green-600">Monthly Adherence</p>
                <p className="text-2xl font-bold text-green-800">
                  {monthlyAdherencePercentage}%
                </p>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
            <CardContent className="flex items-center gap-4 p-6">
              <div className="p-3 bg-purple-500 rounded-full">
                <Calendar className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="text-sm text-purple-600">Today's Progress</p>
                <p className="text-2xl font-bold text-purple-800">
                  {medications.filter(isMedicationTakenToday).length}/
                  {medications.length}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Monthly Adherence Progress */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5" />
              Monthly Adherence Progress
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              {format(currentDate, "MMMM yyyy")} •
              {isSameMonth(currentDate, new Date())
                ? " Progress calculated up to today"
                : isAfter(currentDate, new Date())
                ? " Future month - no data available"
                : " Complete month data"}
            </p>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Adherence Rate</span>
                <span className="font-medium">
                  {monthlyAdherencePercentage}%
                </span>
              </div>
              <Progress value={monthlyAdherencePercentage} className="h-2" />
              {isAfter(currentDate, new Date()) && (
                <p className="text-xs text-muted-foreground">
                  Adherence data will be available as the month progresses
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Medications List */}
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle>My Medications</CardTitle>
              <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <DialogTrigger asChild>
                  <Button
                    onClick={openAddDialog}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Add Medication
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[500px]">
                  <DialogHeader>
                    <DialogTitle>
                      {editingMedication
                        ? "Edit Medication"
                        : "Add New Medication"}
                    </DialogTitle>
                    <DialogDescription>
                      Enter details of your medication including dosage,
                      frequency, and optional instructions.
                    </DialogDescription>
                  </DialogHeader>

                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">

                    <div className="space-y-2">
                      <Label htmlFor="name">Medication Name</Label>
                      <Input
  id="name"
  placeholder="e.g., Aspirin"
  {...form.register("name")}
  required
/>

        
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="dosage">Dosage</Label>
                      <Input
  id="dosage"
  placeholder="e.g., 100mg"
  {...form.register("dosage")}
  required
/>

                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="frequency">Frequency</Label>
                      <Select onValueChange={(value) => form.setValue("frequency", value)}>

                        <SelectTrigger>
                          <SelectValue placeholder="Select frequency" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Once daily">Once daily</SelectItem>
                          <SelectItem value="Twice daily">
                            Twice daily
                          </SelectItem>
                          <SelectItem value="Three times daily">
                            Three times daily
                          </SelectItem>
                          <SelectItem value="Four times daily">
                            Four times daily
                          </SelectItem>
                          <SelectItem value="As needed">As needed</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="instructions">
                        Instructions (Optional)
                      </Label>
                      <Textarea
  id="instructions"
  {...form.register("instructions")}
  placeholder="e.g., Take with food"
  rows={3}
/>

                    </div>
                    <div className="flex justify-end gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setDialogOpen(false)}
                      >
                        Cancel
                      </Button>
                      <Button
                        type="submit"
                        className="bg-blue-600 hover:bg-blue-700"
                      >
                        {editingMedication ? "Update" : "Add"} Medication
                      </Button>
                    </div>
                  </form>
                </DialogContent>
              </Dialog>
            </div>
          </CardHeader>
          <CardContent>
            {medications.length === 0 ? (
              <div className="text-center py-8">
                <Pill className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">
                  No medications added yet.
                </p>
                <p className="text-sm text-muted-foreground">
                  Click "Add Medication" to get started.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {medications.map((medication) => {
                  const isTaken = isMedicationTakenToday(medication);
                  const isLoading = takingMedication === medication.id;
                  const hasImage = imagePreviews[medication.id];

                  return (
                    <Card
                      key={medication.id}
                      className={`transition-all ${
                        isTaken
                          ? "bg-green-50 border-green-200"
                          : "hover:shadow-md"
                      }`}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div
                              className={`w-10 h-10 rounded-full flex items-center justify-center ${
                                isTaken ? "bg-green-500" : "bg-blue-100"
                              }`}
                            >
                              {isTaken ? (
                                <Check className="w-5 h-5 text-white" />
                              ) : (
                                <Pill className="w-5 h-5 text-blue-600" />
                              )}
                            </div>
                            <div>
                              <h3 className="font-semibold">
                                {medication.name}
                              </h3>
                              <p className="text-sm text-muted-foreground">
                                {medication.dosage} • {medication.frequency}
                              </p>
                              {medication.instructions && (
                                <p className="text-xs text-muted-foreground mt-1">
                                  {medication.instructions}
                                </p>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            {isTaken ? (
                              <div className="flex items-center gap-2">
                                <Badge
                                  variant="secondary"
                                  className="bg-green-100 text-green-800"
                                >
                                  <Check className="w-3 h-3 mr-1" />
                                  Taken Today
                                </Badge>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() =>
                                    handleViewTakenMedication(medication)
                                  }
                                  className="hover:bg-blue-50 hover:text-blue-600 hover:border-blue-200"
                                  title="View taken medication details"
                                >
                                  <Eye className="w-4 h-4" />
                                </Button>
                              </div>
                            ) : (
                              <div className="flex items-center gap-2">
                                {/* Image Upload Section */}
                                <div className="flex items-center gap-2">
                                  {!hasImage ? (
                                    <div className="flex items-center gap-2 p-2 border rounded-lg bg-gray-50">
                                      <Label
                                        htmlFor={`image-${medication.id}`}
                                        className="cursor-pointer"
                                      >
                                        <div className="flex items-center gap-1 text-xs text-gray-600">
                                          <ImageIcon className="w-3 h-3" />
                                          Add Photo
                                        </div>
                                      </Label>
                                      <Input
                                        id={`image-${medication.id}`}
                                        type="file"
                                        accept="image/*"
                                        onChange={(e) =>
                                          handleImageChange(e, medication.id)
                                        }
                                        className="hidden"
                                      />
                                    </div>
                                  ) : (
                                    <div className="relative">
                                      <div className="w-12 h-12 rounded border overflow-hidden">
                                        <img
                                          src={imagePreviews[medication.id]}
                                          alt="Preview"
                                          className="w-full h-full object-cover"
                                        />
                                      </div>
                                      <Button
                                        size="sm"
                                        variant="ghost"
                                        className="absolute -top-2 -right-2 h-6 w-6 rounded-full bg-red-500 hover:bg-red-600 text-white p-0"
                                        onClick={() =>
                                          removeImage(medication.id)
                                        }
                                      >
                                        <X className="w-3 h-3" />
                                      </Button>
                                    </div>
                                  )}
                                </div>

                                <Button
                                  size="sm"
                                  onClick={() =>
                                    handleMarkTaken(medication.id, today)
                                  }
                                  className="bg-green-600 hover:bg-green-700"
                                  disabled={
                                    isLoading ||
                                    uploadingImage === medication.id
                                  }
                                >
                                  {isLoading ? (
                                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-1"></div>
                                  ) : (
                                    <Check className="w-4 h-4 mr-1" />
                                  )}
                                  Mark Taken
                                </Button>
                              </div>
                            )}
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => openEditDialog(medication)}
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleDelete(medication.id)}
                              className="hover:bg-red-50 hover:text-red-600 hover:border-red-200"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Mini Calendar Sidebar */}
      <div className="w-80">
        <Card className="sticky top-4">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">Calendar</CardTitle>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => navigateMonth("prev")}
                >
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => navigateMonth("next")}
                >
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
            <p className="text-sm text-muted-foreground">
              {format(currentDate, "MMMM yyyy")}
            </p>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-7 gap-1 mb-4">
              {["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"].map((day) => (
                <div
                  key={day}
                  className="text-center text-xs font-medium text-muted-foreground p-2"
                >
                  {day}
                </div>
              ))}
            </div>
            <div className="grid grid-cols-7 gap-1">
              {getDaysInMonth().map((date) => {
                const dateStr = format(date, "yyyy-MM-dd");
                const isToday = isSameDay(date, todayDate);
                const isSelected =
                  selectedDate && isSameDay(date, selectedDate);
                const isFuture = isFutureDate(date);
                const medicationsTaken = medications.filter((med) =>
                  isMedicationTakenOnDate(med, dateStr)
                ).length;
                const hasActivity = medicationsTaken > 0;

                return (
                  <Button
                    key={date.toString()}
                    variant={isSelected ? "default" : "ghost"}
                    size="sm"
                    className={`
                      h-8 p-0 text-xs relative
                      ${
                        isToday ? "bg-blue-100 text-blue-800 font-semibold" : ""
                      }
                      ${isFuture ? "text-gray-400 cursor-not-allowed" : ""}
                      ${
                        hasActivity && !isFuture
                          ? "bg-green-50 border-green-200"
                          : ""
                      }
                      ${isSelected ? "bg-blue-600 text-white" : ""}
                    `}
                    onClick={() => handleDateClick(date)}
                    disabled={isFuture}
                  >
                    {format(date, "d")}
                    {hasActivity && !isFuture && (
                      <div className="absolute -top-1 -right-1 w-2 h-2 bg-green-500 rounded-full"></div>
                    )}
                  </Button>
                );
              })}
            </div>

            {/* Selected Date Info */}
            {selectedDate && (
              <div className="mt-4 space-y-2">
                <h4 className="font-semibold text-sm">
                  {format(selectedDate, "MMMM d, yyyy")}
                  {isFutureDate(selectedDate) && (
                    <span className="text-xs text-gray-500 ml-2">(Future)</span>
                  )}
                </h4>
                <div className="space-y-1">
                  {medications.map((medication) => {
                    const dateStr = format(selectedDate, "yyyy-MM-dd");
                    const isTaken = isMedicationTakenOnDate(
                      medication,
                      dateStr
                    );
                    const medicationLog = medication.medication_logs.find(
                      (log) => log.date_taken === dateStr
                    );
                    const isFuture = isFutureDate(selectedDate);
                    const isLoadingThis = takingMedication === medication.id;

                    return (
                      <div
                        key={medication.id}
                        className="flex items-center justify-between text-xs"
                      >
                        <div className="flex items-center gap-2 flex-1">
                          <span
                            className={`cursor-pointer hover:underline ${
                              isTaken
                                ? "text-green-600"
                                : isFuture
                                ? "text-gray-400"
                                : "text-muted-foreground"
                            }`}
                            onClick={() =>
                              isTaken &&
                              medicationLog &&
                              setViewingMedication(medicationLog)
                            }
                          >
                            {medication.name}
                          </span>
                          {isTaken && (
                            <Check className="w-3 h-3 text-green-600" />
                          )}
                          {isFuture && !isTaken && (
                            <span className="text-gray-400">-</span>
                          )}
                        </div>
                        {!isTaken && !isFuture && (
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-5 px-2 text-xs text-green-600 hover:bg-green-50"
                            onClick={() =>
                              handleMarkTaken(medication.id, dateStr)
                            }
                            disabled={uploadingImage === medication.id}
                          >
                            {isLoadingThis ? (
                              <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-green-600"></div>
                            ) : (
                              "Mark Taken"
                            )}
                          </Button>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Medication Details Modal */}
        <Dialog
          open={!!viewingMedication}
          onOpenChange={() => setViewingMedication(null)}
        >
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Medication Details</DialogTitle>
              <DialogDescription>
                View date, time and photo of the medication taken.
              </DialogDescription>
            </DialogHeader>

            {viewingMedication && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Medication</p>
                    <p className="font-semibold">
                      {
                        medications.find(
                          (m) => m.id === viewingMedication.medication_id
                        )?.name
                      }
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Date Taken</p>
                    <p className="font-semibold">
                      {format(
                        parseISO(viewingMedication.date_taken),
                        "MMM d, yyyy"
                      )}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Time Logged</p>
                    <p className="font-semibold">
                      {format(parseISO(viewingMedication.created_at), "h:mm a")}
                    </p>
                  </div>
                </div>

                {viewingMedication.image_url && (
                  <div>
                    <p className="text-sm text-muted-foreground mb-2">Photo</p>
                    <div className="w-full max-w-md">
                      <img
                        src={viewingMedication.image_url}
                        alt="Medication photo"
                        className="w-full h-auto rounded-lg border"
                      />
                    </div>
                  </div>
                )}

                <div className="flex justify-end">
                  <Button
                    variant="outline"
                    onClick={() => setViewingMedication(null)}
                  >
                    Close
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};

export default PatientDashboard;
