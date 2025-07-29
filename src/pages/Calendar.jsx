import React, { useState, useEffect } from "react";
import { Event } from "@/api/entities";
import { Task } from "@/api/entities";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar as CalendarIcon, CheckSquare, ChevronLeft, ChevronRight, Plus, Clock, MapPin } from "lucide-react";
import { format, isSameDay, startOfMonth, endOfMonth, eachDayOfInterval, startOfWeek, endOfWeek, addMonths, subMonths, isSameMonth, isToday, getDay } from "date-fns";
import { he } from "date-fns/locale";

// Hebrew calendar utilities
const hebrewMonths = [
  'תשרי', 'חשון', 'כסלו', 'טבת', 'שבט', 'אדר', 'ניסן', 'אייר', 'סיון', 'תמוז', 'אב', 'אלול'
];

const hebrewDays = ['א', 'ב', 'ג', 'ד', 'ה', 'ו', 'ש'];
const hebrewDaysFull = ['ראשון', 'שני', 'שלישי', 'רביעי', 'חמישי', 'שישי', 'שבת'];

// Hebrew date conversion (simplified - for demo purposes)
const getHebrewDate = (date) => {
  // This is a simplified Hebrew date calculation
  // In a real application, you would use a proper Hebrew calendar library
  const gregorianYear = date.getFullYear();
  const hebrewYear = gregorianYear + 3760; // Approximate conversion
  const month = date.getMonth();
  const day = date.getDate();
  
  return {
    day: day,
    month: hebrewMonths[month % 12],
    year: hebrewYear,
    dayName: hebrewDaysFull[getDay(date)]
  };
};

export default function CalendarPage() {
  const [events, setEvents] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [isLoading, setIsLoading] = useState(true);
  const [viewMode, setViewMode] = useState('month'); // month, week, day
  const [showHebrewDates, setShowHebrewDates] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [eventsData, tasksData] = await Promise.all([
        Event.getAll(),
        Task.getAll()
      ]);
      setEvents(eventsData.filter(event => !event.is_archived));
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
    const isCurrentMonth = isSameMonth(date, currentDate);
    const isSelectedDate = isSameDay(date, selectedDate);
    const isTodayDate = isToday(date);
    const hebrewDate = getHebrewDate(date);

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
                {hebrewDate.day} {hebrewDate.month}
              </div>
            )}
          </div>
          {isTodayDate && (
            <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
          )}
        </div>

        {/* Events and tasks */}
        <div className="space-y-1 flex-grow overflow-hidden">
          {dayEvents.slice(0, 3).map((event, index) => (
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
          
          {dayTasks.slice(0, 2).map((task, index) => (
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
          
          {(dayEvents.length > 3 || dayTasks.length > 2) && (
            <div className="text-xs text-gray-500 px-2 py-1 bg-gray-100 rounded-md">
              +{Math.max(0, dayEvents.length - 3) + Math.max(0, dayTasks.length - 2)} עוד
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
            {format(currentDate, "MMMM yyyy", { locale: he })}
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
                {getHebrewDate(selectedDate).day} {getHebrewDate(selectedDate).month} {getHebrewDate(selectedDate).year}
              </div>
            )}
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-6">
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