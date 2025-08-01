
import React, { useState, useEffect } from "react";
import { WorkHours } from "@/api/entities";
import { User } from "@/api/entities";
import { Event } from "@/api/entities";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { 
  Clock, 
  Download, 
  ChevronLeft, 
  ChevronRight, 
  DollarSign 
} from "lucide-react";
import { format, startOfMonth, endOfMonth, addMonths, subMonths } from "date-fns";
import { he } from "date-fns/locale";

const statusColors = {
  "נרשם": "bg-yellow-100 text-yellow-800",
  "אושר": "bg-blue-100 text-blue-800",
  "נדחה": "bg-red-100 text-red-800",
  "שולם": "bg-green-100 text-green-800"
};

export default function WorkHoursReport() {
  const [workHours, setWorkHours] = useState([]);
  const [users, setUsers] = useState([]);
  const [events, setEvents] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedUserId, setSelectedUserId] = useState("all");
  const [selectedMonth, setSelectedMonth] = useState(new Date());

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [hoursData, usersData, eventsData] = await Promise.all([
        WorkHours.list("-date"),
        User.getAll(),
        Event.getAll()
      ]);
      setWorkHours(hoursData);
      setUsers(usersData);
      setEvents(eventsData);
    } catch (error) {
      console.error("Error loading work hours report data:", error);
    }
    setIsLoading(false);
  };
  
  const userMap = React.useMemo(() => 
    users.reduce((acc, user) => ({ ...acc, [user.id]: user.full_name || user.email }), {}), 
  [users]);

  const eventMap = React.useMemo(() =>
    events.reduce((acc, event) => ({...acc, [event.id]: event.name }), {}),
  [events]);

  const filteredWorkHours = workHours.filter(entry => {
    const entryDate = new Date(entry.date);
    const monthMatch = entryDate >= startOfMonth(selectedMonth) && entryDate <= endOfMonth(selectedMonth);
    const userMatch = selectedUserId === "all" || entry.user_id === selectedUserId;
    return monthMatch && userMatch;
  });

  const handleMarkAsPaid = async (entryId) => {
    try {
      await WorkHours.update(entryId, { status: "שולם" });
      setWorkHours(prev => prev.map(wh => 
        wh.id === entryId ? { ...wh, status: "שולם" } : wh
      ));
    } catch (error) {
      console.error("Error marking as paid:", error);
      alert("שגיאה בסימון התשלום.");
    }
  };

  const handleExportToExcel = () => {
    const BOM = '\uFEFF';
    const csvContent = BOM + [
      ['עובד', 'אירוע', 'תאריך', 'שעות עבודה', 'סטטוס', 'הערות'].join(','),
      ...filteredWorkHours.map(entry => [
        `"${userMap[entry.user_id] || 'לא ידוע'}"`,
        `"${eventMap[entry.event_id] || 'לא ידוע'}"`,
        `"${entry.date}"`,
        `"${entry.hours_worked || 0}"`,
        `"${entry.status}"`,
        `"${(entry.notes || '').replace(/"/g, '""')}"`
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `work_hours_report_${format(selectedMonth, 'yyyy-MM')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const navigateMonth = (direction) => {
    setSelectedMonth(current => direction === 'next' ? addMonths(current, 1) : subMonths(current, 1));
  };
  
  const totalHours = filteredWorkHours.reduce((sum, entry) => sum + (entry.hours_worked || 0), 0).toFixed(1);

  return (
    <div dir="rtl">
      <Card>
        <CardHeader>
          <CardTitle className="text-right">דוח שעות עבודה</CardTitle>
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 pt-4">
            {/* Filters */}
            <div className="flex gap-4 flex-wrap">
              <Select value={selectedUserId} onValueChange={setSelectedUserId}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="בחר עובד" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">כל העובדים</SelectItem>
                  {users.map(user => (
                    <SelectItem key={user.id} value={user.id}>
                      {user.full_name || user.email}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <div className="flex items-center gap-2">
                {/* ChevronRight for "prev" (move right in calendar means backwards in time for RTL) */}
                <Button variant="outline" size="icon" onClick={() => navigateMonth('prev')}>
                  <ChevronRight className="w-4 h-4" />
                </Button>
                <span className="font-semibold w-32 text-center">{format(selectedMonth, "MMMM yyyy", { locale: he })}</span>
                {/* ChevronLeft for "next" (move left in calendar means forwards in time for RTL) */}
                <Button variant="outline" size="icon" onClick={() => navigateMonth('next')}>
                  <ChevronLeft className="w-4 h-4" />
                </Button>
              </div>
            </div>
            {/* Actions */}
            <div className="flex items-center gap-2">
              <div className="p-3 bg-green-50 rounded-lg text-green-900 font-bold">
                סה"כ שעות: {totalHours}
              </div>
              <Button onClick={handleExportToExcel} variant="outline" className="gap-2">
                <Download className="w-4 h-4" />
                ייצוא
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto" dir="rtl">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-right">עובד</TableHead>
                  <TableHead className="text-right">אירוע</TableHead>
                  <TableHead className="text-right">תאריך</TableHead>
                  <TableHead className="text-right">שעות</TableHead>
                  <TableHead className="text-right">סטטוס</TableHead>
                  <TableHead className="text-right">פעולות</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow><TableCell colSpan={6} className="text-center">טוען נתונים...</TableCell></TableRow>
                ) : filteredWorkHours.length === 0 ? (
                  <TableRow><TableCell colSpan={6} className="text-center py-8">אין נתונים להצגה</TableCell></TableRow>
                ) : (
                  filteredWorkHours.map(entry => (
                    <TableRow key={entry.id}>
                      <TableCell className="text-right">{userMap[entry.user_id] || 'לא ידוע'}</TableCell>
                      <TableCell className="text-right">{eventMap[entry.event_id] || 'ללא אירוע'}</TableCell>
                      <TableCell className="text-right">{format(new Date(entry.date), 'dd/MM/yyyy')}</TableCell>
                      <TableCell className="text-right">{entry.hours_worked?.toFixed(2)}</TableCell>
                      <TableCell className="text-right">
                        <Badge className={statusColors[entry.status]} variant="secondary">
                          {entry.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        {entry.status !== 'שולם' && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleMarkAsPaid(entry.id)}
                            className="gap-1"
                          >
                            <DollarSign className="w-3 h-3 text-green-600" />
                            סמן כשולם
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
