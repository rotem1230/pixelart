
import React, { useState, useEffect } from "react";
import { WorkHours as WorkHoursEntity } from "@/api/entities";
import { Event } from "@/api/entities";
import { User } from "@/api/entities";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plus, Clock, Calendar, TrendingUp, Download, ChevronLeft, ChevronRight } from "lucide-react";
import { format, startOfMonth, endOfMonth, differenceInHours, addMonths, subMonths } from "date-fns";
import { he } from "date-fns/locale";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";

import WorkHoursForm from "../components/workhours/WorkHoursForm";
import WorkHoursTable from "../components/workhours/WorkHoursTable";
import WorkHoursStats from "../components/workhours/WorkHoursStats";

export default function WorkHours() {
  const [workHours, setWorkHours] = useState([]);
  const [events, setEvents] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editingEntry, setEditingEntry] = useState(null);
  const [selectedMonth, setSelectedMonth] = useState(new Date());
  const [selectedEvent, setSelectedEvent] = useState("all");
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, [selectedMonth]);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [workHoursData, eventsData, userData] = await Promise.all([
        WorkHoursEntity.getAll(),
        Event.getAll(),
        User.getCurrentUser()
      ]);
      
      // Sort work hours by date (newest first)
      const sortedWorkHours = workHoursData.sort((a, b) => new Date(b.date) - new Date(a.date));
      setWorkHours(sortedWorkHours);
      
      // Sort events by date
      const sortedEvents = eventsData.sort((a, b) => new Date(b.date) - new Date(a.date));
      setEvents(sortedEvents);
      setUser(userData);
    } catch (error) {
      console.error("Error loading data:", error);
    }
    setIsLoading(false);
  };

  const handleSubmit = async (hoursData) => {
    try {
      // Calculate hours worked
      const startTime = new Date(`1970-01-01T${hoursData.start_time}`);
      const endTime = new Date(`1970-01-01T${hoursData.end_time}`);
      const hoursWorked = differenceInHours(endTime, startTime);
      
      const dataToSave = {
        ...hoursData,
        hours_worked: hoursWorked,
        user_id: user.id,
        status: "נרשם"
      };

      if (editingEntry) {
        const updatedEntry = await WorkHoursEntity.update(editingEntry.id, dataToSave);
        setWorkHours(prevWorkHours => 
          prevWorkHours.map(entry => entry.id === editingEntry.id ? updatedEntry : entry)
        );
      } else {
        const newEntry = await WorkHoursEntity.create(dataToSave);
        setWorkHours(prevWorkHours => [newEntry, ...prevWorkHours]);
      }
      
      setShowForm(false);
      setEditingEntry(null);
    } catch (error) {
      console.error("Error saving work hours:", error);
      await loadData(); // Reload data to ensure consistency in case of error
    }
  };

  const handleEdit = (entry) => {
    setEditingEntry(entry);
    setShowForm(true);
  };

  const handleDelete = async (entryId) => {
    if (confirm("האם אתה בטוח שברצונך למחוק את הרישום?")) {
      try {
        await WorkHoursEntity.delete(entryId);
        setWorkHours(prevWorkHours => prevWorkHours.filter(entry => entry.id !== entryId));
      } catch (error) {
        console.error("Error deleting work hours:", error);
        await loadData(); // Reload data to ensure consistency in case of error
      }
    }
  };

  const navigateMonth = (direction) => {
    if (direction === 'next') {
      setSelectedMonth(addMonths(selectedMonth, 1));
    } else {
      setSelectedMonth(subMonths(selectedMonth, 1));
    }
  };

  const handleExportToExcel = () => {
    try {
      // Create CSV content with Hebrew BOM for proper encoding
      const BOM = '\uFEFF';
      const csvContent = BOM + [
        ['תאריך', 'שם אירוע', 'שעת התחלה', 'שעת סיום', 'שעות עבודה', 'הערות', 'סטטוס'].join(','),
        ...filteredWorkHours.map(entry => [
          `"${entry.date}"`,
          `"${getEventName(entry.event_id)}"`,
          `"${entry.start_time}"`,
          `"${entry.end_time || ''}"`,
          `"${entry.hours_worked || ''}"`,
          `"${(entry.notes || '').replace(/"/g, '""')}"`, // Escape quotes
          `"${entry.status}"`
        ].join(','))
      ].join('\n');

      // Create download link
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `work_hours_${format(selectedMonth, 'yyyy-MM')}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url); // Clean up
    } catch (error) {
      console.error("Error exporting to Excel:", error);
      alert("שגיאה ביצוא לאקסל");
    }
  };

  const getEventName = (eventId) => {
    const event = events.find(e => e.id === eventId);
    return event ? event.name : "אירוע לא נמצא";
  };

  const filteredWorkHours = workHours.filter(entry => {
    const entryDate = new Date(entry.date);
    const monthMatch = entryDate >= startOfMonth(selectedMonth) && entryDate <= endOfMonth(selectedMonth);
    const eventMatch = selectedEvent === "all" || entry.event_id === selectedEvent;
    const userMatch = entry.user_id === user?.id;
    
    return monthMatch && eventMatch && userMatch;
  });

  const totalHours = filteredWorkHours.reduce((sum, entry) => sum + (entry.hours_worked || 0), 0);
  const totalEvents = [...new Set(filteredWorkHours.map(entry => entry.event_id))].length;
  const averageHours = filteredWorkHours.length > 0 ? (totalHours / filteredWorkHours.length).toFixed(1) : '0';

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 mb-2">
            שעות עבודה
          </h1>
        </div>

        <div className="flex gap-3 w-full sm:w-auto">
          <Button
            onClick={handleExportToExcel}
            variant="outline"
            className="gap-2"
          >
            <Download className="w-4 h-4" />
            ייצא לאקסל
          </Button>
          <Button
            onClick={() => setShowForm(true)}
            className="gap-2 bg-green-600 hover:bg-green-700"
          >
            <Plus className="w-4 h-4" />
            רישום שעות
          </Button>
        </div>
      </div>

      {/* Work Hours Form */}
      {showForm && (
        <WorkHoursForm
          entry={editingEntry}
          events={events}
          onSubmit={handleSubmit}
          onCancel={() => {
            setShowForm(false);
            setEditingEntry(null);
          }}
        />
      )}

      {/* Month and Event Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                size="icon"
                onClick={() => navigateMonth('prev')}
              >
                <ChevronRight className="w-4 h-4" />
              </Button>
              
              <h2 className="text-lg font-semibold text-gray-900 min-w-[150px] text-center">
                {format(selectedMonth, "MMMM yyyy", { locale: he })}
              </h2>
              
              <Button
                variant="outline"
                size="icon"
                onClick={() => navigateMonth('next')}
              >
                <ChevronLeft className="w-4 h-4" />
              </Button>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-gray-700">סנן לפי אירוע:</span>
              <Select value={selectedEvent} onValueChange={setSelectedEvent}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="בחר אירוע" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">כל האירועים</SelectItem>
                  {events.map(event => (
                    <SelectItem key={event.id} value={event.id}>
                      {event.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
        <Card className="bg-gradient-to-r from-green-50 to-green-100 border-green-200">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-green-900">
              <Clock className="w-5 h-5" />
              סה"כ שעות
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-900">
              {totalHours.toFixed(1)}
            </div>
            <p className="text-sm text-green-700">
              {selectedEvent === "all" ? "כל האירועים" : events.find(e => e.id === selectedEvent)?.name}
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-r from-gray-50 to-gray-100 border-gray-200">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-gray-900">
              <Calendar className="w-5 h-5" />
              אירועים
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">
              {totalEvents}
            </div>
            <p className="text-sm text-gray-700">
              אירועים שעבדת עליהם
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-r from-green-50 to-green-100 border-green-200">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-green-900">
              <TrendingUp className="w-5 h-5" />
              ממוצע לרישום
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-900">
              {averageHours}
            </div>
            <p className="text-sm text-green-700">
              שעות לרישום
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Work Hours Stats */}
      <WorkHoursStats 
        workHours={filteredWorkHours} 
        events={events}
        selectedMonth={selectedMonth}
        onMonthChange={setSelectedMonth}
      />

      {/* Work Hours Table */}
      <WorkHoursTable
        workHours={filteredWorkHours}
        events={events}
        onEdit={handleEdit}
        onDelete={handleDelete}
        isLoading={isLoading}
      />
    </div>
  );
}
