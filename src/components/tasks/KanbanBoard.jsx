
import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Circle,
  ArrowRight,
  CheckCircle,
  Clock,
  User,
  Calendar,
  Edit,
  Trash2,
  AlertTriangle,
  CheckSquare
} from "lucide-react";
import { format, isBefore } from "date-fns";
import { he } from "date-fns/locale";
import { Skeleton } from "@/components/ui/skeleton";

const statusConfig = {
  "פתוח": {
    title: "פתוח",
    icon: Circle,
    color: "text-gray-600",
    bgColor: "bg-gray-50",
    borderColor: "border-gray-200"
  },
  "בתהליך": {
    title: "בתהליך",
    icon: ArrowRight,
    color: "text-blue-600",
    bgColor: "bg-blue-50",
    borderColor: "border-blue-200"
  },
  "הושלם": {
    title: "הושלם",
    icon: CheckCircle,
    color: "text-green-600",
    bgColor: "bg-green-50",
    borderColor: "border-green-200"
  }
};

const priorityColors = {
  "נמוכה": "bg-gray-100 text-gray-800",
  "רגילה": "bg-blue-100 text-blue-800",
  "גבוהה": "bg-orange-100 text-orange-800",
  "קריטית": "bg-red-100 text-red-800"
};

export default function KanbanBoard({ tasks, onTaskStatusChange, onEditTask, onDeleteTask, onSelectTask, isLoading }) {
  const statuses = ["הושלם", "בתהליך", "פתוח"];

  const getTasksByStatus = (status) => {
    return tasks.filter(task => task.status === status);
  };

  const handleStatusChange = (taskId, newStatus) => {
    onTaskStatusChange(taskId, newStatus);
  };

  const isOverdue = (deadline) => {
    return deadline && isBefore(new Date(deadline), new Date());
  };

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {statuses.map(status => (
          <Card key={status} className="h-fit">
            <CardHeader className="pb-3">
              <Skeleton className="h-6 w-20" />
            </CardHeader>
            <CardContent className="space-y-3">
              {Array(3).fill(0).map((_, i) => (
                <div key={i} className="p-4 border rounded-lg">
                  <Skeleton className="h-4 w-full mb-2" />
                  <Skeleton className="h-3 w-24 mb-2" />
                  <Skeleton className="h-3 w-16" />
                </div>
              ))}
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {statuses.map(status => {
        const config = statusConfig[status];
        const statusTasks = getTasksByStatus(status);
        const Icon = config.icon;

        return (
          <Card key={status} className={`${config.bgColor} ${config.borderColor} border-2`}>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2">
                <Icon className={`w-5 h-5 ${config.color}`} />
                <span className={config.color}>{config.title}</span>
                <Badge variant="secondary" className="text-xs mr-auto">
                  {statusTasks.length}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {statusTasks.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <Icon className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                  <p className="text-sm">אין משימות</p>
                </div>
              ) : (
                statusTasks.map(task => (
                  <Card 
                    key={task.id} 
                    className="bg-white shadow-sm hover:shadow-md transition-shadow border-0 cursor-pointer"
                    onClick={() => onSelectTask(task)}
                  >
                    <CardContent className="p-4">
                      <div className="flex justify-between items-start mb-3" onClick={(e) => e.stopPropagation()}>
                        <h3 className="font-medium text-gray-900 leading-tight">
                          {task.description}
                        </h3>
                        <div className="flex gap-1 flex-shrink-0">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => onEditTask(task)}
                            className="h-8 w-8 text-gray-400 hover:text-gray-600"
                          >
                            <Edit className="w-3 h-3" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => onDeleteTask(task.id)}
                            className="h-8 w-8 text-gray-400 hover:text-red-600"
                          >
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        </div>
                      </div>

                      {/* Priority and Tags */}
                      <div className="flex flex-wrap gap-1 mb-3">
                        {task.priority && (
                          <Badge
                            variant="secondary"
                            className={`text-xs ${priorityColors[task.priority]}`}
                          >
                            {task.priority}
                          </Badge>
                        )}
                        {task.tags && task.tags.slice(0, 2).map((tag, index) => (
                          <Badge
                            key={index}
                            variant="outline"
                            className="text-xs bg-purple-50 text-purple-700 border-purple-200"
                          >
                            {tag}
                          </Badge>
                        ))}
                      </div>

                      {/* Task Info */}
                      <div className="space-y-2 text-sm text-gray-600">
                        {task.deadline && (
                          <div className="flex items-center gap-2">
                            {isOverdue(task.deadline) && (
                              <AlertTriangle className="w-3 h-3 text-red-500" />
                            )}
                            <Clock className="w-3 h-3" />
                            <span className={isOverdue(task.deadline) ? "text-red-600 font-medium" : ""}>
                              {format(new Date(task.deadline), "d בMMMM", { locale: he })}
                            </span>
                          </div>
                        )}

                        {task.assigned_user && (
                          <div className="flex items-center gap-2">
                            <User className="w-3 h-3" />
                            <span>{task.assigned_user}</span>
                          </div>
                        )}
                      </div>

                      {/* Checklist Info */}
                      {task.checklist && task.checklist.length > 0 && (
                        <div className="flex items-center gap-2 text-xs text-gray-500 mt-3">
                          <CheckSquare className="w-3 h-3" />
                          <span>
                            {task.checklist.filter(i => i.completed).length} / {task.checklist.length} הושלמו
                          </span>
                        </div>
                      )}

                      {/* Status Change Buttons */}
                      <div className="flex gap-2 mt-4" onClick={(e) => e.stopPropagation()}>
                        {statuses.filter(s => s !== status).map(newStatus => (
                          <Button
                            key={newStatus}
                            variant="outline"
                            size="sm"
                            onClick={() => handleStatusChange(task.id, newStatus)}
                            className="text-xs px-2 py-1 h-6"
                          >
                            {statusConfig[newStatus].title}
                          </Button>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
