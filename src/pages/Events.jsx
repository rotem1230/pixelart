
import React, { useState, useEffect } from "react";
import { Event } from "@/api/entities";
import { Task } from "@/api/entities";
import { User } from "@/api/entities";
import { Client } from "@/api/entities"; // Import Client entity
import { WorkHours as WorkHoursEntity } from "@/api/entities";
import { Tag } from "@/api/entities";
import { PersonalMessage } from "@/api/entities"; // Import PersonalMessage entity
import { Button } from "@/components/ui/button";
import { Plus, Calendar, MapPin, ExternalLink, Edit, Trash2, Play, Clock, Square as StopIcon, Check, Image as ImageIcon, Archive, X } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { format, differenceInHours, differenceInMinutes } from "date-fns";
import { he } from "date-fns/locale";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";

import EventForm from "../components/events/EventForm";
import EventCard from "../components/events/EventCard";
import Comments from "../components/shared/Comments"; // Import Comments component

// New Kanban column configurations
const columnsConfig = {
  "משימות קרובים - לפי קדימות": { color: "bg-green-100 text-green-800", borderColor: "border-green-300" },
  "לסיים היום/מחכה לך": { color: "bg-green-200 text-green-900", borderColor: "border-green-400" },
  "סיימתי - לבדיקה": { color: "bg-gray-100 text-gray-800", borderColor: "border-gray-300" },
  "בוטל": { color: "bg-red-100 text-red-800", borderColor: "border-red-300" }
};

const columnOrder = ["משימות קרובים - לפי קדימות", "לסיים היום/מחכה לך", "סיימתי - לבדיקה", "בוטל"];

// Helper function to create page URLs - assuming a simple routing structure
const createPageUrl = (pageName) => {
  switch (pageName) {
    case "Events":
      return "/events"; // Adjust based on your actual routing path for events
    default:
      return "/";
  }
};


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
          const workHour = await WorkHoursEntity.get(user.active_timer_id);
          setWorkHourEntry(workHour);
        } catch (error) {
          console.error("Error loading work hour entry:", error);
        }
      } else {
        setWorkHourEntry(null); // Clear work hour entry if no active timer
      }
    };

    loadWorkHourEntry();
    return () => clearInterval(interval);
  }, [user?.active_timer_id, user?.active_timer_event_id]); // Added active_timer_event_id as dependency to re-fetch if timer changes

  const getElapsedTime = () => {
    if (!workHourEntry) return "00:00:00";

    // Ensure that startTime is a valid Date object.
    // If workHourEntry.date and workHourEntry.start_time are strings, concatenate them.
    const startTimeString = `${workHourEntry.date}T${workHourEntry.start_time}`;
    const startTime = new Date(startTimeString);

    if (isNaN(startTime.getTime())) {
      console.error("Invalid start time:", startTimeString);
      return "00:00:00";
    }

    const totalSeconds = differenceInMinutes(currentTime, startTime) * 60 + Math.floor((currentTime - startTime) / 1000) % 60;

    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor(totalSeconds % 3600 / 60);
    const seconds = totalSeconds % 60;

    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  const isTimerActive = user?.active_timer_id && user?.active_timer_event_name;

  return (
    <Card className="bg-white/90 backdrop-blur-sm shadow-md border border-gray-200">
      <div className="p-3 flex items-center gap-3">
        <div className="flex items-center gap-2">
          {isTimerActive ?
          <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div> :

          <div className="w-3 h-3 bg-gray-300 rounded-full"></div>
          }
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
        
        {isTimerActive &&
        <Button
          onClick={onStopTimer}
          size="sm"
          className="bg-red-600 hover:bg-red-700 h-7 px-2 text-xs">

            <StopIcon className="w-3 h-3" />
          </Button>
        }
      </div>
    </Card>);

}

export default function Events() {
  const [eventsByStatus, setEventsByStatus] = useState({}); // Stores events grouped by their Kanban column status
  const [tasks, setTasks] = useState([]);
  const [clients, setClients] = useState([]); // Add state for clients
  const [showForm, setShowForm] = useState(false);
  const [editingEvent, setEditingEvent] = useState(null);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [tagColors, setTagColors] = useState({}); // State for dynamic tag colors
  const [availableTags, setAvailableTags] = useState([]); // State for filter (though filters are removed in this Kanban view)
  const [isAdmin, setIsAdmin] = useState(false); // State to track admin status

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [eventsData, tasksData, userData, tagsData, clientsData] = await Promise.all([
      Event.getAll(),
      Task.getAll(),
      User.getCurrentUser().catch(() => null),
      Tag.getAll(),
      Client.getAll()
      ]);

      // Filter unarchived events first
      const unarchivedEvents = eventsData.filter(event => !event.is_archived);
      
      // Group events by their status (which should now correspond to column names)
      const groupedEvents = unarchivedEvents.reduce((acc, event) => {
        // If event.status is not one of the defined column names, default to the first column
        const status = columnOrder.includes(event.status) ? event.status : columnOrder[0];
        if (!acc[status]) {
          acc[status] = [];
        }
        acc[status].push(event);
        return acc;
      }, {});

      // Ensure all columns exist in the state, even if empty
      const initialEventsByStatus = columnOrder.reduce((acc, colId) => {
        acc[colId] = groupedEvents[colId] || [];
        return acc;
      }, {});
      setEventsByStatus(initialEventsByStatus);

      setTasks(tasksData);
      setClients(clientsData); // Set clients state
      setUser(userData);
      setIsAdmin(userData?.role === 'admin'); // Set admin status based on role

      // Define a default color for "רגיל" or if a tag's color is missing
      const defaultTagColorStyle = {
        backgroundColor: "rgb(243 244 246)", // Tailwind bg-gray-100
        color: "rgb(55 65 81)", // Tailwind text-gray-800
        borderColor: "rgb(229 231 235)" // Tailwind border-gray-200
      };

      // Create a color map from fetched tags
      const colorMap = tagsData.reduce((acc, tag) => {
        acc[tag.name] = {
          backgroundColor: tag.color,
          color: tag.text_color,
          borderColor: tag.color
        };
        return acc;
      }, {});

      // Ensure "רגיל" tag has a fallback color if not explicitly defined
      if (!colorMap["רגיל"]) {
        colorMap["רגיל"] = defaultTagColorStyle;
      }

      setTagColors(colorMap);
      setAvailableTags(tagsData.map((t) => t.name));

    } catch (error) {
      console.error("Error loading data:", error);
    }
    setIsLoading(false);
  };

  const clientMap = React.useMemo(() =>
  clients.reduce((acc, client) => ({ ...acc, [client.id]: client.name }), {}),
  [clients]);

  const handleEventSubmit = async (eventData) => {
    try {
      let updatedEvent;
      if (editingEvent) {
        updatedEvent = await Event.update(editingEvent.id, eventData);
        // עדכן את האירוע ברשימה המקומית
        setEventsByStatus((prevEventsByStatus) => {
          const newStatus = columnOrder.includes(updatedEvent.status) ? updatedEvent.status : columnOrder[0];
          const oldStatus = columnOrder.includes(editingEvent.status) ? editingEvent.status : columnOrder[0];

          const newEventsByStatus = { ...prevEventsByStatus };
          // הסר מהעמודה הישנה
          if (oldStatus !== newStatus) {
            newEventsByStatus[oldStatus] = (newEventsByStatus[oldStatus] || []).filter((e) => e.id !== updatedEvent.id);
          }
          // הוסף לעמודה החדשה או עדכן במקום
          newEventsByStatus[newStatus] = oldStatus === newStatus ?
          (newEventsByStatus[newStatus] || []).map((e) => e.id === updatedEvent.id ? updatedEvent : e) :
          [...(newEventsByStatus[newStatus] || []), updatedEvent];

          // Ensure events are sorted after updates if order is relevant, though DND handles sort_order on drag
          // For simple adds/updates, we might not re-sort locally
          return newEventsByStatus;
        });

        if (selectedEvent && selectedEvent.id === updatedEvent.id) {
          setSelectedEvent(updatedEvent);
        }
      } else {
        const newEvent = await Event.create(eventData);
        const newStatus = columnOrder.includes(newEvent.status) ? newEvent.status : columnOrder[0];
        setEventsByStatus((prevEventsByStatus) => ({
          ...prevEventsByStatus,
          [newStatus]: [...(prevEventsByStatus[newStatus] || []), newEvent]
        }));
      }
      setShowForm(false);
      setEditingEvent(null);
    } catch (error) {
      console.error("Error saving event:", error);
      await loadData(); // רק במקרה של שגיאה
    }
  };

  const handleEditEvent = (event) => {
    setEditingEvent(event);
    setShowForm(true);
    setSelectedEvent(null); // Close the details modal if open
  };

  const handleArchiveEvent = async (eventId) => {
    if (confirm("האם אתה בטוח שברצונך להעביר את האירוע לארכיון?")) {
      try {
        await Event.update(eventId, { is_archived: true });
        // הסר את האירוע מהתצוגה המקומית
        setEventsByStatus((prevEventsByStatus) => {
          const newEventsByStatus = { ...prevEventsByStatus };
          Object.keys(newEventsByStatus).forEach((status) => {
            newEventsByStatus[status] = newEventsByStatus[status].filter((e) => e.id !== eventId);
          });
          return newEventsByStatus;
        });
        setSelectedEvent(null);
      } catch (error) {
        console.error("Error archiving event:", error);
        await loadData();
      }
    }
  };

  const handleDeleteEvent = async (eventId) => {
    if (confirm("האם אתה בטוח שברצונך למחוק את האירוע? פעולה זו לא ניתנת לביקול.")) {
      try {
        await Event.delete(eventId);
        // Remove the event from the local state
        setEventsByStatus((prevEventsByStatus) => {
          const newEventsByStatus = { ...prevEventsByStatus };
          Object.keys(newEventsByStatus).forEach((status) => {
            newEventsByStatus[status] = newEventsByStatus[status].filter((e) => e.id !== eventId);
          });
          return newEventsByStatus;
        });
        setSelectedEvent(null); // Close the details modal
      } catch (error) {
        console.error("Error deleting event:", error);
        loadData(); // Revert UI on error
      }
    }
  };

  const handleDragEnd = async (result) => {
    const { source, destination, draggableId } = result;

    if (!destination) {
      return;
    }

    const sourceColumnId = source.droppableId;
    const destColumnId = destination.droppableId;

    // Optimistic UI update
    const newEventsByStatus = { ...eventsByStatus };
    const sourceEvents = Array.from(newEventsByStatus[sourceColumnId] || []);
    const [movedEvent] = sourceEvents.splice(source.index, 1);

    if (sourceColumnId === destColumnId) {
      // Reordering within the same column
      sourceEvents.splice(destination.index, 0, movedEvent);
      newEventsByStatus[sourceColumnId] = sourceEvents;
    } else {
      // Moving to a different column
      const destEvents = Array.from(newEventsByStatus[destColumnId] || []);
      destEvents.splice(destination.index, 0, { ...movedEvent, status: destColumnId });
      newEventsByStatus[sourceColumnId] = sourceEvents;
      newEventsByStatus[destColumnId] = destEvents;
    }

    setEventsByStatus(newEventsByStatus);

    // Backend Update
    try {
      // Update event's status to the new column
      await Event.update(draggableId, { status: destColumnId });

      // Check if event moved to "סיימתי - לבדיקה" and notify admin
      if (destColumnId === "סיימתי - לבדיקה" && user?.role !== 'admin') {
        try {
          // Mock admin users for now
          const adminUsers = [];
          
          // Send notification to each admin
          const notificationPromises = adminUsers.map(admin => 
            PersonalMessage.create({
              recipient_id: admin.id,
              sender_name: user?.full_name || user?.email || "משתמש",
              title: "אירוע מוכן לבדיקה",
              content: `האירוע "${movedEvent.name}" הועבר לעמודת "סיימתי - לבדיקה" ומחכה לאישור שלך.`,
              context_link: createPageUrl("Events"),
              context_text: `אירוע: ${movedEvent.name}`,
              priority: "גבוהה"
            })
          );
          
          await Promise.all(notificationPromises);
        } catch (notificationError) {
          console.error("Error sending admin notification:", notificationError);
          // Don't fail the main operation if notification fails
        }
      }

      // Update sort order for events in both affected columns
      // This assumes a 'sort_order' field exists on the Event entity and is managed by the backend
      const updatePromises = [];
      // Only update sort_order for the events in the columns affected.
      // It's crucial to send the current *UI* order to the backend.
      if (newEventsByStatus[sourceColumnId]) {
        newEventsByStatus[sourceColumnId].forEach((event, index) => {
          updatePromises.push(Event.update(event.id, { sort_order: index }));
        });
      }
      if (sourceColumnId !== destColumnId && newEventsByStatus[destColumnId]) {
        newEventsByStatus[destColumnId].forEach((event, index) => {
          updatePromises.push(Event.update(event.id, { sort_order: index }));
        });
      }
      await Promise.all(updatePromises);

    } catch (error) {
      console.error("Error updating event after drag:", error);
      loadData(); // Revert UI on error by reloading data
    }
  };

  const handleMarkAsCompleted = async (event) => {
    try {
      const updatedEvent = await Event.update(event.id, { is_completed: !event.is_completed });
      setEventsByStatus((prevEventsByStatus) => {
        const status = columnOrder.includes(event.status) ? event.status : columnOrder[0];
        return {
          ...prevEventsByStatus,
          [status]: prevEventsByStatus[status].map((e) => e.id === event.id ? updatedEvent : e)
        };
      });
    } catch (error) {
      console.error("Error marking event as completed:", error);
      await loadData();
    }
  };

  // Function to start the timer for an event
  const handleStartTimer = async (event) => {
    if (!user) {
      alert("שגיאה: לא ניתן לאתר פרטי משתמש.");
      return;
    }
    if (user.active_timer_id) {
      alert("יש לך כבר טיימר שרץ על אירוע אחר.");
      return;
    }
    try {
      const newWorkHour = await WorkHoursEntity.create({
        event_id: event.id,
        user_id: user.id,
        date: format(new Date(), 'yyyy-MM-dd'),
        start_time: format(new Date(), 'HH:mm:ss'),
        status: "בתהליך"
      });
      const updatedUser = { 
        ...user, 
        active_timer_id: newWorkHour.id,
        active_timer_event_id: event.id,
        active_timer_event_name: event.name
      };
      localStorage.setItem('currentUser', JSON.stringify(updatedUser));
      setUser(updatedUser);
      // Instead of reloading all data, just update the user state locally
      setUser((prevUser) => ({
        ...prevUser,
        active_timer_id: newWorkHour.id,
        active_timer_event_id: event.id,
        active_timer_event_name: event.name
      }));
    } catch (error) {
      console.error("Error starting timer:", error);
      alert("שגיאה בהפעלת הטיימר.");
    }
  };

  // Function to stop the active timer
  const handleStopTimer = async () => {
    if (!user || !user.active_timer_id) return;
    try {
      // Fetch the active work hour entry
      const activeWorkHour = await WorkHoursEntity.get(user.active_timer_id);
      const startTime = new Date(`${activeWorkHour.date}T${activeWorkHour.start_time}`);
      const endTime = new Date();

      // Calculate total minutes worked
      const totalMinutes = differenceInMinutes(endTime, startTime);
      const hoursWorked = totalMinutes / 60;

      // Update the work hour entry with end time and hours worked
      await WorkHoursEntity.update(user.active_timer_id, {
        end_time: format(endTime, 'HH:mm:ss'),
        hours_worked: parseFloat(hoursWorked.toFixed(2)),
        status: 'נרשם'
      });

      // Clear active timer from user profile
      const updatedUser = { 
        ...user, 
        active_timer_id: null,
        active_timer_event_id: null,
        active_timer_event_name: null
      };
      localStorage.setItem('currentUser', JSON.stringify(updatedUser));
      setUser(updatedUser);

      // Update local user state
      setUser(prevUser => ({
        ...prevUser,
        active_timer_id: null,
        active_timer_event_id: null,
        active_timer_event_name: null
      }));

      // Close selected event modal if open
      if (selectedEvent) {
        setSelectedEvent(null);
      }

    } catch (error) {
      console.error("Error stopping timer:", error);
      
      // More specific error handling
      if (error.message?.includes('WorkHours')) {
        alert("שגיאה בעדכון רישום השעות. אנא נסה שוב.");
      } else if (error.message?.includes('User')) {
        alert("שגיאה בעדכון פרטי המשתמש. אנא נסה שוב.");
      } else {
        alert("שגיאה בעצירת הטיימר. אנא נסה שוב או פנה למנהל המערכת.");
      }

      // Try to reload user data to sync state
      try {
        const userData = await User.getCurrentUser();
        setUser(userData);
      } catch (reloadError) {
        console.error("Failed to reload user data:", reloadError);
      }
    }
  };

  const handleChecklistItemToggle = async (event, itemIndex) => {
    const updatedChecklist = [...event.checklist];
    updatedChecklist[itemIndex].completed = !updatedChecklist[itemIndex].completed;

    try {
      const updatedEvent = await Event.update(event.id, { checklist: updatedChecklist });
      setSelectedEvent(updatedEvent); // Update the state for the modal

      // Update the main eventsByStatus list to reflect the change
      setEventsByStatus((prevEventsByStatus) => {
        const newStatus = columnOrder.includes(updatedEvent.status) ? updatedEvent.status : columnOrder[0];
        return {
          ...prevEventsByStatus,
          [newStatus]: prevEventsByStatus[newStatus].map((e) => e.id === event.id ? updatedEvent : e)
        };
      });
    } catch (error) {
      console.error("Error updating checklist item:", error);
    }
  };

  const handleManagerChecklistItemToggle = async (event, itemIndex) => {
    const updatedChecklist = [...event.manager_checklist];
    updatedChecklist[itemIndex].completed = !updatedChecklist[itemIndex].completed;

    try {
      const updatedEvent = await Event.update(event.id, { manager_checklist: updatedChecklist });
      setSelectedEvent(updatedEvent);

      setEventsByStatus((prevEventsByStatus) => {
        const status = columnOrder.includes(updatedEvent.status) ? updatedEvent.status : columnOrder[0];
        return {
          ...prevEventsByStatus,
          [status]: prevEventsByStatus[status].map((e) => e.id === event.id ? updatedEvent : e)
        };
      });
    } catch (error) {
      console.error("Error updating manager checklist item:", error);
    }
  };

  const getEventTasks = (eventId) => {
    return tasks.filter((task) => task.event_id === eventId);
  };

  // Function to handle adding a new client from the EventForm
  const handleAddNewClient = async (clientName) => {
    if (!clientName || clientName.trim() === "") {
      console.warn("Client name cannot be empty.");
      return null;
    }
    try {
      // Check if client already exists to prevent duplicates
      const existingClient = clients.find((c) => c.name === clientName);
      if (existingClient) {
        console.log(`Client '${clientName}' already exists. Returning existing client.`);
        return existingClient;
      }

      const newClient = await Client.create({ name: clientName });
      setClients((prevClients) => [...prevClients, newClient]);
      console.log("New client added:", newClient);
      return newClient; // Return the newly created client
    } catch (error) {
      console.error("Error adding new client:", error);
      alert(`שגיאה בהוספת לקוח: ${error.message || error}`);
      return null;
    }
  };

  return (
    <div className="p-6 lg:p-8 space-y-6" dir="rtl">
      {/* Header */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
        <div>
          <h1 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-2">
            ניהול אירועים
          </h1>
        </div>

        <div className="flex items-center gap-4">
            <TimerDisplay user={user} onStopTimer={handleStopTimer} />
          <Button
            onClick={() => setShowForm(true)}
            className="gap-2 bg-green-600 hover:bg-green-700">
                <Plus className="w-4 h-4" />
                אירוע חדש
          </Button>
        </div>
      </div>

      {/* Event Form */}
      {showForm &&
      <EventForm
        event={editingEvent}
        onSubmit={handleEventSubmit}
        onCancel={() => {
          setShowForm(false);
          setEditingEvent(null);
        }}
        clients={clients} // Pass clients to the form
        onClientAdded={handleAddNewClient} // Pass the new client add handler
        isAdmin={isAdmin} />

      }

      {/* Kanban Board */}
      <DragDropContext onDragEnd={handleDragEnd}>
        <div className="flex gap-6 overflow-x-auto pb-4">
          {isLoading ?
          Array(4).fill(0).map((_, colIdx) =>
          <div key={colIdx} className="flex-shrink-0 w-80">
                <Card className="bg-gray-50 border-gray-200 animate-pulse">
                  <CardHeader className="pb-3">
                    <div className="h-6 bg-gray-200 rounded w-3/4 mb-2"></div>
                    <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                  </CardHeader>
                  <CardContent className="space-y-3 p-2">
                    {Array(3).fill(0).map((_, cardIdx) =>
                <div key={cardIdx} className="p-4 bg-gray-200 rounded-md h-32"></div>
                )}
                  </CardContent>
                </Card>
              </div>
          ) :

          columnOrder.map((columnId) => {
            const column = { id: columnId, title: columnId };
            const events = eventsByStatus[column.id] || [];
            const config = columnsConfig[column.id];

            return (
              <Droppable key={column.id} droppableId={column.id}>
                  {(provided, snapshot) =>
                <div
                  ref={provided.innerRef}
                  {...provided.droppableProps}
                  className={`flex-shrink-0 w-80 rounded-lg ${snapshot.isDraggingOver ? 'bg-green-50' : 'bg-gray-50'}`}>

                      <Card className="bg-transparent border-0 h-full flex flex-col">
                        <CardHeader className={`pb-3 border-b-2 ${config?.borderColor || 'border-gray-300'}`}>
                          <CardTitle className="flex items-center justify-between">
                            <span className="text-lg font-semibold">
                              {column.title === "משימות קרובים - לפי קדימות" ? "קרובים - לפי קדימות" : column.title}
                            </span>
                            <Badge variant="secondary" className={`${config?.color} border-0`}>
                              {events.length}
                            </Badge>
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="p-2 space-y-3 flex-1 overflow-y-auto">
                          {events.length === 0 ?
                      <p className="text-center text-gray-500 text-sm py-4">אין אירועים בעמודה זו</p> :

                      events.map((event, index) =>
                      <Draggable key={event.id} draggableId={event.id} index={index}>
                                {(provided, snapshot) =>
                        <EventCard
                          provided={provided}
                          snapshot={snapshot}
                          event={event}
                          onEdit={() => handleEditEvent(event)}
                          onArchive={() => handleArchiveEvent(event.id)}
                          onSelect={() => setSelectedEvent(event)}
                          onMarkComplete={handleMarkAsCompleted}
                          tagColors={tagColors}
                          clientName={clientMap[event.client_id]} // Pass client name
                          statusColors={columnsConfig}
                          user={user}
                          // Timer props are handled via the modal
                        />
                        }
                              </Draggable>
                      )
                      }
                          {provided.placeholder}
                        </CardContent>
                      </Card>
                    </div>
                }
                </Droppable>);

          })
          }
        </div>
      </DragDropContext>

      {/* Event Details Modal */}
      {selectedEvent && (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50"
          onClick={() => setSelectedEvent(null)}
        >
          <div
            className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
            dir="rtl"
          >
            <div className="p-6">
              <div className="flex justify-between items-start mb-4">
                <div className="flex items-center gap-3 flex-1">
                  <h2 className="text-2xl font-bold flex-1 text-right">{selectedEvent.name}</h2>
                  {clientMap[selectedEvent.client_id] &&
                <Badge variant="outline" className="text-sm border-cyan-300 bg-cyan-50 text-cyan-800">
                      {clientMap[selectedEvent.client_id]}
                    </Badge>
                }
                </div>
                <Button
                variant="ghost"
                size="icon"
                onClick={() => setSelectedEvent(null)}
                className="p-1">

                    <X className="w-5 h-5" />
                </Button>
              </div>

              {(isAdmin || user?.permissions?.can_edit_events || user?.permissions?.can_delete_events) &&
            <div className="flex gap-2 mb-4 pb-4 border-b">
                  {(isAdmin || user?.permissions?.can_edit_events) &&
              <Button
                onClick={() => handleEditEvent(selectedEvent)}
                className="gap-2 bg-blue-600 hover:bg-blue-700">

                      <Edit className="w-4 h-4" />
                      ערוך אירוע
                    </Button>
              }
                  {(isAdmin || user?.permissions?.can_delete_events) &&
              <Button
                onClick={() => handleDeleteEvent(selectedEvent.id)} // Changed from Archive to Delete
                variant="destructive"
                className="gap-2">

                      <Trash2 className="w-4 h-4" />
                      מחק אירוע
                    </Button>
              }
                  {(isAdmin || user?.permissions?.can_delete_events) && // Added Archive back as separate button
              <Button
                onClick={() => handleArchiveEvent(selectedEvent.id)}
                variant="outline"
                className="gap-2 border-orange-300 text-orange-700 hover:bg-orange-50">

                      <Archive className="w-4 h-4" />
                      העבר לארכיון
                    </Button>
              }
                </div>
            }

              <div className="space-y-4" dir="rtl">
                {/* Event Status Badge */}
                {selectedEvent.status && columnsConfig[selectedEvent.status] &&
              <Badge className={`${columnsConfig[selectedEvent.status].color} border-0`}>
                    {selectedEvent.status}
                  </Badge>
              }

                <div className="flex items-center gap-2 text-lg justify-start">
                  <Calendar className="w-5 h-5 text-gray-500" />
                  <span>{format(new Date(selectedEvent.date), "d בMMMM yyyy", { locale: he })}</span>
                </div>
                
                {selectedEvent.audience_arrival_time &&
              <div className="flex items-center gap-2 justify-start">
                    <Clock className="w-4 h-4 text-gray-500" />
                    <span>כניסת קהל: {selectedEvent.audience_arrival_time}</span>
                  </div>
              }

                {selectedEvent.location &&
              <div className="flex items-center gap-2 justify-start">
                    <MapPin className="w-4 h-4 text-gray-500" />
                    <span>{selectedEvent.location}</span>
                  </div>
              }

                {selectedEvent.drive_url &&
              <a href={selectedEvent.drive_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-green-600 hover:text-green-800 justify-start">
                      <ExternalLink className="w-4 h-4" />
                      <span>פתח ב-Google Drive</span>
                    </a>
              }

                {selectedEvent.description &&
              <p className="text-gray-700 text-right">{selectedEvent.description}</p>
              }

                {selectedEvent.tags && selectedEvent.tags.length > 0 &&
              <div className="flex flex-wrap gap-2 justify-end">
                    {selectedEvent.tags.map((tag, index) =>
                <Badge
                  key={index}
                  variant="outline"
                  style={tagColors[tag]}>

                        {tag}
                      </Badge>
                )}
                  </div>
              }

                {/* Checklist Section */}
                {selectedEvent.checklist && selectedEvent.checklist.length > 0 &&
              <div className="border-t pt-4">
                        <h3 className="font-semibold mb-2 text-right">צ'קליסט</h3>
                        <div className="space-y-2">
                            {selectedEvent.checklist.map((checkItem, index) =>
                  <div key={index} className="flex items-center gap-2 justify-end">
                                    <label
                      htmlFor={`checklist-${index}`}
                      className={`text-sm ${checkItem.completed ? 'line-through text-gray-500' : ''}`}>

                                        {checkItem.item}
                                    </label>
                                    <Checkbox
                      id={`checklist-${index}`}
                      checked={checkItem.completed}
                      onCheckedChange={() => handleChecklistItemToggle(selectedEvent, index)} />

                                </div>
                  )}
                        </div>
                    </div>
              }

                {/* Manager Tracking Section */}
                {isAdmin &&
              <div className="border-t pt-4">
                    <h3 className="font-semibold mb-3 text-right">מעקב מנהל</h3>
                    <div className="grid grid-cols-2 gap-4 text-sm mb-4">
                        <div className="space-y-1"><div className="text-gray-500">סטטוס אישור</div><div className="font-medium">{selectedEvent.approval_status || "לא צוין"}</div></div>
                        <div className="space-y-1"><div className="text-gray-500">הצעת מחיר</div><div className="font-medium">{selectedEvent.quote_number || "לא צוין"}</div></div>
                        <div className="space-y-1"><div className="text-gray-500">סטטוס דילים</div><div className="font-medium">{selectedEvent.booking_status || "לא צוין"}</div></div>
                        <div className="space-y-1"><div className="text-gray-500">סטטוס תשלום</div><div className="font-medium">{selectedEvent.payment_status || "לא צוין"}</div></div>
                    </div>
                    {selectedEvent.manager_checklist && selectedEvent.manager_checklist.length > 0 &&
                <div>
                        <h4 className="font-semibold mb-2 text-right">צ'קליסט מנהל</h4>
                        <div className="space-y-2">
                            {selectedEvent.manager_checklist.map((checkItem, index) =>
                    <div key={index} className="flex items-center gap-2 justify-end">
                                    <label htmlFor={`manager-checklist-${index}`} className={`text-sm ${checkItem.completed ? 'line-through text-gray-500' : ''}`}>{checkItem.item}</label>
                                    <Checkbox id={`manager-checklist-${index}`} checked={checkItem.completed} onCheckedChange={() => handleManagerChecklistItemToggle(selectedEvent, index)} />
                                </div>
                    )}
                        </div>
                      </div>
                }
                  </div>
              }

                {/* Screen Grid Section */}
                {(selectedEvent.screen_grid_image_url || selectedEvent.screen_grid_text) &&
              <div className="border-t pt-4">
                        <h3 className="font-semibold mb-2 text-right">גריד מסך</h3>
                        {selectedEvent.screen_grid_image_url &&
                <div className="mb-2">
                                <img src={selectedEvent.screen_grid_image_url} alt="גריד מסך" className="max-w-full rounded-md shadow-md" />
                            </div>
                }
                        {selectedEvent.screen_grid_text &&
                <p className="text-gray-700 bg-gray-50 p-3 rounded-md text-right">{selectedEvent.screen_grid_text}</p>
                }
                    </div>
              }

                <div className="border-t pt-4">
                  <h3 className="font-semibold mb-2 text-right">משימות קשורות ({getEventTasks(selectedEvent.id).length})</h3>
                  <div className="space-y-2">
                    {getEventTasks(selectedEvent.id).length === 0 ?
                  <p className="text-gray-500 text-sm text-right">אין משימות משויכות לאירוע זה.</p> :

                  getEventTasks(selectedEvent.id).map((task) =>
                  <div key={task.id} className="p-3 bg-gray-50 rounded-lg text-right">
                          <div className="font-medium">{task.description}</div>
                          <div className="text-sm text-gray-500">
                            סטטוס: {task.status} | אחראי: {task.assigned_user || "לא משויך"}
                          </div>
                        </div>
                  )
                  }
                  </div>
                </div>

                {/* New Time Tracking Section */}
                <div className="border-t pt-4 mt-4">
                    <h3 className="font-semibold mb-3 text-right">מעקב שעות</h3>
                    {user && (() => {
                  if (user.active_timer_id) {
                    if (user.active_timer_event_id === selectedEvent.id) {
                      return (
                        <Button onClick={handleStopTimer} className="w-full bg-red-600 hover:bg-red-700 gap-2">
                                        <StopIcon className="w-4 h-4" />
                                        הפסק טיימר
                                    </Button>);

                    } else {
                      return (
                        <Button disabled className="w-full gap-2 bg-gray-200 text-gray-700">
                                        <Clock className="w-4 h-4" />
                                        טיימר פעיל באירוע: {user.active_timer_event_name}
                                    </Button>);

                    }
                  } else {
                    return (
                      <Button onClick={() => handleStartTimer(selectedEvent)} className="w-full bg-green-600 hover:bg-green-700 gap-2">
                                    <Play className="w-4 h-4" />
                                    הפעל טיימר
                                </Button>);

                  }
                })()}
                </div>

                {/* Comments Section */}
                <Comments 
                  itemId={selectedEvent.id} 
                  itemType="event" 
                  itemName={selectedEvent.name}
                />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
