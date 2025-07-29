import React from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Filter, Search } from 'lucide-react';

const months = ["ינואר", "פברואר", "מרץ", "אפריל", "מאי", "יוני", "יולי", "אוגוסט", "ספטמבר", "אוקטובר", "נובמבר", "דצמבר"];
const checkStatuses = ["טרם פניתי", "יצרתי קשר", "רלוונטי", "לא מתקיים השנה", "לבדוק מי המפיק"];
const recurrenceTypes = ["כל שנה", "כל שנתיים", "חד פעמי", "לא ידוע"];

export default function SeasonalClientFilters({ filters, onFiltersChange }) {

  const handleInputChange = (key, value) => {
    onFiltersChange(prev => ({ ...prev, [key]: value }));
  };

  return (
    <Card className="bg-gray-50/50 border-gray-200 shadow-sm">
      <CardContent className="p-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 items-end">
          {/* Search Input */}
          <div className="relative">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
            <Input
              placeholder="חפש לפי שם אירוע או לקוח..."
              value={filters.search}
              onChange={(e) => handleInputChange('search', e.target.value)}
              className="pr-10"
            />
          </div>

          {/* Event Month Filter */}
          <Select value={filters.month} onValueChange={(value) => handleInputChange('month', value)}>
            <SelectTrigger><SelectValue placeholder="סינון לפי חודש" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">כל החודשים</SelectItem>
              {months.map(m => <SelectItem key={m} value={m}>{m}</SelectItem>)}
            </SelectContent>
          </Select>

          {/* Status Filter */}
          <Select value={filters.status} onValueChange={(value) => handleInputChange('status', value)}>
            <SelectTrigger><SelectValue placeholder="סינון לפי סטטוס" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">כל הסטטוסים</SelectItem>
              {checkStatuses.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
            </SelectContent>
          </Select>
          
          {/* Recurrence Filter */}
          <Select value={filters.recurrence} onValueChange={(value) => handleInputChange('recurrence', value)}>
            <SelectTrigger><SelectValue placeholder="סינון לפי חזרתיות" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">כל סוגי החזרתיות</SelectItem>
              {recurrenceTypes.map(r => <SelectItem key={r} value={r}>{r}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      </CardContent>
    </Card>
  );
}