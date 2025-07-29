
import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table";
import {
  Circle,
  ArrowRight,
  CheckCircle,
  Clock,
  User,
  Edit,
  Trash2,
  AlertTriangle,
  CheckSquare,
  GripVertical
} from "lucide-react";
import { format, isBefore } from "date-fns";
import { he } from "date-fns/locale";
import { Skeleton } from "@/components/ui/skeleton";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";

const statusIcons = {
  "פתוח": <Circle className="w-4 h-4 text-gray-500" />,
  "בתהליך": <ArrowRight className="w-4 h-4 text-green-500" />,
  "הושלם": <CheckCircle className="w-4 h-4 text-gray-500" />
};

const statusColors = {
  "פתוח": "bg-gray-100 text-gray-800",
  "בתהליך": "bg-green-100 text-green-800",
  "הושלם": "bg-gray-200 text-gray-500"
};

const priorityColors = {
  "נמוכה": "bg-gray-100 text-gray-800",
  "רגילה": "bg-gray-200 text-gray-900",
  "גבוהה": "bg-orange-100 text-orange-800",
  "קריטית": "bg-red-100 text-red-800"
};

const tagStyleMap = {
  "דחוף": { backgroundColor: '#fee2e2', color: '#b91c1c', borderColor: '#fecaca' },
  "בוצע חלקית": { backgroundColor: '#ffedd5', color: '#c2410c', borderColor: '#fed7aa' },
  "הושלם": { backgroundColor: '#dcfce7', color: '#166534', borderColor: '#bbf7d0' },
};

export default function TasksList({ tasks, events, users, onEditTask, onTaskStatusChange, onDeleteTask, onSelectTask, onReorderTasks, onPriorityChange, isLoading, isCompletedList = false, canEdit, canDelete }) {
  const [isDragging, setIsDragging] = useState(false);

  const getEventName = (eventId) => {
    const event = events.find(e => e.id === eventId);
    return event ? event.name : "לא משויך";
  };

  const isOverdue = (deadline) => {
    return deadline && isBefore(new Date(deadline), new Date());
  };

  const handleDragStart = () => {
    setIsDragging(true);
  };

  const handleDragEnd = (result) => {
    setIsDragging(false);
    
    if (!result.destination) {
      return;
    }

    const sourceIndex = result.source.index;
    const destinationIndex = result.destination.index;

    if (sourceIndex === destinationIndex) {
      return;
    }

    // Call the parent function to handle reordering
    onReorderTasks(sourceIndex, destinationIndex);
  };

  if (isLoading && !isCompletedList) {
    return (
      <div className="overflow-x-auto">
        <div className="space-y-3">
          {Array(5).fill(0).map((_, i) => (
            <div key={i} className="p-4 border rounded-lg">
              <Skeleton className="h-4 w-full mb-2" />
              <Skeleton className="h-3 w-24 mb-2" />
              <Skeleton className="h-3 w-16" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <DragDropContext onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
        <Table>
          {!isCompletedList && (
            <TableHeader>
              <TableRow>
                <TableHead className="text-right">משימה</TableHead>
                <TableHead className="text-right">סטטוס</TableHead>
                <TableHead className="text-right">עדיפות</TableHead>
                <TableHead className="text-right">תאריך יעד</TableHead>
                <TableHead className="text-right">אחראי</TableHead>
                <TableHead className="text-right">אירוע</TableHead>
                <TableHead className="text-right">פעולות</TableHead>
                {!isCompletedList && <TableHead className="text-left w-8"></TableHead>}
              </TableRow>
            </TableHeader>
          )}
          <Droppable droppableId="tasks-table" isDropDisabled={isCompletedList}>
            {(provided, snapshot) => (
              <TableBody 
                {...provided.droppableProps} 
                ref={provided.innerRef}
                className={snapshot.isDraggingOver ? "bg-green-50" : ""}
              >
                {tasks.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8 text-gray-500">
                      אין משימות להציג
                    </TableCell>
                  </TableRow>
                ) : (
                  tasks.map((task, index) => (
                    <Draggable key={task.id} draggableId={task.id.toString()} index={index} isDragDisabled={isCompletedList}>
                      {(provided, snapshot) => {
                        const checklistProgress = task.checklist && task.checklist.length > 0
                          ? (task.checklist.filter(i => i.completed).length / task.checklist.length) * 100
                          : 0;

                        return (
                          <TableRow
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            className={`hover:bg-gray-50 ${
                              snapshot.isDragging ? "bg-green-100 shadow-lg" : ""
                            } ${isDragging && !snapshot.isDragging ? "opacity-50" : ""}
                            ${isCompletedList ? 'bg-gray-50' : ''}`}
                          >
                            <TableCell 
                              className="text-right cursor-pointer hover:text-green-600"
                              onClick={() => onSelectTask(task)}
                            >
                              <div className="space-y-2">
                                <div className={`font-medium text-gray-900 ${isCompletedList ? 'line-through' : ''}`}>
                                  {task.description}
                                </div>
                                {task.tags && task.tags.length > 0 && (
                                  <div className="flex justify-end flex-wrap gap-1">
                                    {task.tags.map((tag, index) => (
                                      <Badge
                                        key={index}
                                        variant="outline"
                                        className="text-xs"
                                        style={tagStyleMap[tag]}
                                      >
                                        {tag}
                                      </Badge>
                                    ))}
                                  </div>
                                )}
                                {task.checklist && task.checklist.length > 0 && (
                                  <div className="flex items-center justify-end gap-2 text-xs text-gray-500 mt-1">
                                    <Progress value={checklistProgress} className="w-24 h-1.5 scale-x-[-1]" />
                                    <span className="font-medium">
                                      {task.checklist.filter(i => i.completed).length}/{task.checklist.length}
                                    </span>
                                    <CheckSquare className="w-3 h-3" />
                                  </div>
                                )}
                              </div>
                            </TableCell>
                            <TableCell className="text-right">
                              <Select
                                value={task.status}
                                onValueChange={(newStatus) => onTaskStatusChange(task.id, newStatus)}
                                disabled={!canEdit}
                              >
                                <SelectTrigger className="w-32">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="פתוח">פתוח</SelectItem>
                                  <SelectItem value="בתהליך">בתהליך</SelectItem>
                                  <SelectItem value="הושלם">הושלם</SelectItem>
                                </SelectContent>
                              </Select>
                            </TableCell>
                            <TableCell className="text-right">
                              <Select
                                value={task.priority}
                                onValueChange={(newPriority) => onPriorityChange(task.id, newPriority)}
                                disabled={!canEdit}
                              >
                                <SelectTrigger className="w-32">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    {["נמוכה", "רגילה", "גבוהה", "קריטית"].map(p => (
                                        <SelectItem key={p} value={p}>{p}</SelectItem>
                                    ))}
                                </SelectContent>
                              </Select>
                            </TableCell>
                            <TableCell className="text-right">
                                {task.deadline ? (
                                  <div className={`flex items-center justify-end gap-1 ${isOverdue(task.deadline) ? 'text-red-600' : 'text-gray-600'}`}>
                                    {isOverdue(task.deadline) && (
                                      <AlertTriangle className="w-3 h-3 text-red-500" />
                                    )}
                                    {format(new Date(task.deadline), "d בMMMM yyyy", { locale: he })}
                                    <Clock className="w-3 h-3" />
                                  </div>
                                ) : (
                                  <span className="text-gray-400">לא נקבע</span>
                                )}
                              </TableCell>
                              <TableCell className="text-right">
                                {task.assigned_user ? (
                                  <div className="flex items-center justify-end gap-1">
                                    <span className="text-sm">{task.assigned_user}</span>
                                    <User className="w-3 h-3 text-gray-400" />
                                  </div>
                                ) : (
                                  <span className="text-gray-400">לא משויך</span>
                                )}
                              </TableCell>
                              <TableCell className="text-right">
                                <span className="text-sm text-gray-600">
                                  {getEventName(task.event_id)}
                                </span>
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="flex justify-end gap-1">
                                {canEdit && (
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={(e) => {e.stopPropagation(); onEditTask(task)}}
                                    className="h-8 w-8 p-0"
                                  >
                                    <Edit className="w-3 h-3" />
                                  </Button>
                                )}
                                {canDelete && (
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={(e) => {e.stopPropagation(); onDeleteTask(task.id)}}
                                    className="h-8 w-8 p-0 text-gray-400 hover:text-red-600"
                                  >
                                    <Trash2 className="w-3 h-3" />
                                  </Button>
                                )}
                              </div>
                            </TableCell>
                            {!isCompletedList && (
                              <TableCell className="text-left">
                                <div
                                  {...provided.dragHandleProps}
                                  className="cursor-grab active:cursor-grabbing p-1 rounded hover:bg-gray-200"
                                >
                                  <GripVertical className="w-4 h-4 text-gray-400" />
                                </div>
                              </TableCell>
                            )}
                          </TableRow>
                        );
                      }}
                    </Draggable>
                  ))
                )}
                {provided.placeholder}
              </TableBody>
            )}
          </Droppable>
        </Table>
      </DragDropContext>
    </div>
  );
}
