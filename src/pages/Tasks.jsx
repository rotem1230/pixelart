
import React, { useState, useEffect } from "react";
import { Task } from "@/api/entities";
import { Event } from "@/api/entities";
import { User } from "@/api/entities";
import { WorkHours } from "@/api/entities";
import { Button } from "@/components/ui/button";
import { Plus, CheckCircle2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { GripVertical } from 'lucide-react';
import { Clock, Square as StopIcon } from 'lucide-react';
import { differenceInMinutes, format } from 'date-fns';

import TaskForm from "../components/tasks/TaskForm";
import TasksList from "../components/tasks/TasksList";
import TaskFilters from "../components/tasks/TaskFilters";
import TaskDetailsModal from "../components/tasks/TaskDetailsModal";

// Timer Display Component for Tasks page
function TimerDisplay({ user, onStopTimer }) {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [workHourEntry, setWorkHourEntry] = useState(null);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    const loadWorkHourEntry = async () => {
      if (user?.active_timer_id) {
        try {
          const workHour = await WorkHours.get(user.active_timer_id);
          setWorkHourEntry(workHour);
        } catch (error) {
          console.error("Error loading work hour entry:", error);
        }
      } else {
        setWorkHourEntry(null); // Clear if no active timer
      }
    };

    loadWorkHourEntry(); // Initial load
    return () => clearInterval(interval); // Cleanup interval
  }, [user?.active_timer_id, user]); // Depend on user and active_timer_id for re-loading

  const getElapsedTime = () => {
    if (!workHourEntry) return "00:00:00";
    
    // Ensure date part is included for correct parsing in all environments
    const startTimeStr = `${workHourEntry.date}T${workHourEntry.start_time}`;
    const startTime = new Date(startTimeStr);

    // Calculate total minutes difference including partial hours
    const totalMilliseconds = currentTime.getTime() - startTime.getTime();
    if (totalMilliseconds < 0) return "00:00:00"; // Should not happen if timer is running

    const totalSeconds = Math.floor(totalMilliseconds / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  const isTimerActive = user?.active_timer_id && user?.active_timer_event_name;

  return (
    <Card className="bg-white/90 backdrop-blur-sm shadow-md border border-gray-200">
      <div className="p-3 flex items-center gap-3">
        <div className="flex items-center gap-2">
          {isTimerActive ? (
            <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
          ) : (
            <div className="w-3 h-3 bg-gray-300 rounded-full"></div>
          )}
          <Clock className="w-4 h-4 text-gray-600" />
        </div>
        
        <div className="flex flex-col min-w-[120px]">
          <div className="font-mono text-sm font-bold text-gray-900">
            {isTimerActive ? getElapsedTime() : "00:00:00"}
          </div>
          <div className="text-xs text-gray-600 truncate">
            {isTimerActive ? user.active_timer_event_name : "לא פעיל"}
          </div>
        </div>
        
        {isTimerActive && (
          <Button
            onClick={onStopTimer}
            size="sm"
            className="bg-red-600 hover:bg-red-700 h-7 px-2 text-xs"
          >
            <StopIcon className="w-3 h-3" />
          </Button>
        )}
      </div>
    </Card>
  );
}

export default function Tasks() {
  const [tasks, setTasks] = useState([]);
  const [events, setEvents] = useState([]);
  const [users, setUsers] = useState([]);
  const [user, setUser] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [selectedTask, setSelectedTask] = useState(null);
  const [filters, setFilters] = useState({
    status: "all",
    priority: "all",
    assignedUser: "all",
    event: "all"
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [tasksData, eventsData, usersData, userData] = await Promise.all([
        Task.getAll(),
        Event.getAll(),
        Promise.resolve([]).catch(() => []),
        User.getCurrentUser().catch(() => null)
      ]);
      
      // Sort tasks by sort_order or creation date
      const sortedTasks = tasksData.sort((a, b) => {
        if (a.sort_order && b.sort_order) {
          return a.sort_order - b.sort_order;
        }
        return new Date(b.created_at || 0) - new Date(a.created_at || 0);
      });
      setTasks(sortedTasks);
      setEvents(eventsData);
      setUsers(usersData);
      setUser(userData);
    } catch (error) {
      console.error("Error loading data:", error);
    }
    setIsLoading(false);
  };

  const handleTaskSubmit = async (taskData) => {
    try {
      if (editingTask) {
        const updatedTask = await Task.update(editingTask.id, taskData);
        setTasks(prevTasks => 
          prevTasks.map(t => t.id === editingTask.id ? updatedTask : t)
        );
      } else {
        const newTask = await Task.create(taskData);
        setTasks(prevTasks => [...prevTasks, newTask]);
      }
      setShowForm(false);
      setEditingTask(null);
    } catch (error) {
      console.error("Error saving task:", error);
      // רק במקרה של שגיאה נטען הכל מחדש
      await loadData();
    }
  };

  const handleTaskStatusChange = async (taskId, newStatus) => {
    try {
      const updatedTask = await Task.update(taskId, { status: newStatus });
      setTasks(prevTasks => 
        prevTasks.map(t => t.id === taskId ? updatedTask : t)
      );
    } catch (error) {
      console.error("Error updating task status:", error);
      await loadData();
    }
  };

  const handleTaskPriorityChange = async (taskId, newPriority) => {
    try {
      await Task.update(taskId, { priority: newPriority });
      setTasks(prevTasks => 
        prevTasks.map(t => t.id === taskId ? { ...t, priority: newPriority } : t)
      );
    } catch (error) {
      console.error("Error updating task priority:", error);
      await loadData(); // רק במקרה של שגיאה
    }
  };

  const handleEditTask = (task) => {
    setEditingTask(task);
    setShowForm(true);
  };
  
  const handleDeleteTask = async (taskId) => {
    if (confirm("האם אתה בטוח שברצונך למחוק את המשימה?")) {
        try {
            await Task.delete(taskId);
            setTasks(prevTasks => prevTasks.filter(t => t.id !== taskId));
        } catch (error) {
            console.error("Error deleting task:", error);
            await loadData();
        }
    }
  };
  
  const handlePermanentDeleteTask = async (taskId) => {
    if (confirm("האם אתה בטוח שברצונך למחוק את המשימה לצמיתות? לא ניתן לשחזר פעולה זו.")) {
      try {
        await Task.delete(taskId);
        setTasks(prevTasks => prevTasks.filter(t => t.id !== taskId));
      } catch (error) {
        console.error("Error permanently deleting task:", error);
        await loadData();
      }
    }
  };

  const handleSelectTask = (task) => {
    setSelectedTask(task);
  };
  
  const handleTaskUpdate = (updatedTask) => {
    setTasks(prevTasks => 
        prevTasks.map(t => t.id === updatedTask.id ? updatedTask : t)
    );
  };

  const handleReorderTasks = async (sourceIndex, destinationIndex) => {
    // Ensure indices are within bounds
    if (sourceIndex < 0 || sourceIndex >= filteredActiveTasks.length ||
        destinationIndex < 0 || destinationIndex >= filteredActiveTasks.length) {
      console.warn("Invalid indices for task reorder.");
      return;
    }

    const reorderedTasks = Array.from(filteredActiveTasks);
    const [movedTask] = reorderedTasks.splice(sourceIndex, 1);
    reorderedTasks.splice(destinationIndex, 0, movedTask);

    // Update sort order for all affected tasks based on their new relative position in the filtered list
    const tasksToUpdate = reorderedTasks.map((task, index) => ({
      ...task,
      sort_order: index // Assign new sort_order based on the reordered filtered list index
    }));

    // Optimistically update UI
    setTasks(prevTasks => {
      const updatedTasks = [...prevTasks]; // Create a mutable copy of the full tasks array
      tasksToUpdate.forEach(updatedTask => {
        const taskIndex = updatedTasks.findIndex(t => t.id === updatedTask.id);
        if (taskIndex !== -1) {
          // Replace the task in the full list with the one containing the new sort_order
          updatedTasks[taskIndex] = updatedTask;
        } else {
          // If the task wasn't in the original full list (e.g., due to filter), add it if needed
          updatedTasks.push(updatedTask);
        }
      });
      // Ensure the tasks array is correctly sorted by sort_order after updates
      return updatedTasks.sort((a, b) => a.sort_order - b.sort_order);
    });

    // Update in backend
    try {
      await Promise.all(
        tasksToUpdate.map(task => 
          Task.update(task.id, { sort_order: task.sort_order })
        )
      );
    } catch (error) {
      console.error("Error updating task order:", error);
      // Reload data if update fails to revert to server's state
      await loadData();
    }
  };

  const handleStopTimer = async () => {
    if (!user || !user.active_timer_id) return;
    try {
        // Fetch the active work hour entry
        const activeWorkHour = await WorkHours.get(user.active_timer_id);
        const startTime = new Date(`${activeWorkHour.date}T${activeWorkHour.start_time}`);
        const endTime = new Date();

        // Calculate total minutes and convert to hours
        const totalMinutes = differenceInMinutes(endTime, startTime);
        const hoursWorked = totalMinutes / 60;

        // Update work hours entry
        await WorkHours.update(user.active_timer_id, {
            end_time: format(endTime, 'HH:mm:ss'),
            hours_worked: parseFloat(hoursWorked.toFixed(2)),
            status: 'נרשם'
        });

        // Clear timer from user data
        const updatedUser = { 
            ...user, 
            active_timer_id: null, 
            active_timer_event_id: null,
            active_timer_event_name: null
        };
        localStorage.setItem('currentUser', JSON.stringify(updatedUser));
        setUser(updatedUser);

    } catch (error) {
        console.error("Error stopping timer:", error);
        
        // Provide more specific error messages
        if (error.message?.includes('WorkHours')) {
            alert("שגיאה בשמירת שעות העבודה. אנא נסה שוב.");
        } else if (error.message?.includes('User')) {
            alert("שגיאה בעדכון נתוני המשתמש. אנא נסה שוב.");
        } else {
            alert("שגיאה בעצירת הטיימר. אנא רענן את העמוד ונסה שוב.");
        }

        // Try to reload user data
        try {
            const userData = await User.getCurrentUser();
            setUser(userData);
        } catch (reloadError) {
            console.error("Failed to reload user data:", reloadError);
        }
    }
  };

  const activeTasks = tasks.filter(task => task.status !== 'הושלם');
  const completedTasks = tasks.filter(task => task.status === 'הושלם');

  const filteredActiveTasks = activeTasks.filter(task => {
    const statusMatch = filters.status === "all" || task.status === filters.status;
    const priorityMatch = filters.priority === "all" || task.priority === filters.priority;
    const userMatch = filters.assignedUser === "all" || task.assigned_user === filters.assignedUser;
    const eventMatch = filters.event === "all" || task.event_id === filters.event;
    
    return statusMatch && priorityMatch && userMatch && eventMatch;
  });

  return (
    <div className="p-6 lg:p-8 space-y-6" dir="rtl">
      {/* Header */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
        <div className="flex flex-col gap-2">
          <TimerDisplay user={user} onStopTimer={handleStopTimer} />
          <h1 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-2">
            ניהול משימות
          </h1>
        </div>
        
        <div className="flex items-center gap-4">
              <Button
                onClick={() => setShowForm(true)}
                className="gap-2 bg-green-600 hover:bg-green-700"
              >
                <Plus className="w-4 h-4" />
                משימה חדשה
              </Button>
        </div>
      </div>

      {/* Task Form */}
      {showForm && (
        <TaskForm
          task={editingTask}
          events={events}
          users={users}
          onSubmit={handleTaskSubmit}
          onCancel={() => {
            setShowForm(false);
            setEditingTask(null);
          }}
        />
      )}

      {/* Filters */}
      <TaskFilters
        filters={filters}
        onFiltersChange={setFilters}
        events={events}
        users={users}
      />

      {/* Active Tasks List */}
      <TasksList
        tasks={filteredActiveTasks}
        events={events}
        users={users}
        onEditTask={handleEditTask}
        onTaskStatusChange={handleTaskStatusChange}
        onDeleteTask={handleDeleteTask}
        onSelectTask={handleSelectTask}
        onReorderTasks={handleReorderTasks}
        onPriorityChange={handleTaskPriorityChange}
        isLoading={isLoading}
        canEdit={user?.role === 'admin' || user?.permissions?.can_edit_tasks}
        canDelete={user?.role === 'admin' || user?.permissions?.can_delete_tasks}
      />
      
      {/* Completed Tasks Section */}
      {completedTasks.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-green-600" />
              משימות שהושלמו
            </CardTitle>
          </CardHeader>
          <CardContent>
            <TasksList
              tasks={completedTasks}
              events={events}
              users={users}
              onEditTask={handleEditTask}
              onTaskStatusChange={handleTaskStatusChange}
              onDeleteTask={handlePermanentDeleteTask} // Permanent delete for completed
              onSelectTask={handleSelectTask}
              onReorderTasks={() => {}} // No reordering for completed
              onPriorityChange={handleTaskPriorityChange}
              isLoading={isLoading}
              isCompletedList={true}
              canEdit={user?.role === 'admin' || user?.permissions?.can_edit_tasks}
              canDelete={user?.role === 'admin'} // Only admin can permanently delete
            />
          </CardContent>
        </Card>
      )}

      {/* Task Details Modal */}
      {selectedTask && (
        <TaskDetailsModal 
          task={selectedTask}
          onClose={() => setSelectedTask(null)}
          onUpdate={handleTaskUpdate}
        />
      )}
    </div>
  );
}
