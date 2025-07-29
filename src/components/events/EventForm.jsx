
import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue } from
"@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogTrigger } from
"@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { X, Plus, Trash2, Image as ImageIcon, Clock } from "lucide-react";
import { UploadFile } from "@/api/integrations";
import { Tag } from "@/api/entities";
import { Task } from "@/api/entities";
import { User } from "@/api/entities";
import { Client } from "@/api/entities"; // Added import for Client

const statuses = [
"משימות קרובים - לפי סדר קדימות",
"לסיים היום/מחכה לך",
"סיימתי - לבדיקה",
"בוטל"];


const approvalStatuses = ["ממתין לאישור", "מאושר", "נדחה"];
const bookingStatuses = ["טרם החל", "דילים בטיפול", "הושלם", "אין צורך"];
const paymentStatuses = ["טרם שולם", "שולם חלקי", "שולם במלואו", "סגור"];

export default function EventForm({ event, onSubmit, onCancel, clients, isAdmin }) {
  const [formData, setFormData] = useState({
    name: event?.name || "",
    date: event?.date || "",
    client_id: event?.client_id || "",
    audience_arrival_time: event?.audience_arrival_time || "",
    drive_url: event?.drive_url || "",
    tags: event?.tags || [],
    description: event?.description || "",
    location: event?.location || "",
    status: event?.status || statuses[0],
    checklist: event?.checklist || [],
    screen_grid_image_url: event?.screen_grid_image_url || "",
    screen_grid_text: event?.screen_grid_text || "",
    timer_target_type: event?.timer_target_type || "event",
    timer_target_task_id: event?.timer_target_task_id || "",
    approval_status: event?.approval_status || "ממתין לאישור",
    quote_number: event?.quote_number || "",
    booking_status: event?.booking_status || "טרם החל",
    payment_status: event?.payment_status || "טרם שולם",
    manager_checklist: event?.manager_checklist || []
  });
  const [newChecklistItem, setNewChecklistItem] = useState("");
  const [newManagerChecklistItem, setNewManagerChecklistItem] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [availableTags, setAvailableTags] = useState([]);
  const [availableTasks, setAvailableTasks] = useState([]);
  const [availableClients, setAvailableClients] = useState(clients || []);
  const [isAddClientModalOpen, setIsAddClientModalOpen] = useState(false);
  const [newClientName, setNewClientName] = useState("");

  useEffect(() => {
    setAvailableClients(clients || []);
  }, [clients]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [tagsData, tasksData, clientsData] = await Promise.all([
        Tag.list(),
        Task.list(),
        Client.list()]
        );
        setAvailableTags(tagsData);
        setAvailableTasks(tasksData);
        // This will be overridden by the prop if `clients` prop is provided
        // However, if the component is mounted without the `clients` prop, this ensures data is fetched.
        // It's good practice to keep both, prioritizing props.
        if (!clients || clients.length === 0) {
          setAvailableClients(clientsData);
        }
      } catch (error) {
        console.error("Failed to fetch data:", error);
      }
    };
    fetchData();
  }, []); // Empty dependency array means this runs once on mount for initial data fetch

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData);
  };

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleTagToggle = (tagName) => {
    setFormData((prev) => ({
      ...prev,
      tags: prev.tags.includes(tagName) ?
      prev.tags.filter((t) => t !== tagName) :
      [...prev.tags, tagName]
    }));
  };

  const removeTag = (tagToRemove) => {
    setFormData((prev) => ({
      ...prev,
      tags: prev.tags.filter((t) => t !== tagToRemove)
    }));
  };

  const addChecklistItem = () => {
    if (newChecklistItem.trim() !== "") {
      const newItem = { item: newChecklistItem.trim(), completed: false };
      setFormData((prev) => ({ ...prev, checklist: [...prev.checklist, newItem] }));
      setNewChecklistItem("");
    }
  };

  const handleChecklistKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addChecklistItem();
    }
  };

  const removeChecklistItem = (index) => {
    setFormData((prev) => ({ ...prev, checklist: prev.checklist.filter((_, i) => i !== index) }));
  };

  const addManagerChecklistItem = () => {
    if (newManagerChecklistItem.trim() !== "") {
      const newItem = { item: newManagerChecklistItem.trim(), completed: false };
      setFormData((prev) => ({ ...prev, manager_checklist: [...prev.manager_checklist, newItem] }));
      setNewManagerChecklistItem("");
    }
  };

  const removeManagerChecklistItem = (index) => {
    setFormData((prev) => ({ ...prev, manager_checklist: prev.manager_checklist.filter((_, i) => i !== index) }));
  };

  const handleManagerChecklistKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addManagerChecklistItem();
    }
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setIsUploading(true);
    try {
      const { file_url } = await UploadFile({ file });
      handleInputChange("screen_grid_image_url", file_url);
    } catch (error) {
      console.error("Error uploading image:", error);
      alert("שגיאה בהעלאת התמונה.");
    } finally {
      setIsUploading(false);
    }
  };

  const handleAddNewClient = async () => {
    if (!newClientName.trim()) {
      alert("יש להזין שם לקוח.");
      return;
    }
    try {
      const newClient = await Client.create({ name: newClientName.trim() });
      setAvailableClients((prev) => [...prev, newClient]);
      handleInputChange("client_id", newClient.id);
      setIsAddClientModalOpen(false);
      setNewClientName("");
    } catch (error) {
      console.error("Error adding new client:", error);
      alert("שגיאה בהוספת לקוח חדש.");
    }
  };

  return (
    <Card className="bg-white shadow-lg border-0 rounded-2xl">
      <CardHeader className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-t-2xl">
        <CardTitle className="text-xl font-bold text-gray-900">
          {event ? "עריכת אירוע" : "אירוע חדש"}
        </CardTitle>
      </CardHeader>
      <CardContent className="p-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Event Name */}
          <div className="space-y-2">
            <Label htmlFor="name" className="text-sm font-medium text-gray-700">
              שם האירוע *
            </Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => handleInputChange("name", e.target.value)}
              placeholder="הכנס שם האירוע..."
              required />

          </div>

          {/* Form Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Date */}
            <div className="space-y-2">
              <Label htmlFor="date" className="text-sm font-medium text-gray-700">
                תאריך האירוע *
              </Label>
              <Input
                id="date"
                type="date"
                value={formData.date}
                onChange={(e) => handleInputChange("date", e.target.value)}
                required />

            </div>
            
            {/* Client */}
            <div className="space-y-2">
              <Label className="text-sm font-medium text-gray-700">לקוח</Label>
              <div className="flex items-center gap-2">
                <Select value={formData.client_id} onValueChange={(value) => handleInputChange("client_id", value)}>
                  <SelectTrigger className="flex-grow">
                    <SelectValue placeholder="שייך לקוח לאירוע" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableClients.map((client) =>
                    <SelectItem key={client.id} value={client.id}>{client.name}</SelectItem>
                    )}
                  </SelectContent>
                </Select>
                <Dialog open={isAddClientModalOpen} onOpenChange={setIsAddClientModalOpen}>
                  <DialogTrigger asChild>
                    <Button type="button" variant="outline" size="icon">
                      <Plus className="w-4 h-4" />
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>הוספת לקוח חדש</DialogTitle>
                    </DialogHeader>
                    <div className="py-4">
                      <Label htmlFor="new-client-name">שם הלקוח</Label>
                      <Input
                        id="new-client-name"
                        value={newClientName}
                        onChange={(e) => setNewClientName(e.target.value)}
                        placeholder="הקלד את שם הלקוח..." />

                    </div>
                    <DialogFooter>
                      <Button type="button" variant="outline" onClick={() => setIsAddClientModalOpen(false)}>ביטול</Button>
                      <Button type="button" onClick={handleAddNewClient}>שמור לקוח</Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>
            </div>
            
            {/* Audience Arrival Time */}
            <div className="space-y-2">
              <Label htmlFor="audience_arrival_time" className="text-sm font-medium text-gray-700">
                שעת כניסת קהל
              </Label>
              <Input
                id="audience_arrival_time"
                type="time"
                value={formData.audience_arrival_time}
                onChange={(e) => handleInputChange("audience_arrival_time", e.target.value)} />

            </div>

            {/* Status */}
            <div className="space-y-2">
              <Label className="text-sm font-medium text-gray-700">סטטוס</Label>
              <Select value={formData.status} onValueChange={(value) => handleInputChange("status", value)}>
                <SelectTrigger>
                  <SelectValue placeholder="בחר סטטוס" />
                </SelectTrigger>
                <SelectContent>
                  {statuses.map((status) =>
                  <SelectItem key={status} value={status}>{status}</SelectItem>
                  )}
                </SelectContent>
              </Select>
            </div>

            {/* Location */}
            <div className="space-y-2">
              <Label htmlFor="location" className="text-sm font-medium text-gray-700">
                מיקום האירוע
              </Label>
              <Input
                id="location"
                value={formData.location}
                onChange={(e) => handleInputChange("location", e.target.value)}
                placeholder="הכנס מיקום האירוע..." />

            </div>

            {/* Drive URL */}
            <div className="space-y-2">
              <Label htmlFor="drive_url" className="text-sm font-medium text-gray-700">
                קישור לדרייב
              </Label>
              <Input
                id="drive_url"
                type="url"
                value={formData.drive_url}
                onChange={(e) => handleInputChange("drive_url", e.target.value)}
                placeholder="https://drive.google.com/..." />

            </div>
          </div>

          {/* Timer Settings */}
          <div className="space-y-3 border-t pt-4">
            <Label className="text-sm font-medium text-gray-700 flex items-center gap-2">
              <Clock className="w-4 h-4" />
              הגדרות טיימר
            </Label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-sm font-medium text-gray-700">יעד הטיימר</Label>
                <Select value={formData.timer_target_type} onValueChange={(value) => handleInputChange("timer_target_type", value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="בחר יעד" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="event">האירוע</SelectItem>
                    <SelectItem value="task">משימה ספציפית</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {formData.timer_target_type === "task" &&
              <div className="space-y-2">
                  <Label className="text-sm font-medium text-gray-700">משימה</Label>
                  <Select value={formData.timer_target_task_id} onValueChange={(value) => handleInputChange("timer_target_task_id", value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="בחר משימה" />
                    </SelectTrigger>
                    <SelectContent>
                      {availableTasks.map((task) =>
                    <SelectItem key={task.id} value={task.id}>{task.description}</SelectItem>
                    )}
                    </SelectContent>
                  </Select>
                </div>
              }
            </div>
          </div>

          {/* Tags */}
          <div className="space-y-3">
            <Label className="text-sm font-medium text-gray-700">תיוגים</Label>

            {/* Selected Tags */}
            {formData.tags.length > 0 &&
            <div className="flex flex-wrap gap-2">
                {formData.tags.map((tag) =>
              <Badge
                key={tag}
                variant="secondary"
                className="bg-blue-100 text-blue-800 border-blue-200 flex items-center gap-1">

                    {tag}
                    <button
                  type="button"
                  onClick={() => removeTag(tag)}
                  className="hover:bg-blue-200 rounded-full p-0.5">

                      <X className="w-3 h-3" />
                    </button>
                  </Badge>
              )}
              </div>
            }

            {/* Available Tags */}
            <div className="flex flex-wrap gap-2">
              {availableTags.filter((tag) => !formData.tags.includes(tag.name)).map((tag) =>
              <button
                key={tag.id}
                type="button"
                onClick={() => handleTagToggle(tag.name)}
                className="text-xs px-3 py-1 border border-gray-200 rounded-full hover:bg-gray-50 transition-colors flex items-center gap-1">

                  {tag.name}
                  <Plus className="w-3 h-3" />
                </button>
              )}
            </div>
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description" className="text-sm font-medium text-gray-700">
              תיאור האירוע
            </Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => handleInputChange("description", e.target.value)}
              placeholder="הכנס תיאור מפורט של האירוע..."
              className="resize-none h-24" />

          </div>

          {/* Checklist */}
          <div className="space-y-3 border-t pt-4">
            <Label className="text-sm font-medium text-gray-700">צ'קליסט לאירוע</Label>
            <div className="space-y-2">
              {formData.checklist.map((item, index) =>
              <div key={index} className="flex items-center gap-2">
                  <Input value={item.item} disabled className="flex-grow bg-gray-100" />
                  <Button type="button" variant="ghost" size="icon" onClick={() => removeChecklistItem(index)}>
                    <Trash2 className="w-4 h-4 text-red-500" />
                  </Button>
                </div>
              )}
            </div>
            <div className="flex items-center gap-2">
              <Input
                value={newChecklistItem}
                onChange={(e) => setNewChecklistItem(e.target.value)}
                onKeyDown={handleChecklistKeyDown}
                placeholder="הוסף פריט לרשימה ולחץ Enter..." />

              <Button type="button" onClick={addChecklistItem}>
                <Plus className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* Screen Grid */}
          <div className="space-y-3 border-t pt-4">
            <Label className="text-sm font-medium text-gray-700">גריד מסך</Label>
            <div className="space-y-2">
              <Label htmlFor="screen_grid_text">טקסט</Label>
              <Textarea
                id="screen_grid_text"
                value={formData.screen_grid_text}
                onChange={(e) => handleInputChange("screen_grid_text", e.target.value)}
                placeholder="טקסט להצגה על המסך..."
                className="h-20" />

            </div>
            <div className="space-y-2">
              <Label htmlFor="screen_grid_image">תמונה</Label>
              <Input id="screen_grid_image" type="file" onChange={handleImageUpload} accept="image/*" />
              {isUploading && <p className="text-sm text-blue-600">מעלה תמונה...</p>}
              {formData.screen_grid_image_url && !isUploading &&
              <div className="mt-2">
                  <img src={formData.screen_grid_image_url} alt="תצוגה מקדימה" className="w-32 h-32 object-cover rounded-md" />
                </div>
              }
            </div>
          </div>

          {isAdmin &&
          <div className="space-y-6 border-t-2 border-dashed border-gray-200 pt-6 mt-6">
              <h3 className="text-lg font-semibold text-gray-800">ניהול האירוע (מנהלים)</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label>סטטוס אישור</Label>
                  <Select value={formData.approval_status} onValueChange={(value) => handleInputChange("approval_status", value)}>
                    <SelectTrigger><SelectValue placeholder="בחר סטטוס" /></SelectTrigger>
                    <SelectContent>{approvalStatuses.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="quote_number">מספר הצעת מחיר</Label>
                  <Input id="quote_number" value={formData.quote_number} onChange={(e) => handleInputChange("quote_number", e.target.value)} />
                </div>

                <div className="space-y-2">
                  <Label>סטטוס סגירת דילים</Label>
                  <Select value={formData.booking_status} onValueChange={(value) => handleInputChange("booking_status", value)}>
                    <SelectTrigger><SelectValue placeholder="בחר סטטוס" /></SelectTrigger>
                    <SelectContent>{bookingStatuses.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>סטטוס תשלום</Label>
                  <Select value={formData.payment_status} onValueChange={(value) => handleInputChange("payment_status", value)}>
                    <SelectTrigger><SelectValue placeholder="בחר סטטוס" /></SelectTrigger>
                    <SelectContent>{paymentStatuses.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-3">
                <Label className="text-sm font-medium text-gray-700">צ'קליסט מנהל</Label>
                <div className="space-y-2">
                  {formData.manager_checklist.map((item, index) =>
                <div key={index} className="flex items-center gap-2">
                      <Input value={item.item} disabled className="flex-grow bg-gray-100" />
                      <Button type="button" variant="ghost" size="icon" onClick={() => removeManagerChecklistItem(index)}>
                        <Trash2 className="w-4 h-4 text-red-500" />
                      </Button>
                    </div>
                )}
                </div>
                <div className="flex items-center gap-2">
                  <Input
                  value={newManagerChecklistItem}
                  onChange={(e) => setNewManagerChecklistItem(e.target.value)}
                  onKeyDown={handleManagerChecklistKeyDown}
                  placeholder="הוסף פריט לצ'קליסט המנהל..." />

                  <Button type="button" onClick={addManagerChecklistItem}><Plus className="w-4 h-4" /></Button>
                </div>
              </div>
            </div>
          }

          {/* Form Actions */}
          <div className="flex justify-end gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              className="px-6">

              ביטול
            </Button>
            <Button
              type="submit" className="bg-lime-500 text-primary-foreground px-6 py-2 text-sm font-medium inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 h-10 hover:bg-blue-700">


              {event ? "עדכן אירוע" : "צור אירוע"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>);

}