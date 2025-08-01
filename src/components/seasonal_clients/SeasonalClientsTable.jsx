import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Edit, Trash2, Repeat, ExternalLink } from 'lucide-react';
import { format } from 'date-fns';
import { he } from 'date-fns/locale';

const statusColors = {
  "טרם פניתי": "bg-gray-100 text-gray-800",
  "יצרתי קשר": "bg-blue-100 text-blue-800",
  "רלוונטי": "bg-green-100 text-green-800",
  "לא מתקיים השנה": "bg-red-100 text-red-800",
  "לבדוק מי המפיק": "bg-yellow-100 text-yellow-800",
};

export default function SeasonalClientsTable({ clients, onEdit, onDelete, isLoading }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Repeat className="w-5 h-5 text-teal-700" />
          רשימת מעקב לקוחות עונתיים ({clients.length})
        </CardTitle>
      </CardHeader>
      <CardContent className="p-3 sm:p-6">
        {/* Mobile Card Layout */}
        <div className="block sm:hidden space-y-3">
          {isLoading ? (
            Array(3).fill(0).map((_, i) => (
              <Card key={i} className="border border-gray-200">
                <CardContent className="p-4">
                  <div className="h-4 bg-gray-200 animate-pulse rounded-md w-32 mb-2"></div>
                  <div className="h-3 bg-gray-200 animate-pulse rounded-md w-24 mb-2"></div>
                  <div className="h-3 bg-gray-200 animate-pulse rounded-md w-20"></div>
                </CardContent>
              </Card>
            ))
          ) : clients.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              לא נמצאו רשומות במערכת המעקב.
            </div>
          ) : (
            clients.map(client => (
              <Card key={client.id} className="border border-gray-200">
                <CardContent className="p-4">
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="font-medium text-gray-900">{client.event_name}</h3>
                        <Badge className={`${statusColors[client.check_status] || 'bg-gray-100'} text-xs`}>
                          {client.check_status}
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-600 mb-1">לקוח: {client.client_name}</p>
                      <p className="text-sm text-gray-600 mb-1">חודש: {client.event_month}</p>
                      {client.next_contact_date && (
                        <p className="text-sm text-gray-500">
                          פנייה הבאה: {format(new Date(client.next_contact_date), 'd/MM/yy', { locale: he })}
                        </p>
                      )}
                    </div>
                    <div className="flex gap-1">
                      {client.drive_link && (
                        <a href={client.drive_link} target="_blank" rel="noopener noreferrer">
                          <Button variant="ghost" size="sm">
                            <ExternalLink className="w-4 h-4" />
                          </Button>
                        </a>
                      )}
                      <Button variant="ghost" size="sm" onClick={() => onEdit(client)}>
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => onDelete(client.id)} className="text-red-600 hover:text-red-700">
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>

        {/* Desktop Table Layout */}
        <div className="hidden sm:block overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-right">חודש</TableHead>
                <TableHead className="text-right">שם אירוע</TableHead>
                <TableHead className="text-right">לקוח/מפיק</TableHead>
                <TableHead className="text-right">סטטוס</TableHead>
                <TableHead className="text-right">ת. פנייה הבא</TableHead>
                <TableHead className="text-right">קישור</TableHead>
                <TableHead className="text-right">פעולות</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array(5).fill(0).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell colSpan={7} className="p-0">
                      <div className="h-12 bg-gray-200 animate-pulse rounded-md w-full"></div>
                    </TableCell>
                  </TableRow>
                ))
              ) : clients.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-gray-500">
                    לא נמצאו רשומות במערכת המעקב.
                  </TableCell>
                </TableRow>
              ) : (
                clients.map(client => (
                  <TableRow key={client.id}>
                    <TableCell className="font-medium">{client.event_month}</TableCell>
                    <TableCell className="font-medium">{client.event_name}</TableCell>
                    <TableCell>{client.client_name}</TableCell>
                    <TableCell>
                      <Badge className={statusColors[client.check_status] || 'bg-gray-100'}>
                        {client.check_status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {client.next_contact_date ? format(new Date(client.next_contact_date), 'd/MM/yy', { locale: he }) : '-'}
                    </TableCell>
                    <TableCell>
                      {client.drive_link && (
                        <a href={client.drive_link} target="_blank" rel="noopener noreferrer">
                          <Button variant="ghost" size="icon"><ExternalLink className="w-4 h-4" /></Button>
                        </a>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button variant="ghost" size="icon" onClick={() => onEdit(client)}><Edit className="w-4 h-4" /></Button>
                        <Button variant="ghost" size="icon" onClick={() => onDelete(client.id)} className="text-red-600 hover:text-red-700"><Trash2 className="w-4 h-4" /></Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}