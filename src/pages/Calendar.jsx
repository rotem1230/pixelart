import React, { useState, useEffect } from "react";
import { Event } from "@/api/entities";
import { Task } from "@/api/entities";
import { User } from "@/api/entities";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar as CalendarIcon, CheckSquare, ChevronLeft, ChevronRight, Plus, Clock, MapPin } from "lucide-react";
import { format, isSameDay, startOfMonth, endOfMonth, eachDayOfInterval, startOfWeek, endOfWeek, addMonths, subMonths, isSameMonth, isToday, getDay } from "date-fns";
import { he } from "date-fns/locale";

const hebrewDays = ['א', 'ב', 'ג', 'ד', 'ה', 'ו', 'ש'];
const hebrewDaysFull = ['ראשון', 'שני', 'שלישי', 'רביעי', 'חמישי', 'שישי', 'שבת'];

// Hebrew months
const hebrewMonths = [
  'תשרי', 'חשון', 'כסלו', 'טבת', 'שבט', 'אדר', 'ניסן', 'אייר', 'סיון', 'תמוז', 'אב', 'אלול'
];

// Hebrew numerals conversion
const toHebrewNumeral = (num) => {
  if (!num || num <= 0) return '';
  
  // Basic numbers 1-30
  const basicNums = {
    1: 'א\'', 2: 'ב\'', 3: 'ג\'', 4: 'ד\'', 5: 'ה\'',
    6: 'ו\'', 7: 'ז\'', 8: 'ח\'', 9: 'ט\'', 10: 'י\'',
    11: 'י"א', 12: 'י"ב', 13: 'י"ג', 14: 'י"ד', 15: 'ט"ו',
    16: 'ט"ז', 17: 'י"ז', 18: 'י"ח', 19: 'י"ט', 20: 'כ\'',
    21: 'כ"א', 22: 'כ"ב', 23: 'כ"ג', 24: 'כ"ד', 25: 'כ"ה',
    26: 'כ"ו', 27: 'כ"ז', 28: 'כ"ח', 29: 'כ"ט', 30: 'ל\''
  };
  
  if (num <= 30) {
    return basicNums[num] || num.toString();
  }
  
  return num.toString();
};

// Convert Hebrew year to proper format
const formatHebrewYear = (year) => {
  if (!year || year < 5000) return year?.toString() || '';
  
  // Current Hebrew year is around 5785 (2025)
  // We want to display it as ה'תשפ"ה
  const currentYear = new Date().getFullYear();
  const hebrewYear = currentYear + 3760;
  
  // For now, let's use a simple mapping for current years
  const yearMappings = {
    5784: 'ה\'תשפ"ד',
    5785: 'ה\'תשפ"ה',
    5786: 'ה\'תשפ"ו',
    5787: 'ה\'תשפ"ז',
    5788: 'ה\'תשפ"ח'
  };
  
  return yearMappings[year] || `ה'${year.toString().slice(-3)}`;
};

// Improved Hebrew date conversion (still approximation but better)
const getHebrewDate = (date) => {
  try {
    const gregorianYear = date.getFullYear();
    const gregorianMonth = date.getMonth(); // 0-11
    const gregorianDay = date.getDate();
    
    // Better Hebrew year calculation
    let hebrewYear = gregorianYear + 3760;
    
    // Hebrew calendar starts in Tishrei (around September)
    // If we're before September, we're still in the previous Hebrew year
    if (gregorianMonth < 8) { // Before September (month 8)
      hebrewYear = gregorianYear + 3760;
    } else {
      hebrewYear = gregorianYear + 3761;
    }
    
    // Better Hebrew month mapping (still approximation)
    let hebrewMonthIndex;
    
    // Map Gregorian months to approximate Hebrew months
    const monthMapping = {
      0: 4,  // January -> Shvat
      1: 5,  // February -> Adar
      2: 6,  // March -> Nissan
      3: 7,  // April -> Iyar
      4: 8,  // May -> Sivan
      5: 9,  // June -> Tammuz
      6: 10, // July -> Av
      7: 11, // August -> Elul
      8: 0,  // September -> Tishrei
      9: 1,  // October -> Cheshvan
      10: 2, // November -> Kislev
      11: 3  // December -> Tevet
    };
    
    hebrewMonthIndex = monthMapping[gregorianMonth];
    
    // Adjust day (this is very approximate)
    let hebrewDay = gregorianDay;
    
    // Simple adjustment - Hebrew months can be 29 or 30 days
    if (hebrewDay > 29) {
      hebrewDay = Math.min(hebrewDay, 29);
    }
    
    return {
      day: hebrewDay,
      dayHeb: toHebrewNumeral(hebrewDay),
      month: hebrewMonths[hebrewMonthIndex],
      monthNum: hebrewMonthIndex,
      year: hebrewYear,
      yearHeb: formatHebrewYear(hebrewYear),
      dayName: hebrewDaysFull[getDay(date)],
      toString: () => `${toHebrewNumeral(hebrewDay)} ${hebrewMonths[hebrewMonthIndex]} ${formatHebrewYear(hebrewYear)}`
    };
  } catch (error) {
    console.error("Error converting to Hebrew date:", error);
    return {
      day: date.getDate(),
      dayHeb: date.getDate().toString(),
      month: 'שגיאה',
      monthNum: 0,
      year: date.getFullYear(),
      yearHeb: date.getFullYear().toString(),
      dayName: hebrewDaysFull[getDay(date)],
      toString: () => 'שגיאה בתאריך'
    };
  }
};

// Basic Hebrew holidays (simplified list)
const hebrewHolidays = {
  // Format: 'MM-DD': [holiday names]
  '09-15': ['ראש השנה'],
  '09-16': ['ראש השנה'],
  '09-24': ['יום כיפור'],
  '09-29': ['סוכות'],
  '10-06': ['שמחת תורה'],
  '12-25': ['חנוכה'],
  '01-01': ['חנוכה'],
  '02-15': ['ט"ו בשבט'],
  '03-14': ['פורים'], // Approximate
  '04-15': ['פסח'],
  '04-16': ['פסח'],
  '04-21': ['פסח'],
  '04-22': ['פסח'],
  '05-18': ['ל"ג בעומר'], // Approximate
  '05-28': ['יום ירושלים'], // Approximate
  '06-06': ['שבועות'] // Approximate
};

// Get Hebrew holidays for a date (simplified)
const getHebrewHolidays = (date) => {
  const monthDay = format(date, 'MM-dd');
  const holidays = hebrewHolidays[monthDay] || [];
  
  // Add Shabbat
  if (getDay(date) === 6) { // Saturday
    holidays.push('שבת');
  }
  
  return holidays.map(holiday => ({
    desc: holiday,
    category: holiday === 'שבת' ? 'shabbat' : 'holiday'
  }));
};

export default function CalendarPage() {
  const [events, setEvents] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [isLoading, setIsLoading] = useState(true);
  const [viewMode, setViewMode] = useState('month'); // month, week, day
  const [showHebrewDates, setShowHebrewDates] = useState(true);
  const [hebrewCalendarMode, setHebrewCalendarMode] = useState(false);

  useEffect(() => {
    loadData();

    // Listen for cloud sync updates
    const handleCloudSyncUpdate = (e) => {
      const { entityName } = e.detail;
      if (entityName === 'events' || entityName === 'tasks') {
        console.log(`Cloud sync update received for ${entityName}, refreshing calendar...`);
        loadData();
      }
    };

    const handleCloudSyncComplete = () => {
      console.log('Full cloud sync completed, refreshing calendar...');
      loadData();
    };

    window.addEventListener('cloudSyncUpdate', handleCloudSyncUpdate);
    window.addEventListener('cloudSyncComplete', handleCloudSyncComplete);

    return () => {
      window.removeEventListener('cloudSyncUpdate', handleCloudSyncUpdate);
      window.removeEventListener('cloudSyncComplete', handleCloudSyncComplete);
    };
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [eventsData, tasksData, userData] = await Promise.all([
        Event.getAll(),
        Task.getAll(),
        User.getCurrentUser().catch(() => null)
      ]);
      
      let filteredEvents = eventsData.filter(event => !event.is_archived);
      
      // If user is an operator, show only events assigned to them
      if (userData?.role === 'operator') {
        filteredEvents = filteredEvents.filter(event => 
          event.assigned_operator_id === userData.id
        );
      }
      
      setEvents(filteredEvents);
      setTasks(tasksData);
    } catch (error) {
      console.error("Error loading data:", error);
    }
    setIsLoading(false);
  };

  const getEventsForDate = (date) => {
    return events.filter(event =>
      event.date && isSameDay(new Date(event.date), date)
    );
  };

  const getTasksForDate = (date) => {
    return tasks.filter(task =>
      task.deadline && isSameDay(new Date(task.deadline), date)
    );
  };

  // Calendar logic
  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const calendarStart = startOfWeek(monthStart, { weekStartsOn: 0 }); // Sunday = 0
  const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 0 });
  const calendarDays = eachDayOfInterval({ start: calendarStart, end: calendarEnd });

  const navigateMonth = (direction) => {
    if (direction === 'prev') {
      setCurrentDate(subMonths(currentDate, 1));
    } else {
      setCurrentDate(addMonths(currentDate, 1));
    }
  };

  const goToToday = () => {
    const today = new Date();
    setCurrentDate(today);
    setSelectedDate(today);
  };

  const renderDay = (date) => {
    const dayEvents = getEventsForDate(date);
    const dayTasks = getTasksForDate(date);
    const hebrewHolidays = getHebrewHolidays(date);
    const isCurrentMonth = isSameMonth(date, currentDate);
    const isSelectedDate = isSameDay(date, selectedDate);
    const isTodayDate = isToday(date);
    const hebrewDate = getHebrewDate(date);
    const hasHolidays = hebrewHolidays.length > 0;

    return (
      <div
        key={date.toISOString()}
        className={`
          min-h-[140px] p-3 border-r border-b border-gray-100 cursor-pointer transition-all duration-200 flex flex-col relative group
          ${!isCurrentMonth ? 'bg-gray-50/50 text-gray-400' : 'bg-white hover:bg-blue-50/30'}
          ${isSelectedDate ? 'bg-blue-100/50 ring-2 ring-blue-400 ring-inset' : ''}
          ${isTodayDate ? 'bg-blue-50 ring-2 ring-blue-500 ring-inset' : ''}
        `}
        onClick={() => setSelectedDate(date)}
      >
        {/* Date numbers */}
        <div className="flex justify-between items-start mb-2">
          <div className="text-right">
            <div className={`text-sm font-medium ${isTodayDate ? 'text-blue-600' : isCurrentMonth ? 'text-gray-900' : 'text-gray-400'}`}>
              {format(date, 'd')}
            </div>
            {showHebrewDates && (
              <div className={`text-xs ${isTodayDate ? 'text-blue-500' : isCurrentMonth ? 'text-gray-500' : 'text-gray-300'}`}>
                {hebrewDate.dayHeb} {hebrewDate.month}
              </div>
            )}
          </div>
          {isTodayDate && (
            <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
          )}
        </div>

        {/* Hebrew holidays */}
        {hasHolidays && showHebrewDates && (
          <div className="mb-2">
            {hebrewHolidays.slice(0, 1).map((holiday, index) => (
              <div
                key={index}
                className="text-xs px-2 py-1 bg-gradient-to-r from-purple-100 to-purple-50 text-purple-800 rounded-md truncate border-r-2 border-purple-400"
                title={holiday.desc}
              >
                <div className="flex items-center gap-1">
                  <div className="w-1.5 h-1.5 bg-purple-500 rounded-full flex-shrink-0"></div>
                  <span className="truncate font-medium">{holiday.desc}</span>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Events and tasks */}
        <div className="space-y-1 flex-grow overflow-hidden">
          {dayEvents.slice(0, hasHolidays ? 2 : 3).map((event, index) => (
            <div
              key={event.id}
              className="text-xs px-2 py-1 bg-gradient-to-r from-green-100 to-green-50 text-green-800 rounded-md truncate border-r-2 border-green-400 hover:shadow-sm transition-shadow"
              title={event.name}
            >
              <div className="flex items-center gap-1">
                <div className="w-1.5 h-1.5 bg-green-500 rounded-full flex-shrink-0"></div>
                <span className="truncate">{event.name}</span>
              </div>
            </div>
          ))}
          
          {dayTasks.slice(0, hasHolidays ? 1 : 2).map((task, index) => (
            <div
              key={task.id}
              className="text-xs px-2 py-1 bg-gradient-to-r from-blue-100 to-blue-50 text-blue-800 rounded-md truncate border-r-2 border-blue-400 hover:shadow-sm transition-shadow"
              title={task.description}
            >
              <div className="flex items-center gap-1">
                <CheckSquare className="w-2.5 h-2.5 flex-shrink-0" />
                <span className="truncate">{task.description}</span>
              </div>
            </div>
          ))}
          
          {(dayEvents.length > (hasHolidays ? 2 : 3) || dayTasks.length > (hasHolidays ? 1 : 2) || hebrewHolidays.length > 1) && (
            <div className="text-xs text-gray-500 px-2 py-1 bg-gray-100 rounded-md">
              +{Math.max(0, dayEvents.length - (hasHolidays ? 2 : 3)) + Math.max(0, dayTasks.length - (hasHolidays ? 1 : 2)) + Math.max(0, hebrewHolidays.length - 1)} עוד
            </div>
          )}
        </div>

        {/* Hover effect for adding events */}
        <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
          <div className="absolute top-2 left-2">
            <Plus className="w-4 h-4 text-gray-400" />
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="h-screen flex flex-col bg-white" dir="rtl">
      {/* Header - Google Calendar style */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-white">
        <div className="flex items-center gap-4">
          <h1 className="text-2xl font-normal text-gray-900">לוח שנה</h1>
          <Button
            variant="outline"
            onClick={goToToday}
            className="text-sm font-medium"
          >
            היום
          </Button>
        </div>

        <div className="flex items-center gap-4">
          {/* Hebrew calendar mode toggle */}
          <Button
            variant={hebrewCalendarMode ? "default" : "outline"}
            size="sm"
            onClick={() => setHebrewCalendarMode(!hebrewCalendarMode)}
            className="text-xs"
          >
            לוח עברי
          </Button>
          
          {/* Hebrew dates toggle */}
          <Button
            variant={showHebrewDates ? "default" : "outline"}
            size="sm"
            onClick={() => setShowHebrewDates(!showHebrewDates)}
            className="text-xs"
          >
            תאריכים עבריים
          </Button>

          {/* Month navigation */}
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigateMonth('prev')}
              className="h-8 w-8"
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigateMonth('next')}
              className="h-8 w-8"
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
          </div>

          {/* Current month/year */}
          <h2 className="text-xl font-normal text-gray-900 min-w-[200px] text-center">
            {hebrewCalendarMode ? (
              <div className="flex flex-col items-center">
                <div>{getHebrewDate(currentDate).month} {getHebrewDate(currentDate).yearHeb}</div>
                <div className="text-sm text-gray-500">{format(currentDate, "MMMM yyyy", { locale: he })}</div>
              </div>
            ) : (
              format(currentDate, "MMMM yyyy", { locale: he })
            )}
          </h2>
        </div>
      </div>
      
      {/* Main content area */}
      <div className="flex flex-1 overflow-hidden">
        {/* Calendar grid */}
        <div className="flex-1 flex flex-col">
          {/* Days of week header */}
          <div className="grid grid-cols-7 border-b border-gray-200 bg-gray-50">
            {hebrewDaysFull.map((day, index) => (
              <div key={day} className="p-4 text-center text-sm font-medium text-gray-700 border-r border-gray-200">
                <div>{day}</div>
                <div className="text-xs text-gray-500 mt-1">{hebrewDays[index]}</div>
              </div>
            ))}
          </div>

          {/* Calendar days grid */}
          <div className="flex-1 grid grid-cols-7 grid-rows-6 border-l border-gray-200">
            {calendarDays.map(renderDay)}
          </div>
        </div>

        {/* Right sidebar - Selected date details */}
        <div className="w-80 border-r border-gray-200 bg-white flex flex-col">
          <div className="p-4 border-b border-gray-200">
            <div className="text-lg font-medium text-gray-900">
              {format(selectedDate, "d בMMMM yyyy", { locale: he })}
            </div>
            <div className="text-sm text-gray-600 mt-1">
              {format(selectedDate, "EEEE", { locale: he })}
            </div>
            {showHebrewDates && (
              <div className="text-sm text-blue-600 mt-1">
                {getHebrewDate(selectedDate).toString()}
              </div>
            )}
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-6">
            {/* Hebrew holidays section */}
            {showHebrewDates && getHebrewHolidays(selectedDate).length > 0 && (
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="flex items-center gap-2 font-medium text-gray-900">
                    <div className="w-3 h-3 bg-purple-500 rounded-full"></div>
                    חגים ומועדים
                  </h3>
                  <Badge variant="secondary" className="text-xs">
                    {getHebrewHolidays(selectedDate).length}
                  </Badge>
                </div>
                
                <div className="space-y-2">
                  {getHebrewHolidays(selectedDate).map((holiday, index) => (
                    <div key={index} className="p-3 bg-purple-50 rounded-lg border border-purple-100 hover:border-purple-200 transition-colors">
                      <div className="font-medium text-purple-900 text-sm">{holiday.desc}</div>
                      <div className="text-xs text-purple-700 mt-1 capitalize">{holiday.category}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Events section */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <h3 className="flex items-center gap-2 font-medium text-gray-900">
                  <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                  אירועים
                </h3>
                <Badge variant="secondary" className="text-xs">
                  {getEventsForDate(selectedDate).length}
                </Badge>
              </div>
              
              <div className="space-y-2">
                {getEventsForDate(selectedDate).length > 0 ? (
                  getEventsForDate(selectedDate).map(event => (
                    <div key={event.id} className="p-3 bg-green-50 rounded-lg border border-green-100 hover:border-green-200 transition-colors">
                      <div className="font-medium text-green-900 text-sm">{event.name}</div>
                      {event.audience_arrival_time && (
                        <div className="flex items-center gap-1 text-xs text-green-700 mt-1">
                          <Clock className="w-3 h-3" />
                          {event.audience_arrival_time}
                        </div>
                      )}
                      {event.location && (
                        <div className="flex items-center gap-1 text-xs text-green-700 mt-1">
                          <MapPin className="w-3 h-3" />
                          {event.location}
                        </div>
                      )}
                    </div>
                  ))
                ) : (
                  <div className="text-sm text-gray-500 text-center py-8">
                    אין אירועים ביום זה
                  </div>
                )}
              </div>
            </div>

            {/* Tasks section */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <h3 className="flex items-center gap-2 font-medium text-gray-900">
                  <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                  משימות
                </h3>
                <Badge variant="secondary" className="text-xs">
                  {getTasksForDate(selectedDate).length}
                </Badge>
              </div>
              
              <div className="space-y-2">
                {getTasksForDate(selectedDate).length > 0 ? (
                  getTasksForDate(selectedDate).map(task => (
                    <div key={task.id} className="p-3 bg-blue-50 rounded-lg border border-blue-100 hover:border-blue-200 transition-colors">
                      <div className="font-medium text-blue-900 text-sm">{task.description}</div>
                      {task.assigned_user && (
                        <div className="text-xs text-blue-700 mt-1">
                          אחראי: {task.assigned_user}
                        </div>
                      )}
                      {task.priority && (
                        <Badge 
                          className={`mt-2 text-xs ${
                            task.priority === 'גבוהה' ? 'bg-red-100 text-red-800' : 
                            task.priority === 'רגילה' ? 'bg-yellow-100 text-yellow-800' : 
                            'bg-gray-100 text-gray-800'
                          }`}
                        >
                          {task.priority}
                        </Badge>
                      )}
                    </div>
                  ))
                ) : (
                  <div className="text-sm text-gray-500 text-center py-8">
                    אין משימות ביום זה
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}