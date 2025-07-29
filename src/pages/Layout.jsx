

import React from "react";
import { Link, useLocation } from "react-router-dom";
import { createPageUrl } from "@/utils";
import {
  Calendar,
  CheckSquare,
  Settings,
  Bell,
  Menu,
  X,
  Clock,
  Users,
  FileText,
  User,
  Play,
  Square as StopIcon,
  Archive,
  Briefcase,
  Repeat,
  LogOut
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { useState, useEffect } from "react";
import { User as UserEntity } from "@/api/entities";
import { Event } from "@/api/entities";
import { Task } from "@/api/entities";
import { WorkHours as WorkHoursEntity } from "@/api/entities";
import { differenceInMinutes, format } from 'date-fns';
import NotificationButton from "../components/layout/NotificationButton";

const logoUrl = "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/782b63938_4x.png";

const navigationItems = [
  {
    title: "אירועים",
    url: createPageUrl("Events"),
    icon: Calendar,
    color: "text-green-600"
  },
  {
    title: "משימות",
    url: createPageUrl("Tasks"),
    icon: CheckSquare,
    color: "text-blue-600"
  },
  {
    title: "לוח שנה",
    url: createPageUrl("Calendar"),
    icon: Calendar,
    color: "text-purple-600"
  },
  {
    title: "שעות עבודה",
    url: createPageUrl("WorkHours"),
    icon: Clock,
    color: "text-orange-600"
  },
  {
    title: "אזור אישי",
    url: createPageUrl("PersonalSpace"),
    icon: User,
    color: "text-indigo-600"
  }
];

const adminItems = [
  {
    title: "ניהול צוות",
    url: createPageUrl("TeamManagement"),
    icon: Users,
    color: "text-red-600"
  },
  {
    title: "לקוחות",
    url: createPageUrl("Clients"),
    icon: Briefcase,
    color: "text-cyan-600"
  },
  {
    title: "מעקב עונתי",
    url: createPageUrl("SeasonalClients"),
    icon: Repeat,
    color: "text-teal-600"
  },
  {
    title: "ארכיון",
    url: createPageUrl("Archive"),
    icon: Archive,
    color: "text-blue-600"
  },
  {
    title: "הגדרות",
    url: createPageUrl("Settings"),
    icon: Settings,
    color: "text-gray-600"
  }
];

export default function Layout({ children, currentPageName }) {
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [user, setUser] = useState(null);
  const [eventCount, setEventCount] = useState(0);
  const [taskCount, setTaskCount] = useState(0);
  const [activeTimer, setActiveTimer] = useState(null);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    loadUserData();
    loadStats();
    
    const interval = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const loadUserData = async () => {
    try {
      const userData = await UserEntity.getCurrentUser();
      setUser(userData);
      setIsAdmin(userData?.role === 'admin');
      
      if (userData?.active_timer_id) {
        const workHour = await WorkHoursEntity.get(userData.active_timer_id);
        setActiveTimer(workHour);
      }
    } catch (error) {
      console.error("Error loading user data:", error);
    }
  };

  const loadStats = async () => {
    try {
      const [events, tasks] = await Promise.all([
        Event.getAll(),
        Task.getAll()
      ]);
      const activeEvents = events.filter(event => !event.is_archived);
      const activeTasks = tasks.filter(task => task.status !== 'הושלם');
      setEventCount(activeEvents.length);
      setTaskCount(activeTasks.length);
    } catch (error) {
      console.error("Error loading stats:", error);
    }
  };

  const isActive = (url) => {
    return location.pathname === url;
  };

  const getElapsedTime = () => {
    if (!activeTimer || !user?.active_timer_id) return "00:00:00";
    
    const startTimeString = `${activeTimer.date}T${activeTimer.start_time}`;
    const startTime = new Date(startTimeString);
    
    if (isNaN(startTime.getTime())) {
      return "00:00:00";
    }

    const totalMinutes = differenceInMinutes(currentTime, startTime);
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:00`;
  };

  const handleLogout = async () => {
    try {
      await UserEntity.logout();
      // Redirect to login page
      window.location.href = '/login';
    } catch (error) {
      console.error("Error logging out:", error);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50" dir="rtl">
      {/* Mobile Header */}
      <div className="lg:hidden bg-white/80 backdrop-blur-sm border-b border-gray-200 px-4 py-3 sticky top-0 z-50">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src={logoUrl} alt="Pixel Art Logo" className="h-8" />
          </div>
          <div className="flex items-center gap-2">
            {/* NotificationButton removed from here */}
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            >
              {isMobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>
          </div>
        </div>
      </div>

      <div className="flex" dir="rtl">
        {/* Sidebar */}
        <div className={`${
          isMobileMenuOpen ? 'translate-x-0' : 'translate-x-full'
        } lg:translate-x-0 transform transition-transform duration-300 ease-in-out fixed lg:relative z-40 w-72 h-screen bg-white/95 backdrop-blur-xl shadow-2xl border-l border-gray-200 overflow-y-auto`}>

          {/* Header */}
          <div className="p-6 border-b border-gray-100 flex justify-between items-center">
            <img src={logoUrl} alt="Pixel Art Logo" className="h-10" />
            {/* NotificationButton removed from here */}
          </div>

          {/* Navigation */}
          <nav className="p-4 space-y-2">
            <div className="mb-4">
              <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider px-2 mb-2">
                ניווט ראשי
              </h3>
              {navigationItems.map((item) => {
                // For operators, show only Events and Calendar
                if (user?.role === 'operator' && !['אירועים', 'לוח שנה'].includes(item.title)) {
                  return null;
                }
                if (item.title === "אזור אישי") {
                  return (
                    <div key={item.title} className="flex items-center gap-2">
                       <Link
                        to={item.url}
                        onClick={() => setIsMobileMenuOpen(false)}
                        className={`flex-1 flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 hover:bg-gray-100 group ${
                          isActive(item.url)
                            ? 'bg-green-50 text-green-800 font-semibold shadow-sm'
                            : 'text-gray-700 hover:text-gray-900'
                        }`}
                      >
                        <item.icon className={`w-5 h-5 ${
                          isActive(item.url) ? 'text-green-600' : item.color
                        }`} />
                        <span className="font-medium">{item.title}</span>
                        {isActive(item.url) && (
                          <div className="w-2 h-2 bg-green-600 rounded-full mr-auto"></div>
                        )}
                      </Link>
                      <NotificationButton />
                    </div>
                  )
                }
                return (
                  <Link
                    key={item.title}
                    to={item.url}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 hover:bg-gray-100 group ${
                      isActive(item.url)
                        ? 'bg-green-50 text-green-800 font-semibold shadow-sm'
                        : 'text-gray-700 hover:text-gray-900'
                    }`}
                  >
                    <item.icon className={`w-5 h-5 ${
                      isActive(item.url) ? 'text-green-600' : item.color
                    }`} />
                    <span className="font-medium">{item.title}</span>
                    {isActive(item.url) && (
                      <div className="w-2 h-2 bg-green-600 rounded-full mr-auto"></div>
                    )}
                  </Link>
                );
              })}
            </div>

            {/* Admin Section */}
            {isAdmin && (
              <div className="mb-4">
                <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider px-2 mb-2">
                  ניהול
                </h3>
                {adminItems.map((item) => (
                  <Link
                    key={item.title}
                    to={item.url}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 hover:bg-gray-50 group ${
                      isActive(item.url)
                        ? 'bg-red-50 text-red-700 shadow-md'
                        : 'text-gray-700 hover:text-gray-900'
                    }`}
                  >
                    <item.icon className={`w-5 h-5 ${
                      isActive(item.url) ? 'text-red-600' : item.color
                    }`} />
                    <span className="font-medium">{item.title}</span>
                    {isActive(item.url) && (
                      <div className="w-2 h-2 bg-red-600 rounded-full mr-auto"></div>
                    )}
                  </Link>
                ))}
              </div>
            )}
          </nav>

          {/* Quick Stats */}
          <div className="p-4 border-t border-gray-100">
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
              סקירה כללית
            </h3>
            <div className="space-y-2">
              <div className="flex items-center justify-between p-2 bg-green-50 rounded-lg">
                <span className="text-sm text-green-700">אירועים פעילים</span>
                <Badge className="bg-green-600">{eventCount}</Badge>
              </div>
              <div className="flex items-center justify-between p-2 bg-blue-50 rounded-lg">
                <span className="text-sm text-blue-700">משימות פתוחות</span>
                <Badge className="bg-blue-600">{taskCount}</Badge>
              </div>
              
              {/* Active Timer */}
              {user?.active_timer_id && (
                <div className="p-3 bg-orange-50 border border-orange-200 rounded-lg">
                  <div className="flex items-center gap-2 mb-1">
                    <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                    <span className="text-xs font-medium text-orange-800">טיימר פעיל</span>
                  </div>
                  <div className="font-mono text-lg font-bold text-orange-900">
                    {getElapsedTime()}
                  </div>
                  <div className="text-xs text-orange-700 truncate">
                    {user.active_timer_event_name}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* User Profile */}
          <div className="p-4 border-t border-gray-100 mt-auto">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 bg-green-600 rounded-full flex items-center justify-center">
                <span className="text-white font-bold">
                  {user?.full_name ? user.full_name.charAt(0) : 'מ'}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-medium text-gray-900 truncate">
                  {user?.full_name || "משתמש"}
                </div>
                <div className="text-xs text-gray-500 truncate">
                  {user?.email}
                </div>
              </div>
            </div>
            <Button 
              onClick={handleLogout}
              variant="outline" 
              size="sm" 
              className="w-full text-xs flex items-center gap-2 hover:bg-red-50 hover:border-red-200 hover:text-red-600 transition-colors"
            >
              <LogOut className="w-3 h-3" />
              יציאה מהמערכת
            </Button>
          </div>
        </div>

        {/* Mobile Overlay */}
        {isMobileMenuOpen && (
          <div
            className="fixed inset-0 bg-black/20 backdrop-blur-sm z-30 lg:hidden"
            onClick={() => setIsMobileMenuOpen(false)}
          />
        )}

        {/* Main Content */}
        <main className="flex-1 overflow-auto" dir="rtl">
          {children}
        </main>
      </div>
    </div>
  );
}

