import React, { useState, useEffect } from 'react';
import { Event } from '@/api/entities';
import { User } from '@/api/entities';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Archive, RotateCcw, ShieldAlert, Calendar } from 'lucide-react';
import { format } from 'date-fns';
import { he } from 'date-fns/locale';

export default function ArchivePage() {
    const [archivedEvents, setArchivedEvents] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [user, setUser] = useState(null);

    useEffect(() => {
        const loadPage = async () => {
            setIsLoading(true);
            try {
                const currentUser = await User.getCurrentUser();
                setUser(currentUser);
                if (currentUser.role === 'admin') {
                    const allEvents = await Event.getAll();
                    const archivedEvents = allEvents.filter(event => event.is_archived);
                    setArchivedEvents(archivedEvents);
                }
            } catch (error) {
                console.error("Error loading archive page:", error);
                setUser(null); // Ensure user is null on error
            }
            setIsLoading(false);
        };
        loadPage();
    }, []);

    const handleRestoreEvent = async (eventId) => {
        if (confirm("האם אתה בטוח שברצונך לשחזר את האירוע?")) {
            try {
                await Event.update(eventId, { is_archived: false });
                setArchivedEvents(prevEvents => prevEvents.filter(e => e.id !== eventId));
            } catch (error) {
                console.error("Error restoring event:", error);
                alert("שגיאה בשחזור האירוע.");
            }
        }
    };
    
    if (isLoading) {
        return <div className="p-8">טוען...</div>;
    }

    if (user?.role !== 'admin') {
        return (
            <div className="p-8 text-center">
                <ShieldAlert className="w-16 h-16 mx-auto text-red-500 mb-4" />
                <h1 className="text-2xl font-bold">אין לך הרשאת גישה</h1>
                <p className="text-gray-600">עמוד זה זמין למנהלי מערכת בלבד.</p>
            </div>
        );
    }

    return (
        <div className="p-6 lg:p-8 space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Archive className="w-6 h-6 text-blue-600" />
                        ארכיון אירועים
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead className="text-right">שם האירוע</TableHead>
                                <TableHead className="text-right">תאריך</TableHead>
                                <TableHead className="text-right">מיקום</TableHead>
                                <TableHead className="text-center">פעולות</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {archivedEvents.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={4} className="text-center py-8 text-gray-500">
                                        הארכיון ריק
                                    </TableCell>
                                </TableRow>
                            ) : (
                                archivedEvents.map(event => (
                                    <TableRow key={event.id}>
                                        <TableCell className="font-medium">{event.name}</TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-1">
                                                <Calendar className="w-3 h-3 text-gray-500" />
                                                {format(new Date(event.date), "d בMMMM yyyy", { locale: he })}
                                            </div>
                                        </TableCell>
                                        <TableCell>{event.location || 'לא צוין'}</TableCell>
                                        <TableCell className="text-center">
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => handleRestoreEvent(event.id)}
                                                className="gap-1"
                                            >
                                                <RotateCcw className="w-3 h-3" />
                                                שחזור
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    );
}