import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { ChevronLeft, ChevronRight, BarChart3, Clock } from "lucide-react";
import { format, addMonths, subMonths } from "date-fns";
import { he } from "date-fns/locale";

export default function WorkHoursStats({ workHours, events, selectedMonth, onMonthChange }) {
  const navigateMonth = (direction) => {
    if (direction === 'next') {
      onMonthChange(addMonths(selectedMonth, 1));
    } else {
      onMonthChange(subMonths(selectedMonth, 1));
    }
  };

  const getEventStats = () => {
    const eventStats = {};
    
    workHours.forEach(entry => {
      const eventId = entry.event_id;
      const event = events.find(e => e.id === eventId);
      const eventName = event ? event.name : "אירוע לא ידוע";
      
      if (!eventStats[eventId]) {
        eventStats[eventId] = {
          name: eventName,
          hours: 0,
          entries: 0
        };
      }
      
      eventStats[eventId].hours += entry.hours_worked || 0;
      eventStats[eventId].entries += 1;
    });

    return Object.values(eventStats).sort((a, b) => b.hours - a.hours);
  };

  const eventStats = getEventStats();
  const totalHours = workHours.reduce((sum, entry) => sum + (entry.hours_worked || 0), 0);
  const maxHours = Math.max(...eventStats.map(stat => stat.hours), 1);

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle className="flex items-center gap-2">
            <Clock className="w-5 h-5 text-purple-600" />
            סטטיסטיקת שעות חודשית
          </CardTitle>
          
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="icon"
              onClick={() => navigateMonth('prev')}
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
            
            <h3 className="text-lg font-semibold text-gray-900 min-w-[150px] text-center">
              {format(selectedMonth, "MMMM yyyy", { locale: he })}
            </h3>
            
            <Button
              variant="outline"
              size="icon"
              onClick={() => navigateMonth('next')}
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {eventStats.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Clock className="w-12 h-12 mx-auto mb-3 text-gray-300" />
              <p>אין דיווחי שעות לחודש זה</p>
            </div>
          ) : (
            eventStats.map((stat, index) => (
              <div key={index} className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="font-medium text-gray-900">{stat.name}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-600">{stat.entries} דיווחים</span>
                    <span className="font-semibold text-blue-600">
                      {stat.hours.toFixed(1)} שעות
                    </span>
                  </div>
                </div>
                <Progress 
                  value={(stat.hours / maxHours) * 100} 
                  className="h-2"
                />
              </div>
            ))
          )}
          
          {totalHours > 0 && (
            <div className="mt-6 p-4 bg-blue-50 rounded-lg">
              <div className="flex justify-between items-center">
                <span className="font-semibold text-blue-900">סה"כ שעות החודש:</span>
                <span className="text-2xl font-bold text-blue-900">
                  {totalHours.toFixed(1)}
                </span>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}