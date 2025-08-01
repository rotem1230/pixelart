import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Clock, Users, Eye, EyeOff } from 'lucide-react';
import { User } from '@/api/entities';
import { WorkHours } from '@/api/entities';
import { Event } from '@/api/entities';
import { differenceInMinutes, format } from 'date-fns';

export default function AdminTimerOverview({ currentUser }) {
  const [activeTimers, setActiveTimers] = useState([]);
  const [isExpanded, setIsExpanded] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    loadActiveTimers();
    
    // Update current time every second and recalculate elapsed times
    const timeInterval = setInterval(() => {
      const newTime = new Date();
      setCurrentTime(newTime);
      
      // Update elapsed seconds for all active timers
      setActiveTimers(prevTimers => 
        prevTimers.map(timer => ({
          ...timer,
          elapsedSeconds: Math.floor((newTime - timer.startTime) / 1000)
        }))
      );
    }, 1000);
    
    const dataInterval = setInterval(() => {
      loadActiveTimers(); // Refresh data every 30 seconds
    }, 30000);

    // Listen for localStorage changes to update in real-time
    const handleStorageChange = (e) => {
      if (e.key === 'currentUser' || e.key === 'systemUsers' || e.key === 'workHours') {
        console.log('Storage changed, reloading timers:', e.key);
        loadActiveTimers();
      }
    };

    window.addEventListener('storage', handleStorageChange);

    return () => {
      clearInterval(timeInterval);
      clearInterval(dataInterval);
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  const loadActiveTimers = async () => {
    try {
      console.log('Loading active timers...');
      console.log('Current user role:', currentUser?.role);
      
      // Get users from localStorage (systemUsers) - this is the most up-to-date source
      let users = [];
      try {
        const systemUsers = localStorage.getItem('systemUsers');
        if (systemUsers) {
          users = JSON.parse(systemUsers);
          console.log('Users from localStorage:', users);
        }
      } catch (localStorageError) {
        console.error('Could not load users from localStorage:', localStorageError);
        return; // Don't continue without user data
      }
      
      // If no users from localStorage, try API
      if (users.length === 0) {
        try {
          users = await User.getAll();
          console.log('Users from API:', users);
        } catch (apiError) {
          console.error('Could not load users from API:', apiError);
          return; // Don't continue without user data
        }
      }

      // Get work hours and events - these are required for accurate timer data
      const [workHours, events] = await Promise.all([
        WorkHours.getAll(),
        Event.getAll()
      ]);

      console.log('Work hours loaded:', workHours.length);
      console.log('Events loaded:', events.length);
      
      // Filter users with active timers - must have both timer ID and event name
      const activeUsers = users.filter(user => 
        user.active_timer_id && 
        user.active_timer_event_name
      );
      console.log('Active users found:', activeUsers.length);
      console.log('Active users details:', activeUsers.map(u => ({
        name: u.full_name || u.name,
        active_timer_id: u.active_timer_id,
        active_timer_event_name: u.active_timer_event_name
      })));
      
      const timersWithDetails = [];
      
      for (const user of activeUsers) {
        // Find the work hour entry - this is REQUIRED for accurate timing
        const workHour = workHours.find(wh => wh.id === user.active_timer_id);
        
        if (!workHour) {
          console.error(`No work hour found for user ${user.full_name || user.name} with timer ID ${user.active_timer_id}`);
          continue; // Skip this user if no work hour found
        }
        
        if (!workHour.date || !workHour.start_time) {
          console.error(`Invalid work hour data for user ${user.full_name || user.name}:`, workHour);
          continue; // Skip this user if work hour data is invalid
        }
        
        console.log(`Valid work hour found for user ${user.full_name || user.name}:`, workHour);
        
        // Calculate accurate elapsed time
        const startTime = new Date(`${workHour.date}T${workHour.start_time}`);
        const elapsedSeconds = Math.floor((currentTime - startTime) / 1000);
        
        if (elapsedSeconds < 0) {
          console.error(`Invalid elapsed time for user ${user.full_name || user.name}: ${elapsedSeconds} seconds`);
          continue; // Skip if time calculation is invalid
        }
        
        // Find related event or task
        let relatedItem = null;
        let itemName = user.active_timer_event_name;
        
        // Check if it's a task timer (starts with "משימה:")
        if (!itemName.startsWith('משימה:') && user.active_timer_event_id) {
          // It's an event timer, try to find the event
          relatedItem = events.find(e => e.id === user.active_timer_event_id);
          if (relatedItem) {
            itemName = relatedItem.name;
          }
        }
        
        timersWithDetails.push({
          user,
          event: relatedItem,
          workHour,
          elapsedSeconds,
          startTime,
          itemName
        });
      }

      console.log('Valid timers with details:', timersWithDetails.length);
      setActiveTimers(timersWithDetails);
    } catch (error) {
      console.error('Error loading active timers:', error);
      setActiveTimers([]); // Clear timers on error, no fallback
    }
  };

  const formatElapsedTime = (seconds) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const stopUserTimer = async (timerData) => {
    if (!confirm(`האם אתה בטוח שברצונך לעצור את הטיימר של ${timerData.user.full_name || timerData.user.name}?`)) {
      return;
    }

    try {
      const endTime = new Date();
      const totalMinutes = differenceInMinutes(endTime, timerData.startTime);
      const hoursWorked = totalMinutes / 60;

      // Update work hour entry
      await WorkHours.update(timerData.workHour.id, {
        end_time: format(endTime, 'HH:mm:ss'),
        hours_worked: parseFloat(hoursWorked.toFixed(2)),
        status: 'נרשם'
      });

      // Update user to clear active timer
      const updatedUser = {
        ...timerData.user,
        active_timer_id: null,
        active_timer_event_id: null,
        active_timer_event_name: null
      };

      await User.update(timerData.user.id, updatedUser);

      // Update localStorage systemUsers
      try {
        const systemUsers = JSON.parse(localStorage.getItem('systemUsers') || '[]');
        const updatedSystemUsers = systemUsers.map(u => {
          if (u.id === timerData.user.id || u.email === timerData.user.email) {
            return { ...u, ...updatedUser };
          }
          return u;
        });
        localStorage.setItem('systemUsers', JSON.stringify(updatedSystemUsers));
        
        // Trigger storage event
        window.dispatchEvent(new StorageEvent('storage', {
          key: 'systemUsers',
          newValue: JSON.stringify(updatedSystemUsers)
        }));
      } catch (error) {
        console.warn('Could not update systemUsers:', error);
      }

      // Update localStorage if this is the current user
      const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');
      if (currentUser.id === timerData.user.id) {
        localStorage.setItem('currentUser', JSON.stringify(updatedUser));
      }

      // Refresh the timers list
      loadActiveTimers();
      
      const timeWorked = formatElapsedTime(timerData.elapsedSeconds);
      alert(`הטיימר של ${timerData.user.full_name || timerData.user.name} נעצר בהצלחה. זמן עבודה: ${timeWorked}`);

    } catch (error) {
      console.error('Error stopping user timer:', error);
      alert('שגיאה בעצירת הטיימר');
    }
  };

  if (activeTimers.length === 0) {
    return (
      <Card className="bg-gray-50 border-gray-200">
        <CardContent className="p-4">
          <div className="flex items-center gap-2 text-gray-600">
            <Clock className="w-4 h-4" />
            <span className="text-sm">אין טיימרים פעילים כרגע</span>
          </div>
          <div className="text-xs text-gray-500 mt-1">
            הטיימרים יופיעו כאן כשמשתמשים יפעילו אותם
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-blue-50 border-blue-200">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-blue-800">
            <Users className="w-5 h-5" />
            טיימרים פעילים ({activeTimers.length})
          </CardTitle>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsExpanded(!isExpanded)}
            className="text-blue-600 hover:text-blue-800"
          >
            {isExpanded ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </Button>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-3">
        {isExpanded ? (
          // Expanded view - show all details
          activeTimers.map((timer) => (
            <div key={timer.user.id} className="bg-white p-3 rounded-lg border border-blue-200">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
                    <span className="text-white text-sm font-bold">
                      {(timer.user.full_name || timer.user.name || 'U').charAt(0)}
                    </span>
                  </div>
                  <div>
                    <div className="font-medium text-sm">{timer.user.full_name || timer.user.name}</div>
                    <div className="text-xs text-gray-500">{timer.user.email}</div>
                  </div>
                </div>
                <Badge className="bg-blue-600 text-white font-mono">
                  {formatElapsedTime(timer.elapsedSeconds)}
                </Badge>
              </div>
              
              <div className="text-sm text-gray-700 mb-2">
                <strong>פרויקט:</strong> {timer.itemName}
              </div>
              
              <div className="flex items-center justify-between">
                <div className="text-xs text-gray-500">
                  התחיל: {format(timer.startTime, 'HH:mm')}
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => stopUserTimer(timer)}
                  className="text-red-600 border-red-300 hover:bg-red-50"
                >
                  עצור טיימר
                </Button>
              </div>
            </div>
          ))
        ) : (
          // Collapsed view - show summary
          <div className="space-y-2">
            {activeTimers.slice(0, 3).map((timer) => (
              <div key={timer.user.id} className="flex items-center justify-between bg-white p-2 rounded border border-blue-200">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center">
                    <span className="text-white text-xs font-bold">
                      {(timer.user.full_name || timer.user.name || 'U').charAt(0)}
                    </span>
                  </div>
                  <span className="text-sm font-medium">{timer.user.full_name || timer.user.name}</span>
                </div>
                <Badge className="bg-blue-600 text-white font-mono text-xs">
                  {formatElapsedTime(timer.elapsedSeconds)}
                </Badge>
              </div>
            ))}
            
            {activeTimers.length > 3 && (
              <div className="text-center text-sm text-blue-600">
                +{activeTimers.length - 3} עוד
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}