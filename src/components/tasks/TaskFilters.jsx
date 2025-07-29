import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Filter } from "lucide-react";

export default function TaskFilters({ filters, onFiltersChange, events, users }) {
  const handleFilterChange = (key, value) => {
    onFiltersChange(prev => ({ ...prev, [key]: value }));
  };

  return (
    <Card className="bg-white/80 backdrop-blur-sm">
      <CardContent className="p-4">
        <div className="flex items-center gap-4 flex-wrap">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-gray-500" />
            <span className="text-sm font-medium text-gray-700">מסננים:</span>
          </div>
          
          <div className="flex gap-4 flex-wrap">
            <Select value={filters.status} onValueChange={(value) => handleFilterChange("status", value)}>
              <SelectTrigger className="w-32">
                <SelectValue placeholder="סטטוס" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">כל הסטטוסים</SelectItem>
                <SelectItem value="פתוח">פתוח</SelectItem>
                <SelectItem value="בתהליך">בתהליך</SelectItem>
                <SelectItem value="הושלם">הושלם</SelectItem>
              </SelectContent>
            </Select>

            <Select value={filters.priority} onValueChange={(value) => handleFilterChange("priority", value)}>
              <SelectTrigger className="w-32">
                <SelectValue placeholder="עדיפות" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">כל העדיפויות</SelectItem>
                <SelectItem value="נמוכה">נמוכה</SelectItem>
                <SelectItem value="רגילה">רגילה</SelectItem>
                <SelectItem value="גבוהה">גבוהה</SelectItem>
                <SelectItem value="קריטית">קריטית</SelectItem>
              </SelectContent>
            </Select>

            <Select value={filters.assignedUser} onValueChange={(value) => handleFilterChange("assignedUser", value)}>
              <SelectTrigger className="w-32">
                <SelectValue placeholder="אחראי" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">כל האחראים</SelectItem>
                {users.map(user => (
                  <SelectItem key={user.id} value={user.email}>
                    {user.full_name || user.email}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={filters.event} onValueChange={(value) => handleFilterChange("event", value)}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="אירוע" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">כל האירועים</SelectItem>
                {events.map(event => (
                  <SelectItem key={event.id} value={event.id}>
                    {event.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}