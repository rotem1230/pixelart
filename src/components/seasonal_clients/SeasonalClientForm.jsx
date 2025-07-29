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
  SelectValue,
} from "@/components/ui/select";

const months = ["ינואר", "פברואר", "מרץ", "אפריל", "מאי", "יוני", "יולי", "אוגוסט", "ספטמבר", "אוקטובר", "נובמבר", "דצמבר"];
const recurrenceTypes = ["כל שנה", "כל שנתיים", "חד פעמי", "לא ידוע"];
const checkStatuses = ["טרם פניתי", "יצרתי קשר", "רלוונטי", "לא מתקיים השנה", "לבדוק מי המפיק"];

export default function SeasonalClientForm({ client, onSubmit, onCancel }) {
  const [formData, setFormData] = useState({
    event_month: client?.event_month || "",
    event_name: client?.event_name || "",
    client_name: client?.client_name || "",
    contact_info: client?.contact_info || "",
    recurrence_type: client?.recurrence_type || "לא ידוע",
    check_status: client?.check_status || "טרם פניתי",
    next_contact_date: client?.next_contact_date || "",
    notes: client?.notes || "",
    drive_link: client?.drive_link || "",
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData);
  };

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  return (
    <Card className="bg-white shadow-lg border-0 rounded-2xl mb-6">
      <CardHeader className="bg-gray-100 rounded-t-2xl">
        <CardTitle className="text-xl font-bold text-gray-900">
          {client ? "עריכת מעקב" : "הוספת מעקב חדש"}
        </CardTitle>
      </CardHeader>
      <CardContent className="p-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Event Name */}
            <div className="space-y-2">
              <Label htmlFor="event_name">שם האירוע *</Label>
              <Input id="event_name" value={formData.event_name} onChange={(e) => handleInputChange("event_name", e.target.value)} required />
            </div>

            {/* Client Name */}
            <div className="space-y-2">
              <Label htmlFor="client_name">שם המפיק / לקוח *</Label>
              <Input id="client_name" value={formData.client_name} onChange={(e) => handleInputChange("client_name", e.target.value)} required />
            </div>

            {/* Event Month */}
            <div className="space-y-2">
              <Label htmlFor="event_month">חודש קבוע לאירוע *</Label>
              <Select value={formData.event_month} onValueChange={(value) => handleInputChange("event_month", value)} required>
                <SelectTrigger id="event_month"><SelectValue placeholder="בחר חודש" /></SelectTrigger>
                <SelectContent>{months.map(m => <SelectItem key={m} value={m}>{m}</SelectItem>)}</SelectContent>
              </Select>
            </div>

            {/* Contact Info */}
            <div className="space-y-2">
              <Label htmlFor="contact_info">פרטי קשר (טלפון / מייל)</Label>
              <Input id="contact_info" value={formData.contact_info} onChange={(e) => handleInputChange("contact_info", e.target.value)} />
            </div>

            {/* Recurrence Type */}
            <div className="space-y-2">
              <Label htmlFor="recurrence_type">סוג חזרתיות</Label>
              <Select value={formData.recurrence_type} onValueChange={(value) => handleInputChange("recurrence_type", value)}>
                <SelectTrigger id="recurrence_type"><SelectValue placeholder="בחר סוג" /></SelectTrigger>
                <SelectContent>{recurrenceTypes.map(r => <SelectItem key={r} value={r}>{r}</SelectItem>)}</SelectContent>
              </Select>
            </div>

            {/* Check Status */}
            <div className="space-y-2">
              <Label htmlFor="check_status">סטטוס בדיקה</Label>
              <Select value={formData.check_status} onValueChange={(value) => handleInputChange("check_status", value)}>
                <SelectTrigger id="check_status"><SelectValue placeholder="בחר סטטוס" /></SelectTrigger>
                <SelectContent>{checkStatuses.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            
            {/* Next Contact Date */}
            <div className="space-y-2">
                <Label htmlFor="next_contact_date">תאריך פנייה הבא (רשות)</Label>
                <Input id="next_contact_date" type="date" value={formData.next_contact_date} onChange={(e) => handleInputChange("next_contact_date", e.target.value)} />
            </div>

            {/* Drive Link */}
            <div className="space-y-2">
                <Label htmlFor="drive_link">קבצים / קישור לתיקייה בגוגל דרייב</Label>
                <Input id="drive_link" type="url" placeholder="https://" value={formData.drive_link} onChange={(e) => handleInputChange("drive_link", e.target.value)} />
            </div>
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes">הערות נוספות</Label>
            <Textarea id="notes" value={formData.notes} onChange={(e) => handleInputChange("notes", e.target.value)} rows={3} />
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="outline" onClick={onCancel}>ביטול</Button>
            <Button type="submit" className="bg-green-600 hover:bg-green-700">{client ? "עדכן" : "שמור"}</Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}