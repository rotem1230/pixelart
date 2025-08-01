import React, { useState, useEffect } from "react";
import { User } from "@/api/entities";
import { Tag } from "@/api/entities";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tag as TagIcon, Palette, Users, ShieldAlert, Database } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import TagManager from "../components/settings/TagManager";
import UserManager from "../components/settings/UserManager";
import DatabaseManager from "../components/database/DatabaseManager";

export default function Settings() {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const userData = await User.getCurrentUser();
        setUser(userData);
      } catch (error) {
        console.error("Failed to fetch user", error);
      }
      setIsLoading(false);
    };
    fetchUser();
  }, []);

  if (isLoading) {
    return <div className="p-8">טוען נתונים...</div>;
  }

  if (user?.role !== 'admin') {
    return (
      <div className="p-8 text-center" dir="rtl">
        <ShieldAlert className="w-16 h-16 mx-auto text-red-500 mb-4" />
        <h1 className="text-2xl font-bold">אין לך הרשאת גישה</h1>
        <p className="text-gray-600">עמוד זה זמין למנהלי מערכת בלבד.</p>
      </div>
    );
  }

  return (
    <div className="p-6 lg:p-8 space-y-6" dir="rtl">
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
        <div className="text-right">
          <h1 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-2">
            הגדרות מערכת
          </h1>
          <p className="text-gray-600">
            נהל את התיוגים, המשתמשים והגדרות המערכת.
          </p>
        </div>
      </div>

      <Tabs defaultValue="tags" className="w-full">
        <TabsList className="grid w-full max-w-lg grid-cols-3 mr-auto">
          <TabsTrigger value="users" className="flex items-center gap-2">
            <Users className="w-4 h-4" />
            ניהול משתמשים
          </TabsTrigger>
          <TabsTrigger value="tags" className="flex items-center gap-2">
            <TagIcon className="w-4 h-4" />
            ניהול תיוגים
          </TabsTrigger>
          <TabsTrigger value="database" className="flex items-center gap-2">
            <Database className="w-4 h-4" />
            מסד נתונים
          </TabsTrigger>
        </TabsList>

        <TabsContent value="tags" className="mt-6">
          <TagManager />
        </TabsContent>

        <TabsContent value="users" className="mt-6">
          <UserManager />
        </TabsContent>

        <TabsContent value="database" className="mt-6">
          <DatabaseManager />
        </TabsContent>
      </Tabs>
    </div>
  );
}