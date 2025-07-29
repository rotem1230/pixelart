import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { User, Mail, Phone, Calendar, Briefcase } from "lucide-react";
import { format } from "date-fns";
import { he } from "date-fns/locale";

export default function ProfileCard({ user }) {
  if (!user) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="animate-pulse">
            <div className="bg-gray-200 h-16 w-16 rounded-full mx-auto mb-4"></div>
            <div className="bg-gray-200 h-4 w-32 mx-auto mb-2"></div>
            <div className="bg-gray-200 h-3 w-24 mx-auto"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <User className="w-5 h-5 text-blue-600" />
          הפרופיל שלי
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-center space-y-4">
          {/* Avatar */}
          <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center mx-auto">
            <span className="text-white font-bold text-xl">
              {user.full_name ? user.full_name[0] : 'מ'}
            </span>
          </div>
          
          {/* User Info */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900">
              {user.full_name || 'משתמש'}
            </h3>
            <Badge className={user.role === 'admin' ? 'bg-red-100 text-red-800' : 'bg-blue-100 text-blue-800'}>
              {user.role === 'admin' ? 'מנהל' : 'עובד'}
            </Badge>
          </div>
          
          {/* Contact Info */}
          <div className="space-y-2 text-sm">
            <div className="flex items-center gap-2 justify-center">
              <Mail className="w-4 h-4 text-gray-500" />
              <span className="text-gray-700">{user.email}</span>
            </div>
            
            {user.phone && (
              <div className="flex items-center gap-2 justify-center">
                <Phone className="w-4 h-4 text-gray-500" />
                <span className="text-gray-700">{user.phone}</span>
              </div>
            )}
            
            {user.position && (
              <div className="flex items-center gap-2 justify-center">
                <Briefcase className="w-4 h-4 text-gray-500" />
                <span className="text-gray-700">{user.position}</span>
              </div>
            )}
            
            {user.hire_date && (
              <div className="flex items-center gap-2 justify-center">
                <Calendar className="w-4 h-4 text-gray-500" />
                <span className="text-gray-700">
                  מתאריך: {format(new Date(user.hire_date), "d בMMMM yyyy", { locale: he })}
                </span>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}