
import React from "react";
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
import { Clock, Edit, Trash2, Calendar } from "lucide-react";
import { format } from "date-fns";
import { he } from "date-fns/locale";
import { Skeleton } from "@/components/ui/skeleton";

const statusColors = {
  "נרשם": "bg-yellow-100 text-yellow-800",
  "אושר": "bg-green-100 text-green-800",
  "נדחה": "bg-red-100 text-red-800"
};

export default function WorkHoursTable({ workHours, events, onEdit, onDelete, isLoading }) {
  const getEventName = (eventId) => {
    const event = events.find(e => e.id === eventId);
    return event ? event.name : "אירוע לא נמצא";
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>רישומי שעות עבודה</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {Array(5).fill(0).map((_, i) => (
              <div key={i} className="p-4 border rounded-lg">
                <Skeleton className="h-4 w-full mb-2" />
                <Skeleton className="h-3 w-24 mb-2" />
                <Skeleton className="h-3 w-16" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clock className="w-5 h-5 text-green-600" />
          רישומי שעות עבודה ({workHours.length})
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>תאריך</TableHead>
                <TableHead>אירוע</TableHead>
                <TableHead>שעות</TableHead>
                <TableHead>סטטוס</TableHead>
                <TableHead>הערות</TableHead>
                <TableHead>פעולות</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {workHours.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-gray-500">
                    <Calendar className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                    <p>אין רישומי שעות עדיין</p>
                  </TableCell>
                </TableRow>
              ) : (
                workHours.map(entry => (
                  <TableRow key={entry.id} className="hover:bg-gray-50">
                    <TableCell>
                      <div className="font-medium">
                        {format(new Date(entry.date), "d בMMMM yyyy", { locale: he })}
                      </div>
                      <div className="text-sm text-gray-500">
                        {entry.start_time} - {entry.end_time}
                      </div>
                    </TableCell>
                    
                    <TableCell>
                      <div className="font-medium text-gray-900">
                        {getEventName(entry.event_id)}
                      </div>
                    </TableCell>
                    
                    <TableCell>
                      <Badge variant="secondary" className="bg-green-100 text-green-800">
                        {entry.hours_worked?.toFixed(1)} שעות
                      </Badge>
                    </TableCell>
                    
                    <TableCell>
                      <Badge className={statusColors[entry.status]} variant="secondary">
                        {entry.status}
                      </Badge>
                    </TableCell>
                    
                    <TableCell>
                      <div className="max-w-xs text-sm text-gray-600">
                        {entry.notes || "אין הערות"}
                      </div>
                    </TableCell>
                    
                    <TableCell>
                      <div className="flex gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onEdit(entry)}
                          className="h-8 w-8 p-0"
                        >
                          <Edit className="w-3 h-3" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onDelete(entry.id)}
                          className="h-8 w-8 p-0 text-red-500 hover:text-red-700"
                        >
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
