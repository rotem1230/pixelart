
import React, { useState, useEffect } from "react";
import { SeasonalClient } from "@/api/entities";
import { User } from "@/api/entities";
import { Button } from "@/components/ui/button";
import { Plus, ShieldAlert, Repeat } from "lucide-react";
import SeasonalClientForm from "../components/seasonal_clients/SeasonalClientForm";
import SeasonalClientsTable from "../components/seasonal_clients/SeasonalClientsTable";
import SeasonalClientFilters from "../components/seasonal_clients/SeasonalClientFilters";

export default function SeasonalClients() {
  const [seasonalClients, setSeasonalClients] = useState([]);
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingClient, setEditingClient] = useState(null);
  const [filters, setFilters] = useState({
    search: '',
    month: 'all',
    status: 'all',
    recurrence: 'all',
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [clientsData, userData] = await Promise.all([
        SeasonalClient.getAll(),
        User.getCurrentUser().catch(() => null),
      ]);
      // Sort clients by created date (newest first)
      const sortedClients = clientsData.sort((a, b) => new Date(b.created_date || 0) - new Date(a.created_date || 0));
      setSeasonalClients(sortedClients);
      setUser(userData);
    } catch (error) {
      console.error("Error loading data:", error);
    }
    setIsLoading(false);
  };

  const handleSubmit = async (clientData) => {
    try {
      if (editingClient) {
        await SeasonalClient.update(editingClient.id, clientData);
      } else {
        await SeasonalClient.create(clientData);
      }
      setShowForm(false);
      setEditingClient(null);
      await loadData();
    } catch (error) {
      console.error("Error saving seasonal client:", error);
    }
  };

  const handleEdit = (client) => {
    setEditingClient(client);
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = async (clientId) => {
    if (confirm("האם אתה בטוח שברצונך למחוק רשומה זו?")) {
      try {
        await SeasonalClient.delete(clientId);
        await loadData();
      } catch (error) {
        console.error("Error deleting seasonal client:", error);
      }
    }
  };

  const filteredClients = seasonalClients.filter(client => {
    const searchLower = filters.search.toLowerCase();
    const searchMatch = filters.search === '' ||
      client.event_name.toLowerCase().includes(searchLower) ||
      client.client_name.toLowerCase().includes(searchLower);

    const monthMatch = filters.month === 'all' || client.event_month === filters.month;
    const statusMatch = filters.status === 'all' || client.check_status === filters.status;
    const recurrenceMatch = filters.recurrence === 'all' || client.recurrence_type === filters.recurrence;

    return searchMatch && monthMatch && statusMatch && recurrenceMatch;
  });

  if (isLoading) {
    return (
      <div className="p-8 text-center" dir="rtl">
        טוען...
      </div>
    );
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
    <div className="p-4 sm:p-6 lg:p-8 space-y-4 sm:space-y-6" dir="rtl">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900 mb-2 flex items-center gap-2 sm:gap-3">
            <Repeat className="w-6 sm:w-8 h-6 sm:h-8 text-teal-600" />
            מעקב לקוחות עונתיים
          </h1>
          <p className="text-sm sm:text-base text-gray-600">נהל ועקוב אחר לקוחות ואירועים החוזרים על בסיס קבוע.</p>
        </div>
        <Button onClick={() => { setEditingClient(null); setShowForm(true); }} className="gap-2 bg-green-600 hover:bg-green-700 w-full sm:w-auto">
          <Plus className="w-4 h-4" />
          הוסף למעקב
        </Button>
      </div>

      {(showForm || editingClient) && (
        <SeasonalClientForm
          client={editingClient}
          onSubmit={handleSubmit}
          onCancel={() => { setShowForm(false); setEditingClient(null); }}
        />
      )}

      <SeasonalClientFilters filters={filters} onFiltersChange={setFilters} />

      <SeasonalClientsTable
        clients={filteredClients}
        onEdit={handleEdit}
        onDelete={handleDelete}
        isLoading={isLoading}
      />
    </div>
  );
}
