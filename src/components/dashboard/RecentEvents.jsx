import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar, MapPin, ExternalLink } from "lucide-react";
import { format } from "date-fns";
import { he } from "date-fns/locale";
import { Skeleton } from "@/components/ui/skeleton";

const tagColors = {
  "דחוף מאוד": "bg-red-100 text-red-800 border-red-200",
  "בקרת לקוח": "bg-blue-100 text-blue-800 border-blue-200",
  "לוגיסטיקה": "bg-purple-100 text-purple-800 border-purple-200",
  "פיננסי": "bg-green-100 text-green-800 border-green-200",
  "רגיל": "bg-gray-100 text-gray-800 border-gray-200",
  "לבדיקה": "bg-yellow-100 text-yellow-800 border-yellow-200"
};

const statusColors = {
  "בתכנון": "bg-yellow-100 text-yellow-800",
  "אושר": "bg-blue-100 text-blue-800",
  "בביצוע": "bg-purple-100 text-purple-800",
  "הושלם": "bg-green-100 text-green-800",
  "בוטל": "bg-red-100 text-red-800"
};

export default function RecentEvents({ events, isLoading }) {
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="w-5 h-5" />
            אירועים אחרונים
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {Array(3).fill(0).map((_, i) => (
              <div key={i} className="p-4 border rounded-lg">
                <div className="flex justify-between items-start mb-2">
                  <Skeleton className="h-5 w-32" />
                  <Skeleton className="h-6 w-16" />
                </div>
                <Skeleton className="h-4 w-24 mb-2" />
                <Skeleton className="h-4 w-full" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  const recentEvents = events.slice(0, 5);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar className="w-5 h-5 text-blue-600" />
          אירועים אחרונים
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {recentEvents.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Calendar className="w-12 h-12 mx-auto mb-3 text-gray-300" />
              <p>אין אירועים עדיין</p>
            </div>
          ) : (
            recentEvents.map((event) => (
              <div key={event.id} className="p-4 border border-gray-200 rounded-lg hover:shadow-md transition-shadow">
                <div className="flex justify-between items-start mb-2">
                  <h3 className="font-semibold text-gray-900">{event.name}</h3>
                  {event.status && (
                    <Badge className={statusColors[event.status]} variant="secondary">
                      {event.status}
                    </Badge>
                  )}
                </div>
                
                <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
                  <Calendar className="w-4 h-4" />
                  {format(new Date(event.date), "d בMMMM yyyy", { locale: he })}
                </div>
                
                {event.location && (
                  <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
                    <MapPin className="w-4 h-4" />
                    {event.location}
                  </div>
                )}
                
                {event.tags && event.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1 mb-2">
                    {event.tags.map((tag, index) => (
                      <Badge
                        key={index}
                        variant="outline"
                        className={`text-xs ${tagColors[tag] || tagColors["רגיל"]}`}
                      >
                        {tag}
                      </Badge>
                    ))}
                  </div>
                )}
                
                {event.description && (
                  <p className="text-sm text-gray-600 mb-3">
                    {event.description.length > 100 
                      ? `${event.description.substring(0, 100)}...` 
                      : event.description}
                  </p>
                )}
                
                {event.drive_url && (
                  <a
                    href={event.drive_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-800 text-sm"
                  >
                    <ExternalLink className="w-3 h-3" />
                    פתח בדרייב
                  </a>
                )}
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
}