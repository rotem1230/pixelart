import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckSquare, Circle, ArrowRight, Clock } from "lucide-react";
import { format } from "date-fns";
import { he } from "date-fns/locale";
import { Skeleton } from "@/components/ui/skeleton";

const statusIcons = {
  "פתוח": <Circle className="w-4 h-4 text-gray-500" />,
  "בתהליך": <ArrowRight className="w-4 h-4 text-blue-500" />,
  "הושלם": <CheckSquare className="w-4 h-4 text-green-500" />
};

const statusColors = {
  "פתוח": "bg-gray-100 text-gray-800",
  "בתהליך": "bg-blue-100 text-blue-800",
  "הושלם": "bg-green-100 text-green-800"
};

const priorityColors = {
  "נמוכה": "bg-gray-100 text-gray-800",
  "רגילה": "bg-blue-100 text-blue-800",
  "גבוהה": "bg-orange-100 text-orange-800",
  "קריטית": "bg-red-100 text-red-800"
};

export default function TasksOverview({ tasks, isLoading }) {
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckSquare className="w-5 h-5" />
            סקירת משימות
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {Array(4).fill(0).map((_, i) => (
              <div key={i} className="p-4 border rounded-lg">
                <div className="flex justify-between items-start mb-2">
                  <Skeleton className="h-5 w-40" />
                  <Skeleton className="h-6 w-16" />
                </div>
                <Skeleton className="h-4 w-24 mb-2" />
                <Skeleton className="h-4 w-full" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  const recentTasks = tasks.slice(0, 6);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CheckSquare className="w-5 h-5 text-purple-600" />
          סקירת משימות
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {recentTasks.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <CheckSquare className="w-12 h-12 mx-auto mb-3 text-gray-300" />
              <p>אין משימות עדיין</p>
            </div>
          ) : (
            recentTasks.map((task) => (
              <div key={task.id} className="p-4 border border-gray-200 rounded-lg hover:shadow-md transition-shadow">
                <div className="flex justify-between items-start mb-2">
                  <div className="flex items-center gap-2">
                    {statusIcons[task.status]}
                    <h3 className="font-semibold text-gray-900">{task.description}</h3>
                  </div>
                  <Badge className={statusColors[task.status]} variant="secondary">
                    {task.status}
                  </Badge>
                </div>
                
                <div className="flex items-center gap-4 text-sm text-gray-600 mb-2">
                  {task.deadline && (
                    <div className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {format(new Date(task.deadline), "d בMMMM", { locale: he })}
                    </div>
                  )}
                  {task.assigned_user && (
                    <div>
                      <span className="font-medium">אחראי:</span> {task.assigned_user}
                    </div>
                  )}
                </div>
                
                <div className="flex items-center gap-2">
                  {task.priority && (
                    <Badge
                      variant="outline"
                      className={`text-xs ${priorityColors[task.priority]}`}
                    >
                      {task.priority}
                    </Badge>
                  )}
                  {task.tags && task.tags.length > 0 && (
                    task.tags.slice(0, 2).map((tag, index) => (
                      <Badge
                        key={index}
                        variant="outline"
                        className="text-xs bg-purple-50 text-purple-700 border-purple-200"
                      >
                        {tag}
                      </Badge>
                    ))
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
}