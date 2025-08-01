
import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Calendar,
  MapPin,
  Briefcase,
  Edit,
  CheckSquare,
  Archive,
  Clock,
  Check,
  ShieldCheck, // Added from outline
  FileText,     // Added from outline
  Banknote,     // Added from outline
  Play
} from "lucide-react";
import { format } from "date-fns";
import { he } from "date-fns/locale";
import { Progress } from "@/components/ui/progress"; // Added from outline


export default function EventCard({ event, onEdit, onArchive, onSelect, tagColors, clientName, provided, snapshot, user, onMarkComplete, operatorName, onStartTimer }) {
  const completedChecklistItems = event.checklist ? event.checklist.filter(item => item.completed).length : 0;
  const totalChecklistItems = event.checklist ? event.checklist.length : 0;
  const checklistProgress = totalChecklistItems > 0 ? (completedChecklistItems / totalChecklistItems) * 100 : 0;
  
  // Added from outline
  const completedManagerChecklistItems = event.manager_checklist ? event.manager_checklist.filter(item => item.completed).length : 0;
  const totalManagerChecklistItems = event.manager_checklist ? event.manager_checklist.length : 0;
  const managerChecklistProgress = totalManagerChecklistItems > 0 ? (completedManagerChecklistItems / totalManagerChecklistItems) * 100 : 0;


  const isAdmin = user?.role === 'admin';
  const canEdit = isAdmin || user?.permissions?.can_edit_events;
  const canArchive = isAdmin || user?.permissions?.can_delete_events;

  // Added from outline
  const paymentStatusColors = {
    "טרם שולם": "bg-red-100 text-red-800",
    "שולם חלקי": "bg-yellow-100 text-yellow-800",
    "שולם במלואו": "bg-green-100 text-green-800",
    "סגור": "bg-gray-100 text-gray-800",
  };

  return (
    <div
      ref={provided.innerRef}
      {...provided.draggableProps}
      {...provided.dragHandleProps}
      className={`mb-4 rounded-xl overflow-hidden shadow-md hover:shadow-lg transition-all duration-300 border-0 ${snapshot.isDragging ? 'bg-green-100' : 'bg-white'}`}
    >
      <CardHeader className="bg-gray-50 pb-3 p-3 sm:p-6" onClick={onSelect} style={{ cursor: 'pointer' }}>
        <div className="flex justify-between items-start">
          <CardTitle
            className={`text-base sm:text-lg font-bold leading-tight cursor-pointer hover:text-green-600 flex-1 ${
              event.is_completed ? 'line-through text-gray-500' : 'text-gray-900'
            }`}
            onClick={(e) => {
              e.stopPropagation();
              onSelect();
            }}
          >
            {event.name}
          </CardTitle>
          <div className="flex items-center gap-1">
            {onStartTimer && (
              <Button
                variant="ghost"
                size="icon"
                onClick={(e) => {
                  e.stopPropagation();
                  onStartTimer(event);
                }}
                className="h-7 w-7 sm:h-8 sm:w-8 text-green-600 hover:text-green-700 hover:bg-green-50"
                title="התחל טיימר לאירוע"
                disabled={user?.active_timer_id}
              >
                <Play className="w-3 h-3 sm:w-4 sm:h-4" />
              </Button>
            )}
            <Button
              variant="ghost"
              size="icon"
              onClick={(e) => {
                e.stopPropagation();
                onMarkComplete(event);
              }}
              className="h-7 w-7 sm:h-8 sm:w-8 text-gray-500 hover:text-green-600"
              title="סמן כהושלם"
            >
              <Check className="w-3 h-3 sm:w-4 sm:h-4" />
            </Button>
            {canEdit && (
              <Button
                variant="ghost"
                size="icon"
                onClick={(e) => {
                  e.stopPropagation();
                  onEdit();
                }}
                className="h-7 w-7 sm:h-8 sm:w-8 text-gray-500 hover:text-blue-600"
                title="ערוך אירוע"
              >
                <Edit className="w-3 h-3 sm:w-4 sm:h-4" />
              </Button>
            )}
            {canArchive && (
              <Button
                variant="ghost"
                size="icon"
                onClick={(e) => {
                  e.stopPropagation();
                  onArchive();
                }}
                className="h-7 w-7 sm:h-8 sm:w-8 text-gray-500 hover:text-red-600"
                title="העבר לארכיון"
              >
                <Archive className="w-3 h-3 sm:w-4 sm:h-4" />
              </Button>
            )}
          </div>
        </div>

        <div className="flex items-center justify-between mt-2 text-sm text-gray-600">
          <div className="flex items-center gap-1">
            <Calendar className="w-3 h-3" />
            {format(new Date(event.date), "d בMMMM", { locale: he })}
          </div>
          {clientName && (
            <div className="flex items-center gap-1 font-medium text-cyan-700">
              <Briefcase className="w-3 h-3" />
              {clientName}
            </div>
          )}
        </div>
      </CardHeader>

      <CardContent className="p-3 sm:p-4 flex-grow flex flex-col" onClick={onSelect} style={{ cursor: 'pointer' }}>
        {event.location && (
          <div className="flex items-center gap-2 text-sm text-gray-600 mb-3">
            <MapPin className="w-3 h-3" />
            {event.location}
          </div>
        )}

        {event.producer_name && (
          <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
            <Briefcase className="w-3 h-3" />
            מפיק: {event.producer_name}
          </div>
        )}

        {event.producer_phone && (
          <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
            <span className="w-3 h-3 text-center">📞</span>
            {event.producer_phone}
          </div>
        )}

        {operatorName && event.assigned_operator_id && (
          <div className="flex items-center gap-2 text-sm text-orange-600 mb-2">
            <span className="w-3 h-3 text-center">👤</span>
            מפעיל: {operatorName}
          </div>
        )}

        {event.audience_arrival_time && (
          <div className="flex items-center gap-2 text-sm text-gray-600 mb-3">
            <Clock className="w-3 h-3" />
            כניסת קהל: {event.audience_arrival_time}
          </div>
        )}

        {event.description && (
          <p className="text-sm text-gray-700 mb-3 line-clamp-2">
            {event.description}
          </p>
        )}

        {event.tags && event.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-3">
            {event.tags.slice(0, 3).map((tag, index) => (
              <Badge
                key={index}
                variant="outline"
                className="text-xs"
                style={tagColors[tag]}
              >
                {tag}
              </Badge>
            ))}
            {event.tags.length > 3 && (
              <Badge variant="outline" className="text-xs">
                +{event.tags.length - 3}
              </Badge>
            )}
          </div>
        )}

        <div className="flex-grow" /> {/* This pushes content to the bottom */}

        {/* New section for management fields */}
        <div className="mt-auto pt-3 space-y-3">
          {isAdmin && event.payment_status && (
            <div className="flex items-center gap-2">
                <Banknote className="w-4 h-4 text-gray-500"/>
                <Badge className={`${paymentStatusColors[event.payment_status] || 'bg-gray-100'}`}>{event.payment_status}</Badge>
            </div>
          )}

          {isAdmin && totalManagerChecklistItems > 0 && (
              <div className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                      <span className="text-gray-600">התקדמות מנהל</span>
                      <span className="text-gray-600">{completedManagerChecklistItems}/{totalManagerChecklistItems}</span>
                  </div>
                  <Progress value={managerChecklistProgress} className="h-1.5 bg-blue-200 [&>div]:bg-blue-500" />
              </div>
          )}

          {totalChecklistItems > 0 && (
            <div className="space-y-1">
              <div className="flex items-center justify-between text-xs">
                <span className="text-gray-600">צ'קליסט כללי</span>
                <span className="text-gray-600">
                  {completedChecklistItems}/{totalChecklistItems}
                </span>
              </div>
              <Progress value={checklistProgress} className="h-1.5" />
            </div>
          )}
        </div>
      </CardContent>
    </div>
  );
}
