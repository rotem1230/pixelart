import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { Mail, MailOpen, Clock, Link as LinkIcon } from "lucide-react";
import { format } from "date-fns";
import { he } from "date-fns/locale";

export default function MessageCard({ message, onMarkAsRead }) {
  return (
    <Card className={`${message.is_read ? 'bg-gray-50' : 'bg-blue-50 border-blue-200'}`}>
      <CardHeader className="pb-3">
        <div className="flex justify-between items-start flex-wrap gap-2">
          <CardTitle className="text-lg flex items-center gap-2">
            {message.is_read ? (
              <MailOpen className="w-4 h-4 text-gray-500" />
            ) : (
              <Mail className="w-4 h-4 text-blue-600" />
            )}
            {message.title}
            {!message.is_read && (
              <Badge variant="default" className="bg-blue-600">חדש</Badge>
            )}
          </CardTitle>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1 text-sm text-gray-500">
              <Clock className="w-3 h-3" />
              {format(new Date(message.created_date), "d/M/yy HH:mm", { locale: he })}
            </div>
            {!message.is_read && (
              <Button
                size="sm"
                variant="outline"
                onClick={onMarkAsRead}
                className="text-xs"
              >
                סמן כנקרא
              </Button>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-gray-700 whitespace-pre-wrap">
            <p className="font-medium">{message.context_text}</p>
            <p className="italic text-gray-600 border-r-2 border-gray-300 pr-2 mr-2 my-2">{message.content}</p>
        </div>
        
        <div className="mt-3 pt-3 border-t border-gray-200 flex justify-between items-center">
            <p className="text-sm text-gray-500">
              נשלח על ידי: <span className="font-medium">{message.sender_name}</span>
            </p>
            {message.context_link && (
                <Button asChild variant="outline" size="sm" className="gap-1">
                    <Link to={message.context_link}>
                        <LinkIcon className="w-3 h-3"/>
                        עבור להקשר
                    </Link>
                </Button>
            )}
        </div>
      </CardContent>
    </Card>
  );
}