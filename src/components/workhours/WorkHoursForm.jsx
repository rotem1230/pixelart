
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
import { Clock } from "lucide-react";

export default function WorkHoursForm({ entry, events, onSubmit, onCancel }) {
  const [formData, setFormData] = useState({
    event_id: entry?.event_id || "",
    date: entry?.date || "",
    start_time: entry?.start_time || "",
    end_time: entry?.end_time || "",
    notes: entry?.notes || ""
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData);
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <Card className="bg-white shadow-lg border-0 rounded-2xl">
      <CardHeader className="bg-gray-100 rounded-t-2xl">
        <CardTitle className="text-xl font-bold text-gray-900 flex items-center gap-2">
          <Clock className="w-5 h-5" />
          {entry ? "עריכת רישום שעות" : "רישום שעות עבודה"}
        </CardTitle>
      </CardHeader>
      <CardContent className="p-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Event Selection */}
          <div className="space-y-2">
            <Label className="text-sm font-medium text-gray-700">אירוע *</Label>
            <Select value={formData.event_id} onValueChange={(value) => handleInputChange("event_id", value)}>
              <SelectTrigger>
                <SelectValue placeholder="בחר אירוע" />
              </SelectTrigger>
              <SelectContent>
                {events.map(event => (
                  <SelectItem key={event.id} value={event.id}>
                    {event.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Date and Time Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="date" className="text-sm font-medium text-gray-700">
                תאריך *
              </Label>
              <Input
                id="date"
                type="date"
                value={formData.date}
                onChange={(e) => handleInputChange("date", e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="start_time" className="text-sm font-medium text-gray-700">
                שעת התחלה *
              </Label>
              <Input
                id="start_time"
                type="time"
                value={formData.start_time}
                onChange={(e) => handleInputChange("start_time", e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="end_time" className="text-sm font-medium text-gray-700">
                שעת סיום *
              </Label>
              <Input
                id="end_time"
                type="time"
                value={formData.end_time}
                onChange={(e) => handleInputChange("end_time", e.target.value)}
                required
              />
            </div>
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes" className="text-sm font-medium text-gray-700">
              הערות
            </Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => handleInputChange("notes", e.target.value)}
              placeholder="הוסף הערות על העבודה שביצעת..."
              className="resize-none h-20"
            />
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
              {entry ? "עדכן רישום" : "שמור רישום"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
