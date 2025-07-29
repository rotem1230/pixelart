
import React, { useState } from "react";
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
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge"; // Corrected import
import { X, Plus, Trash2 } from "lucide-react";

const availableTags = ["דחוף", "דרוש אישור", "בוצע חלקית", "לבדיקה שלי", "להציג ללקוח"];
const priorities = ["נמוכה", "רגילה", "גבוהה", "קריטית"];

export default function TaskForm({ task, events, users, onSubmit, onCancel }) {
  const [formData, setFormData] = useState({
    description: task?.description || "",
    status: task?.status || "פתוח",
    deadline: task?.deadline || "",
    event_id: task?.event_id || "",
    assigned_user: task?.assigned_user || "",
    tags: task?.tags || [],
    internal_notes: task?.internal_notes || "",
    priority: task?.priority || "רגילה",
    checklist: task?.checklist || []
  });

  const [newChecklistItem, setNewChecklistItem] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData);
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleTagToggle = (tag) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.includes(tag)
        ? prev.tags.filter(t => t !== tag)
        : [...prev.tags, tag]
    }));
  };

  const removeTag = (tagToRemove) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(t => t !== tagToRemove)
    }));
  };

  const addChecklistItem = () => {
    if (newChecklistItem.trim() !== "") {
      const newItem = { item: newChecklistItem.trim(), completed: false };
      handleInputChange("checklist", [...formData.checklist, newItem]);
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
    const updatedChecklist = formData.checklist.filter((_, i) => i !== index);
    handleInputChange("checklist", updatedChecklist);
  };

  return (
    <Card className="bg-white shadow-lg border-0 rounded-2xl">
      <CardHeader className="bg-gray-100 rounded-t-2xl">
        <CardTitle className="text-xl font-bold text-gray-900">
          {task ? "עריכת משימה" : "משימה חדשה"}
        </CardTitle>
      </CardHeader>
      <CardContent className="p-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Task Description */}
          <div className="space-y-2">
            <Label htmlFor="description" className="text-sm font-medium text-gray-700">
              תיאור המשימה *
            </Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => handleInputChange("description", e.target.value)}
              placeholder="תאר את המשימה בפירוט..."
              className="resize-none h-24"
              required
            />
          </div>

          {/* Form Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Status */}
            <div className="space-y-2">
              <Label className="text-sm font-medium text-gray-700">סטטוס</Label>
              <Select value={formData.status} onValueChange={(value) => handleInputChange("status", value)}>
                <SelectTrigger>
                  <SelectValue placeholder="בחר סטטוס" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="פתוח">פתוח</SelectItem>
                  <SelectItem value="בתהליך">בתהליך</SelectItem>
                  <SelectItem value="הושלם">הושלם</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Priority */}
            <div className="space-y-2">
              <Label className="text-sm font-medium text-gray-700">עדיפות</Label>
              <Select value={formData.priority} onValueChange={(value) => handleInputChange("priority", value)}>
                <SelectTrigger>
                  <SelectValue placeholder="בחר עדיפות" />
                </SelectTrigger>
                <SelectContent>
                  {priorities.map(priority => (
                    <SelectItem key={priority} value={priority}>{priority}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Deadline */}
            <div className="space-y-2">
              <Label htmlFor="deadline" className="text-sm font-medium text-gray-700">
                תאריך יעד
              </Label>
              <Input
                id="deadline"
                type="date"
                value={formData.deadline}
                onChange={(e) => handleInputChange("deadline", e.target.value)}
              />
            </div>

            {/* Event */}
            <div className="space-y-2">
              <Label className="text-sm font-medium text-gray-700">אירוע</Label>
              <Select value={formData.event_id} onValueChange={(value) => handleInputChange("event_id", value)}>
                <SelectTrigger>
                  <SelectValue placeholder="בחר אירוע" />
                </SelectTrigger>
                <SelectContent>
                  {events.map(event => (
                    <SelectItem key={event.id} value={event.id}>{event.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Assigned User */}
            <div className="space-y-2">
              <Label className="text-sm font-medium text-gray-700">אחראי</Label>
              <Select value={formData.assigned_user} onValueChange={(value) => handleInputChange("assigned_user", value)}>
                <SelectTrigger>
                  <SelectValue placeholder="בחר אחראי" />
                </SelectTrigger>
                <SelectContent>
                  {users.map(user => (
                    <SelectItem key={user.id} value={user.email}>{user.full_name || user.email}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Tags */}
          <div className="space-y-3">
            <Label className="text-sm font-medium text-gray-700">תיוגים</Label>
            
            {/* Selected Tags */}
            {formData.tags.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {formData.tags.map(tag => (
                  <Badge
                    key={tag}
                    variant="secondary"
                    className="bg-green-100 text-green-800 border-green-200 flex items-center gap-1"
                  >
                    {tag}
                    <button
                      type="button"
                      onClick={() => removeTag(tag)}
                      className="hover:bg-green-200 rounded-full p-0.5"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            )}
            
            {/* Available Tags */}
            <div className="flex flex-wrap gap-2">
              {availableTags.filter(tag => !formData.tags.includes(tag)).map(tag => (
                <button
                  key={tag}
                  type="button"
                  onClick={() => handleTagToggle(tag)}
                  className="text-xs px-3 py-1 border border-gray-200 rounded-full hover:bg-gray-50 transition-colors flex items-center gap-1"
                >
                  {tag}
                  <Plus className="w-3 h-3" />
                </button>
              ))}
            </div>
          </div>

          {/* Internal Notes */}
          <div className="space-y-2">
            <Label htmlFor="internal_notes" className="text-sm font-medium text-gray-700">
              הערות פנימיות
            </Label>
            <Textarea
              id="internal_notes"
              value={formData.internal_notes}
              onChange={(e) => handleInputChange("internal_notes", e.target.value)}
              placeholder="הערות פנימיות למשימה..."
              className="resize-none h-20"
            />
          </div>

          {/* Checklist */}
          <div className="space-y-3 border-t pt-4">
            <Label className="text-sm font-medium text-gray-700">צ'קליסט למשימה</Label>
            <div className="space-y-2">
              {formData.checklist.map((item, index) => (
                <div key={index} className="flex items-center gap-2">
                  <Input value={item.item} disabled className="flex-grow bg-gray-100" />
                  <Button type="button" variant="ghost" size="icon" onClick={() => removeChecklistItem(index)}>
                    <Trash2 className="w-4 h-4 text-red-500" />
                  </Button>
                </div>
              ))}
            </div>
            <div className="flex items-center gap-2">
              <Input
                value={newChecklistItem}
                onChange={(e) => setNewChecklistItem(e.target.value)}
                onKeyDown={handleChecklistKeyDown}
                placeholder="הוסף פריט לרשימה ולחץ Enter..."
              />
              <Button type="button" onClick={addChecklistItem}>
                <Plus className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* Form Actions */}
          <div className="flex justify-end gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              className="px-6"
            >
              ביטול
            </Button>
            <Button
              type="submit"
              className="px-6 bg-green-600 hover:bg-green-700"
            >
              {task ? "עדכן משימה" : "יצור משימה"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
