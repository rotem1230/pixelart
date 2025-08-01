
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
  SelectValue
} from
  "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogTrigger
} from
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
  // Initialize form data with backward compatibility for old single image format
  const initializeImages = () => {
    if (event?.screen_grid_images && Array.isArray(event.screen_grid_images)) {
      return event.screen_grid_images;
    } else if (event?.screen_grid_image_url) {
      // Convert old single image format to new array format
      return [{
        id: Date.now(),
        url: event.screen_grid_image_url,
        filename: 'תמונה קיימת'
      }];
    }
    return [];
  };

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
    screen_grid_images: initializeImages(),
    screen_grid_text: event?.screen_grid_text || "",
    timer_target_type: event?.timer_target_type || "event",
    timer_target_task_id: event?.timer_target_task_id || "",
    approval_status: event?.approval_status || "ממתין לאישור",
    quote_number: event?.quote_number || "",
    booking_status: event?.booking_status || "טרם החל",
    payment_status: event?.payment_status || "טרם שולם",
    manager_checklist: event?.manager_checklist || [],
    producer_name: event?.producer_name || "",
    producer_phone: event?.producer_phone || "",
    registration_notes: event?.registration_notes || "",
    assigned_operator_id: event?.assigned_operator_id || "none"
  });
  const [newChecklistItem, setNewChecklistItem] = useState("");
  const [newManagerChecklistItem, setNewManagerChecklistItem] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [availableTags, setAvailableTags] = useState([]);
  const [availableTasks, setAvailableTasks] = useState([]);
  const [availableClients, setAvailableClients] = useState(clients || []);
  const [availableOperators, setAvailableOperators] = useState([]);
  const [isAddClientModalOpen, setIsAddClientModalOpen] = useState(false);
  const [newClientName, setNewClientName] = useState("");
  const [isDragOver, setIsDragOver] = useState(false);
  const [selectedImageForPreview, setSelectedImageForPreview] = useState(null);

  useEffect(() => {
    setAvailableClients(clients || []);
  }, [clients]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [tagsData, tasksData, clientsData] = await Promise.all([
          Tag.getAll(),
          Task.getAll(),
          Client.getAll()]
        );
        setAvailableTags(tagsData);
        setAvailableTasks(tasksData);

        // Load operators from localStorage
        const systemUsers = localStorage.getItem('systemUsers');
        if (systemUsers) {
          const users = JSON.parse(systemUsers);
          const operators = users.filter(user => user.role === 'operator');
          setAvailableOperators(operators);
        }

        // This will be overridden by the prop if `clients` prop is provided
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
    // Convert "none" back to empty string for assigned_operator_id
    const submitData = {
      ...formData,
      assigned_operator_id: formData.assigned_operator_id === "none" ? "" : formData.assigned_operator_id
    };
    onSubmit(submitData);
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
    const files = Array.from(e.target.files);
    if (files.length === 0) return;

    setIsUploading(true);
    try {
      const uploadPromises = files.map(file => UploadFile({ file }));
      const results = await Promise.all(uploadPromises);

      const newImages = results.map((result, index) => ({
        id: Date.now() + index,
        url: result.file_url || result.url,
        filename: files[index].name
      }));

      setFormData(prev => ({
        ...prev,
        screen_grid_images: [...prev.screen_grid_images, ...newImages]
      }));

      // Clear the input
      e.target.value = '';
    } catch (error) {
      console.error("Error uploading images:", error);
      alert("שגיאה בהעלאת התמונות: " + error.message);
    } finally {
      setIsUploading(false);
    }
  };

  const removeImage = (imageId) => {
    setFormData(prev => ({
      ...prev,
      screen_grid_images: prev.screen_grid_images.filter(img => img.id !== imageId)
    }));
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = async (e) => {
    e.preventDefault();
    setIsDragOver(false);

    const files = Array.from(e.dataTransfer.files).filter(file => file.type.startsWith('image/'));
    if (files.length === 0) return;

    setIsUploading(true);
    try {
      const uploadPromises = files.map(file => UploadFile({ file }));
      const results = await Promise.all(uploadPromises);

      const newImages = results.map((result, index) => ({
        id: Date.now() + index,
        url: result.file_url || result.url,
        filename: files[index].name
      }));

      setFormData(prev => ({
        ...prev,
        screen_grid_images: [...prev.screen_grid_images, ...newImages]
      }));
    } catch (error) {
      console.error("Error uploading images:", error);
      alert("שגיאה בהעלאת התמונות: " + error.message);
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

            {/* Producer Information */}
            <div className="space-y-2">
              <Label htmlFor="producer_name" className="text-sm font-medium text-gray-700">
                שם מפיק
              </Label>
              <Input
                id="producer_name"
                value={formData.producer_name}
                onChange={(e) => handleInputChange("producer_name", e.target.value)}
                placeholder="הכנס שם המפיק..." />
            </div>

            <div className="space-y-2">
              <Label htmlFor="producer_phone" className="text-sm font-medium text-gray-700">
                טלפון מפיק
              </Label>
              <Input
                id="producer_phone"
                value={formData.producer_phone}
                onChange={(e) => handleInputChange("producer_phone", e.target.value)}
                placeholder="הכנס מספר טלפון המפיק..."
                dir="ltr" />
            </div>

            <div className="space-y-2">
              <Label htmlFor="registration_notes" className="text-sm font-medium text-gray-700">
                הערות עמודת רישום
              </Label>
              <Textarea
                id="registration_notes"
                value={formData.registration_notes}
                onChange={(e) => handleInputChange("registration_notes", e.target.value)}
                placeholder="הכנס הערות לעמודת הרישום..."
                rows={3} />
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

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label htmlFor="screen_grid_images">תמונות</Label>
                <span className="text-sm text-gray-500">
                  {formData.screen_grid_images.length} תמונות
                </span>
              </div>

              <Input
                id="screen_grid_images"
                type="file"
                onChange={handleImageUpload}
                accept="image/*"
                multiple
                className="cursor-pointer"
              />

              {isUploading && (
                <div className="flex items-center gap-2 text-sm text-blue-600">
                  <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                  מעלה תמונות...
                </div>
              )}

              {/* Images Grid */}
              {formData.screen_grid_images.length > 0 && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-4">
                  {formData.screen_grid_images.map((image) => (
                    <div key={image.id} className="relative group bg-gray-50 rounded-lg overflow-hidden border border-gray-200">
                      <img
                        src={image.url}
                        alt={image.filename}
                        className="w-full h-auto object-contain max-h-64 cursor-pointer hover:opacity-90 transition-opacity"
                        style={{ minHeight: '120px' }}
                        onClick={() => setSelectedImageForPreview(image)}
                        title="לחץ לצפייה בגודל מלא"
                      />
                      <button
                        type="button"
                        onClick={() => removeImage(image.id)}
                        className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1.5 opacity-0 group-hover:opacity-100 transition-opacity duration-200 hover:bg-red-600 shadow-lg z-10"
                        title="הסר תמונה"
                      >
                        <X className="w-4 h-4" />
                      </button>
                      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-3 pointer-events-none">
                        <p className="text-white text-sm font-medium truncate">
                          {image.filename}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Image Preview Modal */}
              {selectedImageForPreview && (
                <Dialog open={!!selectedImageForPreview} onOpenChange={() => setSelectedImageForPreview(null)}>
                  <DialogContent className="max-w-4xl max-h-[90vh] p-0">
                    <DialogHeader className="p-4 pb-2">
                      <DialogTitle className="text-right">
                        {selectedImageForPreview.filename}
                      </DialogTitle>
                    </DialogHeader>
                    <div className="flex justify-center items-center p-4 pt-0">
                      <img
                        src={selectedImageForPreview.url}
                        alt={selectedImageForPreview.filename}
                        className="max-w-full max-h-[70vh] object-contain rounded-lg"
                      />
                    </div>
                  </DialogContent>
                </Dialog>
              )}

              {formData.screen_grid_images.length === 0 && !isUploading && (
                <div
                  className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${isDragOver
                    ? 'border-blue-400 bg-blue-50'
                    : 'border-gray-300 hover:border-gray-400'
                    }`}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                >
                  <ImageIcon className={`w-8 h-8 mx-auto mb-2 ${isDragOver ? 'text-blue-500' : 'text-gray-400'}`} />
                  <p className={`text-sm ${isDragOver ? 'text-blue-600' : 'text-gray-500'}`}>
                    {isDragOver ? 'שחרר כדי להעלות' : 'לא נבחרו תמונות'}
                  </p>
                  <p className="text-xs text-gray-400 mt-1">
                    ניתן לבחור מספר תמונות בו זמנית או לגרור ולשחרר כאן
                  </p>
                </div>
              )}
            </div>
          </div>

          {isAdmin &&
            <div className="space-y-6 border-t-2 border-dashed border-gray-200 pt-6 mt-6">
              <h3 className="text-lg font-semibold text-gray-800">ניהול האירוע (מנהלים)</h3>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6">
                {/* Assigned Operator */}
                <div className="space-y-2">
                  <Label>מפעיל מוקצה</Label>
                  <Select value={formData.assigned_operator_id} onValueChange={(value) => handleInputChange("assigned_operator_id", value)}>
                    <SelectTrigger><SelectValue placeholder="בחר מפעיל" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">ללא מפעיל מוקצה</SelectItem>
                      {availableOperators.map((operator) => (
                        <SelectItem key={operator.id} value={operator.id}>
                          {operator.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

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