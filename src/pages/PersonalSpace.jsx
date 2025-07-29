
import React, { useState, useEffect } from "react";
import { User } from "@/api/entities";
import { PersonalMessage } from "@/api/entities";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { User as UserIcon, Edit, Save, X, Bell } from "lucide-react";
import MessageCard from "../components/personal/MessageCard";
import ProfileCard from "../components/personal/ProfileCard";

export default function PersonalSpace() {
  const [user, setUser] = useState(null);
  const [messages, setMessages] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditingName, setIsEditingName] = useState(false);
  const [newName, setNewName] = useState("");

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const userData = await User.getCurrentUser();
      setUser(userData);
      setNewName(userData.name || userData.full_name || "");
      
      const messagesData = await PersonalMessage.getAll();
      const userMessages = messagesData.filter(msg => msg.recipient_id === userData.id);
      setMessages(userMessages.sort((a, b) => new Date(b.created_date) - new Date(a.created_date)));
    } catch (error) {
      console.error("Error loading personal data:", error);
    }
    setIsLoading(false);
  };

  const handleNameUpdate = async () => {
    if (!newName.trim()) return;
    
    try {
      // Update user in localStorage
      const updatedUser = { ...user, name: newName.trim(), full_name: newName.trim() };
      localStorage.setItem('currentUser', JSON.stringify(updatedUser));
      setUser(updatedUser);
      setIsEditingName(false);
    } catch (error) {
      console.error("Error updating name:", error);
    }
  };

  const markMessageAsRead = async (messageId) => {
    try {
      await PersonalMessage.update(messageId, { is_read: true });
      setMessages(messages.map(msg => 
        msg.id === messageId ? { ...msg, is_read: true } : msg
      ));
    } catch (error) {
      console.error("Error marking message as read:", error);
    }
  };

  const unreadMessages = messages.filter(msg => !msg.is_read);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
      </div>
    );
  }

  return (
    <div className="p-6 lg:p-8 space-y-8">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900">אזור אישי</h1>
        {unreadMessages.length > 0 && (
          <Badge variant="destructive" className="flex items-center gap-1">
            <Bell className="w-4 h-4" />
            {unreadMessages.length} הודעות חדשות
          </Badge>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Profile Section */}
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <UserIcon className="w-5 h-5" />
                פרופיל אישי
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-center">
                <div className="w-20 h-20 bg-green-600 rounded-full flex items-center justify-center">
                  <span className="text-white font-bold text-2xl">
                    {(user?.name || user?.full_name) ? (user.name || user.full_name).charAt(0) : 'מ'}
                  </span>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">שם מלא</label>
                {isEditingName ? (
                  <div className="flex gap-2">
                    <Input
                      value={newName}
                      onChange={(e) => setNewName(e.target.value)}
                      className="flex-1"
                      placeholder="הכניסו שם מלא"
                    />
                    <Button size="sm" onClick={handleNameUpdate}>
                      <Save className="w-4 h-4" />
                    </Button>
                    <Button 
                      size="sm" 
                      variant="outline" 
                      onClick={() => {
                        setIsEditingName(false);
                        setNewName(user?.name || user?.full_name || "");
                      }}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                ) : (
                  <div className="flex items-center justify-between">
                    <span className="text-gray-900">{user?.name || user?.full_name || "לא הוגדר"}</span>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => setIsEditingName(true)}
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">אימייל</label>
                <p className="text-gray-900">{user?.email}</p>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">תפקיד</label>
                <Badge variant={
                  user?.role === 'admin' ? 'destructive' : 
                  user?.role === 'operator' ? 'default' : 'secondary'
                } className={
                  user?.role === 'operator' ? 'bg-orange-100 text-orange-800 border-orange-200' : ''
                }>
                  {user?.role === 'admin' ? 'מנהל' : 
                   user?.role === 'operator' ? 'מפעיל' : 'עובד'}
                </Badge>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Messages Section */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="w-5 h-5" />
                הודעות אישיות
                {unreadMessages.length > 0 && (
                  <Badge variant="destructive">{unreadMessages.length}</Badge>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {messages.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <Bell className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                  <p>אין הודעות אישיות</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {messages.map((message) => (
                    <MessageCard
                      key={message.id}
                      message={message}
                      onMarkAsRead={() => markMessageAsRead(message.id)}
                    />
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
