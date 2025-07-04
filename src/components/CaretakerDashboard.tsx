import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Calendar } from "@/components/ui/calendar";
import { Users, Bell, Calendar as CalendarIcon, Mail, AlertTriangle, Check, Clock, Camera, Activity } from "lucide-react";

// Mock real-time data store (in a real app, this would be a database/API)
const mockDataStore = {
  patientData: {
    name: "Eleanor Thompson",
    id: "patient_001",
    medications: [
      { id: "med_1", name: "Morning Pills", scheduledTime: "08:00", taken: false, takenTime: null, hasPhoto: false }
    ],
    adherenceHistory: new Map(),
    lastUpdate: new Date().toISOString(),
    isOnline: true
  },
  
  // Simulate patient taking medication
  simulatePatientAction: function(action) {
    const today = new Date().toISOString().split('T')[0];
    const now = new Date();
    
    if (action === 'take_medication') {
      this.patientData.medications[0].taken = true;
      this.patientData.medications[0].takenTime = now.toLocaleTimeString();
      this.patientData.medications[0].hasPhoto = Math.random() > 0.5; // Random photo
      this.patientData.adherenceHistory.set(today, {
        taken: true,
        time: now.toLocaleTimeString(),
        hasPhoto: this.patientData.medications[0].hasPhoto
      });
    } else if (action === 'miss_medication') {
      this.patientData.medications[0].taken = false;
      this.patientData.medications[0].takenTime = null;
      this.patientData.adherenceHistory.set(today, {
        taken: false,
        time: null,
        hasPhoto: false
      });
    }
    
    this.patientData.lastUpdate = now.toISOString();
    
    // Notify all listeners
    this.listeners.forEach(callback => callback(this.patientData));
  },
  
  listeners: [],
  
  subscribe: function(callback) {
    this.listeners.push(callback);
    return () => {
      this.listeners = this.listeners.filter(cb => cb !== callback);
    };
  }
};

// Initialize some mock history data
const initializeMockData = () => {
  const today = new Date();
  for (let i = 1; i <= 7; i++) {
    const date = new Date(today);
    date.setDate(today.getDate() - i);
    const dateStr = date.toISOString().split('T')[0];
    const wasTaken = Math.random() > 0.3; // 70% adherence rate
    
    mockDataStore.patientData.adherenceHistory.set(dateStr, {
      taken: wasTaken,
      time: wasTaken ? "8:30 AM" : null,
      hasPhoto: wasTaken ? Math.random() > 0.5 : false
    });
  }
};

initializeMockData();

const CaretakerDashboard = () => {
  const [activeTab, setActiveTab] = useState("overview");
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [patientData, setPatientData] = useState(mockDataStore.patientData);
  const [lastUpdateTime, setLastUpdateTime] = useState(new Date());
  const [notifications, setNotifications] = useState([]);

  // Real-time updates subscription
  useEffect(() => {
    const unsubscribe = mockDataStore.subscribe((updatedData) => {
      setPatientData({ ...updatedData });
      setLastUpdateTime(new Date());
      
      // Add notification for medication taken
      if (updatedData.medications[0].taken) {
        setNotifications(prev => [
          {
            id: Date.now(),
            type: 'success',
            message: `${updatedData.name} took their medication at ${updatedData.medications[0].takenTime}`,
            timestamp: new Date()
          },
          ...prev.slice(0, 4) // Keep only last 5 notifications
        ]);
      }
    });

    return unsubscribe;
  }, []);

  // Simulate real-time updates every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      // Simulate patient status changes
      const random = Math.random();
      if (random < 0.1) { // 10% chance of taking medication
        mockDataStore.simulatePatientAction('take_medication');
      }
      
      // Update online status randomly
      mockDataStore.patientData.isOnline = Math.random() > 0.1; // 90% online
      setPatientData({ ...mockDataStore.patientData });
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  // Calculate adherence metrics
  const calculateAdherenceMetrics = () => {
    const history = Array.from(patientData.adherenceHistory.values());
    const totalDays = history.length;
    const takenDays = history.filter(day => day.taken).length;
    const adherenceRate = totalDays > 0 ? Math.round((takenDays / totalDays) * 100) : 0;
    
    // Calculate current streak
    let currentStreak = 0;
    const sortedDates = Array.from(patientData.adherenceHistory.keys()).sort().reverse();
    
    for (const date of sortedDates) {
      if (patientData.adherenceHistory.get(date)?.taken) {
        currentStreak++;
      } else {
        break;
      }
    }

    return {
      adherenceRate,
      currentStreak,
      totalDays,
      takenDays,
      missedDays: totalDays - takenDays
    };
  };

  const metrics = calculateAdherenceMetrics();

  // Get recent activity
  const getRecentActivity = () => {
    const sortedEntries = Array.from(patientData.adherenceHistory.entries())
      .sort(([a], [b]) => new Date(b).getTime() - new Date(a).getTime())
      .slice(0, 5);

    return sortedEntries.map(([date, data]) => ({
      date,
      taken: data.taken,
      time: data.time,
      hasPhoto: data.hasPhoto
    }));
  };

  const recentActivity = getRecentActivity();

  // Handle actions
  const handleSendReminderEmail = () => {
    setNotifications(prev => [
      {
        id: Date.now(),
        type: 'info',
        message: `Reminder email sent to ${patientData.name}`,
        timestamp: new Date()
      },
      ...prev.slice(0, 4)
    ]);
  };

  const handleManualUpdate = () => {
    // Simulate forcing a data refresh
    mockDataStore.patientData.lastUpdate = new Date().toISOString();
    setPatientData({ ...mockDataStore.patientData });
    setLastUpdateTime(new Date());
  };

  // Simulate patient actions (for demo purposes)
  const simulateTakeMedication = () => {
    mockDataStore.simulatePatientAction('take_medication');
  };

  const simulateMissMedication = () => {
    mockDataStore.simulatePatientAction('miss_medication');
  };

  const today = new Date().toISOString().split('T')[0];
  const todayStatus = patientData.adherenceHistory.get(today) || { taken: false };

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div className="bg-gradient-to-r from-green-500 to-blue-500 rounded-2xl p-8 text-white">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-white/20 rounded-xl flex items-center justify-center">
              <Users className="w-8 h-8" />
            </div>
            <div>
              <h2 className="text-3xl font-bold">Caretaker Dashboard</h2>
              <p className="text-white/90 text-lg">Monitoring {patientData.name}'s medication adherence</p>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <div className={`w-3 h-3 rounded-full ${patientData.isOnline ? 'bg-green-400' : 'bg-red-400'}`}></div>
              <span className="text-sm">{patientData.isOnline ? 'Online' : 'Offline'}</span>
            </div>
            <div className="text-sm">
              Last update: {lastUpdateTime.toLocaleTimeString()}
            </div>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white/10 rounded-xl p-4 backdrop-blur-sm">
            <div className="text-2xl font-bold">{metrics.adherenceRate}%</div>
            <div className="text-white/80">Adherence Rate</div>
          </div>
          <div className="bg-white/10 rounded-xl p-4 backdrop-blur-sm">
            <div className="text-2xl font-bold">{metrics.currentStreak}</div>
            <div className="text-white/80">Current Streak</div>
          </div>
          <div className="bg-white/10 rounded-xl p-4 backdrop-blur-sm">
            <div className="text-2xl font-bold">{metrics.missedDays}</div>
            <div className="text-white/80">Missed Recently</div>
          </div>
          <div className="bg-white/10 rounded-xl p-4 backdrop-blur-sm">
            <div className="text-2xl font-bold">{metrics.takenDays}</div>
            <div className="text-white/80">Taken Recently</div>
          </div>
        </div>
      </div>

      {/* Real-time Notifications */}
      {notifications.length > 0 && (
        <Card className="border-blue-200 bg-blue-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="w-5 h-5 text-blue-600" />
              Recent Updates
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {notifications.slice(0, 3).map((notification) => (
                <div key={notification.id} className="flex items-center gap-3 p-2 bg-white rounded-lg">
                  <div className={`w-2 h-2 rounded-full ${
                    notification.type === 'success' ? 'bg-green-500' : 'bg-blue-500'
                  }`}></div>
                  <span className="text-sm">{notification.message}</span>
                  <span className="text-xs text-gray-500 ml-auto">
                    {notification.timestamp.toLocaleTimeString()}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Main Content Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="activity">Recent Activity</TabsTrigger>
          <TabsTrigger value="calendar">Calendar View</TabsTrigger>
          <TabsTrigger value="controls">Controls</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid lg:grid-cols-2 gap-6">
            {/* Today's Status */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CalendarIcon className="w-5 h-5 text-blue-600" />
                  Today's Status
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between p-3 bg-accent/50 rounded-lg">
                  <div>
                    <h4 className="font-medium">{patientData.medications[0].name}</h4>
                    <p className="text-sm text-muted-foreground">
                      Scheduled: {patientData.medications[0].scheduledTime}
                    </p>
                    {todayStatus.taken && (
                      <p className="text-sm text-green-600">
                        Taken: {todayStatus.time}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    {todayStatus.hasPhoto && (
                      <Badge variant="outline">
                        <Camera className="w-3 h-3 mr-1" />
                        Photo
                      </Badge>
                    )}
                    <Badge variant={todayStatus.taken ? "secondary" : "destructive"}>
                      {todayStatus.taken ? "Completed" : "Pending"}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button 
                  className="w-full justify-start" 
                  variant="outline"
                  onClick={handleSendReminderEmail}
                >
                  <Mail className="w-4 h-4 mr-2" />
                  Send Reminder Email
                </Button>
                <Button 
                  className="w-full justify-start" 
                  variant="outline"
                  onClick={handleManualUpdate}
                >
                  <Activity className="w-4 h-4 mr-2" />
                  Refresh Data
                </Button>
                <Button 
                  className="w-full justify-start" 
                  variant="outline"
                  onClick={() => setActiveTab("calendar")}
                >
                  <CalendarIcon className="w-4 h-4 mr-2" />
                  View Full Calendar
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Adherence Progress */}
          <Card>
            <CardHeader>
              <CardTitle>Adherence Progress</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex justify-between text-sm">
                  <span>Overall Progress</span>
                  <span>{metrics.adherenceRate}%</span>
                </div>
                <Progress value={metrics.adherenceRate} className="h-3" />
                <div className="grid grid-cols-3 gap-4 text-center text-sm">
                  <div>
                    <div className="font-medium text-green-600">{metrics.takenDays} days</div>
                    <div className="text-muted-foreground">Taken</div>
                  </div>
                  <div>
                    <div className="font-medium text-red-600">{metrics.missedDays} days</div>
                    <div className="text-muted-foreground">Missed</div>
                  </div>
                  <div>
                    <div className="font-medium text-blue-600">{metrics.currentStreak} days</div>
                    <div className="text-muted-foreground">Current Streak</div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="activity" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Recent Medication Activity</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentActivity.map((activity, index) => (
                  <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                        activity.taken ? 'bg-green-100' : 'bg-red-100'
                      }`}>
                        {activity.taken ? (
                          <Check className="w-5 h-5 text-green-600" />
                        ) : (
                          <AlertTriangle className="w-5 h-5 text-red-600" />
                        )}
                      </div>
                      <div>
                        <p className="font-medium">
                          {new Date(activity.date).toLocaleDateString('en-US', { 
                            weekday: 'long', 
                            month: 'long', 
                            day: 'numeric' 
                          })}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {activity.taken ? `Taken at ${activity.time}` : 'Medication missed'}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {activity.hasPhoto && (
                        <Badge variant="outline">
                          <Camera className="w-3 h-3 mr-1" />
                          Photo
                        </Badge>
                      )}
                      <Badge variant={activity.taken ? "secondary" : "destructive"}>
                        {activity.taken ? "Completed" : "Missed"}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="calendar" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Medication Calendar Overview</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid lg:grid-cols-2 gap-6">
                <div>
                  <Calendar
                    mode="single"
                    selected={selectedDate}
                    onSelect={(date) => date && setSelectedDate(date)}
                    className="w-full"
                  />
                  
                  <div className="mt-4 space-y-2 text-sm">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                      <span>Medication taken</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 bg-red-400 rounded-full"></div>
                      <span>Missed medication</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                      <span>Today</span>
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="font-medium mb-4">
                    Details for {selectedDate.toLocaleDateString()}
                  </h4>
                  
                  <div className="space-y-4">
                    {(() => {
                      const dateStr = selectedDate.toISOString().split('T')[0];
                      const dayData = patientData.adherenceHistory.get(dateStr);
                      const isToday = dateStr === today;
                      const isPast = new Date(dateStr) < new Date(today);
                      
                      if (dayData?.taken) {
                        return (
                          <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                            <div className="flex items-center gap-2 mb-2">
                              <Check className="w-5 h-5 text-green-600" />
                              <span className="font-medium text-green-800">Medication Taken</span>
                            </div>
                            <p className="text-sm text-green-700">
                              {patientData.name} took their medication at {dayData.time}
                            </p>
                            {dayData.hasPhoto && (
                              <Badge variant="outline" className="mt-2">
                                <Camera className="w-3 h-3 mr-1" />
                                Photo verification available
                              </Badge>
                            )}
                          </div>
                        );
                      } else if (dayData && !dayData.taken) {
                        return (
                          <div className="p-4 bg-red-50 rounded-lg border border-red-200">
                            <div className="flex items-center gap-2 mb-2">
                              <AlertTriangle className="w-5 h-5 text-red-600" />
                              <span className="font-medium text-red-800">Medication Missed</span>
                            </div>
                            <p className="text-sm text-red-700">
                              {patientData.name} did not take their medication on this day.
                            </p>
                          </div>
                        );
                      } else if (isToday) {
                        return (
                          <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                            <div className="flex items-center gap-2 mb-2">
                              <Clock className="w-5 h-5 text-blue-600" />
                              <span className="font-medium text-blue-800">Today - Pending</span>
                            </div>
                            <p className="text-sm text-blue-700">
                              Waiting for {patientData.name} to take their medication.
                            </p>
                          </div>
                        );
                      } else {
                        return (
                          <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                            <div className="flex items-center gap-2 mb-2">
                              <CalendarIcon className="w-5 h-5 text-gray-600" />
                              <span className="font-medium text-gray-800">
                                {isPast ? 'No Data' : 'Future Date'}
                              </span>
                            </div>
                            <p className="text-sm text-gray-700">
                              {isPast ? 'No medication data available for this date.' : 'This date is in the future.'}
                            </p>
                          </div>
                        );
                      }
                    })()}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="controls" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Demo Controls</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Use these controls to simulate patient actions and see real-time updates:
              </p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Button 
                  onClick={simulateTakeMedication}
                  className="w-full"
                  variant="outline"
                >
                  <Check className="w-4 h-4 mr-2" />
                  Simulate: Take Medication
                </Button>
                
                <Button 
                  onClick={simulateMissMedication}
                  className="w-full"
                  variant="outline"
                >
                  <AlertTriangle className="w-4 h-4 mr-2" />
                  Simulate: Miss Medication
                </Button>
              </div>
              
              <div className="mt-6 p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                <h4 className="font-medium text-yellow-800 mb-2">Real-time Features:</h4>
                <ul className="text-sm text-yellow-700 space-y-1">
                  <li>• Automatic updates every 30 seconds</li>
                  <li>• Real-time adherence calculations</li>
                  <li>• Live notification system</li>
                  <li>• Patient online/offline status</li>
                  <li>• Instant calendar updates</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default CaretakerDashboard;