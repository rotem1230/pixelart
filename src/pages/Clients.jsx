import React, { useState, useEffect, useMemo } from "react";
import { Client } from "@/api/entities";
import { Event } from "@/api/entities";
import { User } from "@/api/entities";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Edit, Trash2, ShieldAlert, Users, Calendar, Briefcase } from "lucide-react";
import ClientForm from "../components/clients/ClientForm";

export default function Clients() {
  const [clients, setClients] = useState([]);
  const [events, setEvents] = useState([]);
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingClient, setEditingClient] = useState(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [clientsData, eventsData, userData] = await Promise.all([
        Client.getAll(),
        Event.getAll(),
        User.getCurrentUser().catch(() => null),
      ]);
      // Sort clients by created date (newest first)
      const sortedClients = clientsData.sort((a, b) => new Date(b.created_date || 0) - new Date(a.created_date || 0));
      setClients(sortedClients);
      setEvents(eventsData);
      setUser(userData);
    } catch (error) {
      console.error("Error loading data:", error);
    }
    setIsLoading(false);
  };

  const eventCountByClient = useMemo(() => {
    return events.reduce((acc, event) => {
      if (event.client_id) {
        acc[event.client_id] = (acc[event.client_id] || 0) + 1;
      }
      return acc;
    }, {});
  }, [events]);

  const handleSubmit = async (clientData) => {
    try {
      if (editingClient) {
        await Client.update(editingClient.id, clientData);
      } else {
        await Client.create(clientData);
      }
      setShowForm(false);
      setEditingClient(null);
      await loadData();
    } catch (error) {
      console.error("Error saving client:", error);
    }
  };

  const handleEdit = (client) => {
    setEditingClient(client);
    setShowForm(true);
  };

  const handleDelete = async (clientId) => {
    if (confirm("האם אתה בטוח שברצונך למחוק את הלקוח?")) {
      try {
        await Client.delete(clientId);
        await loadData();
      } catch (error) {
        console.error("Error deleting client:", error);
      }
    }
  };

  if (isLoading) {
    return <div className="p-8 text-center">טוען נתונים...</div>;
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
        <div>
          <h1 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-2">ניהול לקוחות</h1>
          <p className="text-gray-600">נהל את רשימת הלקוחות שלך וצפה בפעילותם.</p>
        </div>
        <Button onClick={() => { setEditingClient(null); setShowForm(true); }} className="gap-2 bg-green-600 hover:bg-green-700">
          <Plus className="w-4 h-4" />
          לקוח חדש
        </Button>
      </div>

      {showForm && (
        <ClientForm
          client={editingClient}
          onSubmit={handleSubmit}
          onCancel={() => { setShowForm(false); setEditingClient(null); }}
        />
      )}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Briefcase className="w-5 h-5 text-cyan-700" />
            רשימת לקוחות ({clients.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-right">שם לקוח</TableHead>
                  <TableHead className="text-right">איש קשר</TableHead>
                  <TableHead className="text-right">אימייל</TableHead>
                  <TableHead className="text-right">מספר אירועים</TableHead>
                  <TableHead className="text-right">פעולות</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {clients.map(client => (
                  <TableRow key={client.id}>
                    <TableCell className="font-medium">{client.name}</TableCell>
                    <TableCell>{client.contact_person}</TableCell>
                    <TableCell>{client.email}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Calendar className="w-4 h-4 text-gray-400" />
                        {eventCountByClient[client.id] || 0}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button variant="ghost" size="icon" onClick={() => handleEdit(client)}>
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => handleDelete(client.id)} className="text-red-600 hover:text-red-700">
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}