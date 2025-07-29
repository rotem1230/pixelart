import React, { useState, useEffect } from "react";
import { PersonalMessage } from "@/api/entities";
import { User } from "@/api/entities";
import { Button } from "@/components/ui/button";
import { Bell, BellRing } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatDistanceToNow } from "date-fns";
import { he } from "date-fns/locale";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";

export default function NotificationButton() {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadNotifications();
    // Refresh notifications every 30 seconds
    const interval = setInterval(loadNotifications, 30000);
    return () => clearInterval(interval);
  }, []);

  const loadNotifications = async () => {
    try {
      const userData = await User.getCurrentUser();
      setUser(userData);

      const allMessages = await PersonalMessage.getAll();
      const userMessages = allMessages
        .filter(msg => msg.recipient_id === userData.id)
        .sort((a, b) => new Date(b.created_date) - new Date(a.created_date))
        .slice(0, 10); // Get latest 10 notifications

      setNotifications(userMessages);
      setUnreadCount(userMessages.filter(msg => !msg.is_read).length);
    } catch (error) {
      console.error("Error loading notifications:", error);
    }
    setIsLoading(false);
  };

  const markAsRead = async (messageId) => {
    try {
      await PersonalMessage.update(messageId, { is_read: true });
      setNotifications(prev => 
        prev.map(msg => 
          msg.id === messageId ? { ...msg, is_read: true } : msg
        )
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error("Error marking notification as read:", error);
    }
  };

  const markAllAsRead = async () => {
    try {
      const unreadMessages = notifications.filter(msg => !msg.is_read);
      await Promise.all(
        unreadMessages.map(msg => 
          PersonalMessage.update(msg.id, { is_read: true })
        )
      );
      setNotifications(prev => prev.map(msg => ({ ...msg, is_read: true })));
      setUnreadCount(0);
    } catch (error) {
      console.error("Error marking all as read:", error);
    }
  };

  if (isLoading || !user) {
    return (
      <div className="w-10 h-10 bg-gray-200 rounded-full animate-pulse"></div>
    );
  }

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          {unreadCount > 0 ? (
            <>
              <BellRing className="w-5 h-5 text-orange-600" />
              <Badge 
                variant="destructive" 
                className="absolute -top-1 -right-1 h-5 w-5 text-xs flex items-center justify-center p-0"
              >
                {unreadCount > 9 ? '9+' : unreadCount}
              </Badge>
            </>
          ) : (
            <Bell className="w-5 h-5 text-gray-600" />
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-96 max-h-96 overflow-y-auto" align="end">
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <h3 className="font-semibold text-lg">התראות</h3>
            {unreadCount > 0 && (
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={markAllAsRead}
                className="text-xs"
              >
                סמן הכל כנקרא
              </Button>
            )}
          </div>

          {notifications.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Bell className="w-12 h-12 mx-auto mb-2 text-gray-300" />
              <p>אין התראות חדשות</p>
            </div>
          ) : (
            <div className="space-y-2">
              {notifications.map((notification) => (
                <Card 
                  key={notification.id} 
                  className={`cursor-pointer transition-all duration-200 ${
                    notification.is_read 
                      ? 'bg-gray-50 hover:bg-gray-100' 
                      : 'bg-blue-50 hover:bg-blue-100 border-blue-200'
                  }`}
                  onClick={() => {
                    if (!notification.is_read) {
                      markAsRead(notification.id);
                    }
                  }}
                >
                  <CardHeader className="pb-2 pt-3 px-3">
                    <div className="flex justify-between items-start">
                      <CardTitle className="text-sm font-medium flex items-center gap-2">
                        {!notification.is_read && (
                          <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                        )}
                        {notification.title}
                        {notification.priority === 'גבוהה' && (
                          <Badge variant="destructive" className="text-xs">חשוב</Badge>
                        )}
                        {notification.priority === 'דחופה' && (
                          <Badge variant="destructive" className="text-xs animate-pulse">דחוף</Badge>
                        )}
                      </CardTitle>
                      <span className="text-xs text-gray-500">
                        {formatDistanceToNow(new Date(notification.created_date), { 
                          addSuffix: true, 
                          locale: he 
                        })}
                      </span>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0 px-3 pb-3">
                    <div className="space-y-2">
                      <p className="text-sm text-gray-700">{notification.content}</p>
                      {notification.context_text && (
                        <p className="text-xs text-gray-500 bg-gray-100 p-2 rounded">
                          {notification.context_text}
                        </p>
                      )}
                      <div className="flex justify-between items-center text-xs">
                        <span className="text-gray-500">
                          מאת: {notification.sender_name}
                        </span>
                        {notification.context_link && (
                          <Link 
                            to={notification.context_link}
                            className="text-blue-600 hover:text-blue-800 underline"
                            onClick={(e) => e.stopPropagation()}
                          >
                            עבור למקום
                          </Link>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
          
          <div className="pt-2 border-t">
            <Link to={createPageUrl("PersonalSpace")}>
              <Button variant="outline" className="w-full text-sm">
                צפה בכל ההתראות
              </Button>
            </Link>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}