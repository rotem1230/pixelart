import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Clock, AlertTriangle, Calendar } from "lucide-react";
import { format, isAfter, isBefore, addDays, differenceInDays } from "date-fns";
import { he } from "date-fns/locale";
import { Skeleton } from "@/components/ui/skeleton";

export default function UpcomingDeadlines({ tasks, isLoading }) {
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="w-5 h-5" />
            דדליינים קרובים
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {Array(3).fill(0).map((_, i) => (
              <div key={i} className="p-3 border rounded-lg">
                <Skeleton className="h-4 w-full mb-2" />
                <Skeleton className="h-3 w-20" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  const upcomingTasks = tasks
    .filter(task => 
      task.deadline && 
      task.status !== "הושלם" &&
      isAfter(new Date(task.deadline), new Date()) &&
      isBefore(new Date(task.deadline), addDays(new Date(), 7))
    )
    .sort((a, b) => new Date(a.deadline) - new Date(b.deadline));

  const overdueTasks = tasks
    .filter(task => 
      task.deadline && 
      task.status !== "הושלם" &&
      isBefore(new Date(task.deadline), new Date())
    )
    .sort((a, b) => new Date(a.deadline) - new Date(b.deadline));

  const allTasks = [...overdueTasks, ...upcomingTasks].slice(0, 5);

  const getUrgencyColor = (deadline) => {
    const now = new Date();
    const deadlineDate = new Date(deadline);
    const daysUntil = differenceInDays(deadlineDate, now);
    
    if (daysUntil < 0) return "text-red-600 bg-red-50";
    if (daysUntil <= 1) return "text-orange-600 bg-orange-50";
    if (daysUntil <= 3) return "text-yellow-600 bg-yellow-50";
    return "text-blue-600 bg-blue-50";
  };

  const getUrgencyText = (deadline) => {
    const now = new Date();
    const deadlineDate = new Date(deadline);
    const daysUntil = differenceInDays(deadlineDate, now);
    
    if (daysUntil < 0) return `באיחור ${Math.abs(daysUntil)} ימים`;
    if (daysUntil === 0) return "היום";
    if (daysUntil === 1) return "מחר";
    return `בעוד ${daysUntil} ימים`;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clock className="w-5 h-5 text-orange-600" />
          דדליינים קרובים
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {allTasks.length === 0 ? (
            <div className="text-center py-6 text-gray-500">
              <Calendar className="w-8 h-8 mx-auto mb-2 text-gray-300" />
              <p className="text-sm">אין דדליינים קרובים</p>
            </div>
          ) : (
            allTasks.map((task) => (
              <div key={task.id} className="p-3 border border-gray-200 rounded-lg hover:shadow-sm transition-shadow">
                <div className="flex items-start justify-between mb-2">
                  <h4 className="font-medium text-gray-900 text-sm leading-tight">
                    {task.description}
                  </h4>
                  {isBefore(new Date(task.deadline), new Date()) && (
                    <AlertTriangle className="w-4 h-4 text-red-500 flex-shrink-0 mr-1" />
                  )}
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="text-xs text-gray-600">
                    {format(new Date(task.deadline), "d בMMMM", { locale: he })}
                  </div>
                  <Badge
                    variant="secondary"
                    className={`text-xs ${getUrgencyColor(task.deadline)}`}
                  >
                    {getUrgencyText(task.deadline)}
                  </Badge>
                </div>
                
                {task.assigned_user && (
                  <div className="text-xs text-gray-500 mt-1">
                    אחראי: {task.assigned_user}
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
}