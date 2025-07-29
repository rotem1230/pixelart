import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Edit, Trash2, Shield, User as UserIcon, Eye, EyeOff } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

export default function UserManager() {
    const [users, setUsers] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [showUserDialog, setShowUserDialog] = useState(false);
    const [editingUser, setEditingUser] = useState(null);
    const [showPassword, setShowPassword] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: '',
        role: 'user'
    });
    const [error, setError] = useState('');

    useEffect(() => {
        loadUsers();
    }, []);

    const loadUsers = () => {
        // Load users from localStorage (simulating a database)
        const storedUsers = localStorage.getItem('systemUsers');
        if (storedUsers) {
            setUsers(JSON.parse(storedUsers));
        } else {
            // Initialize with default users
            const defaultUsers = [
                {
                    id: '1',
                    name: 'Pixel Art VJ',
                    email: 'pixelartvj@gmail.com',
                    role: 'admin',
                    createdAt: new Date().toISOString(),
                    lastLogin: new Date().toISOString()
                },
                {
                    id: '2',
                    name: 'Pixel Office 2025',
                    email: 'pixeloffice2025@gmail.com',
                    role: 'user',
                    createdAt: new Date().toISOString(),
                    lastLogin: new Date().toISOString()
                }
            ];
            setUsers(defaultUsers);
            localStorage.setItem('systemUsers', JSON.stringify(defaultUsers));
        }
        setIsLoading(false);
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
        if (error) setError('');
    };

    const handleRoleChange = (value) => {
        setFormData(prev => ({
            ...prev,
            role: value
        }));
    };

    const validateForm = () => {
        if (!formData.name.trim()) {
            setError('שם המשתמש נדרש');
            return false;
        }
        if (!formData.email.trim()) {
            setError('כתובת אימייל נדרשת');
            return false;
        }
        if (!formData.email.includes('@')) {
            setError('כתובת אימייל לא תקינה');
            return false;
        }
        if (!editingUser && !formData.password.trim()) {
            setError('סיסמה נדרשת');
            return false;
        }
        if (formData.password && formData.password.length < 6) {
            setError('הסיסמה חייבת להכיל לפחות 6 תווים');
            return false;
        }

        // Check if email already exists (except for current user when editing)
        const emailExists = users.some(user =>
            user.email === formData.email && (!editingUser || user.id !== editingUser.id)
        );
        if (emailExists) {
            setError('כתובת אימייל זו כבר קיימת במערכת');
            return false;
        }

        return true;
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!validateForm()) return;

        const updatedUsers = [...users];

        if (editingUser) {
            // Update existing user
            const index = updatedUsers.findIndex(u => u.id === editingUser.id);
            if (index !== -1) {
                updatedUsers[index] = {
                    ...updatedUsers[index],
                    name: formData.name.trim(),
                    email: formData.email.trim(),
                    role: formData.role,
                    ...(formData.password && { password: formData.password })
                };
            }
        } else {
            // Create new user
            const newUser = {
                id: Date.now().toString(),
                name: formData.name.trim(),
                email: formData.email.trim(),
                password: formData.password,
                role: formData.role,
                createdAt: new Date().toISOString(),
                lastLogin: null
            };
            updatedUsers.push(newUser);
        }

        setUsers(updatedUsers);
        localStorage.setItem('systemUsers', JSON.stringify(updatedUsers));

        // Update the SDK credentials if needed
        updateSDKCredentials(updatedUsers);

        resetForm();
        setShowUserDialog(false);

        // Show success message
        const action = editingUser ? 'עודכן' : 'נוצר';
        alert(`המשתמש ${action} בהצלחה!`);
    };

    const updateSDKCredentials = (usersList) => {
        // Update the system users in localStorage so they can login
        localStorage.setItem('systemUsers', JSON.stringify(usersList));

        // Also update any existing logged-in user if their data changed
        const currentUser = localStorage.getItem('currentUser');
        if (currentUser) {
            const user = JSON.parse(currentUser);
            const updatedUser = usersList.find(u => u.email === user.email);
            if (updatedUser) {
                const newUserData = {
                    ...user,
                    name: updatedUser.name,
                    full_name: updatedUser.name,
                    role: updatedUser.role
                };
                localStorage.setItem('currentUser', JSON.stringify(newUserData));
            }
        }
    };

    const handleEdit = (user) => {
        setEditingUser(user);
        setFormData({
            name: user.name,
            email: user.email,
            password: '',
            role: user.role
        });
        setShowUserDialog(true);
    };

    const handleDelete = (userId) => {
        if (confirm('האם אתה בטוח שברצונך למחוק את המשתמש?')) {
            const updatedUsers = users.filter(u => u.id !== userId);
            setUsers(updatedUsers);
            localStorage.setItem('systemUsers', JSON.stringify(updatedUsers));
            updateSDKCredentials(updatedUsers);
        }
    };

    const resetForm = () => {
        setFormData({
            name: '',
            email: '',
            password: '',
            role: 'user'
        });
        setEditingUser(null);
        setError('');
        setShowPassword(false);
    };

    const getRoleBadge = (role) => {
        if (role === 'admin') {
            return (
                <Badge variant="destructive" className="flex items-center gap-1">
                    <Shield className="w-3 h-3" />
                    מנהל
                </Badge>
            );
        } else if (role === 'operator') {
            return (
                <Badge variant="default" className="flex items-center gap-1 bg-orange-100 text-orange-800 border-orange-200">
                    <UserIcon className="w-3 h-3" />
                    מפעיל
                </Badge>
            );
        } else {
            return (
                <Badge variant="secondary" className="flex items-center gap-1">
                    <UserIcon className="w-3 h-3" />
                    משתמש
                </Badge>
            );
        }
    };

    if (isLoading) {
        return <div className="p-4">טוען משתמשים...</div>;
    }

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-2xl font-bold">ניהול משתמשים</h2>
                    <p className="text-gray-600">נהל את המשתמשים והרשאותיהם במערכת</p>
                </div>

                <Dialog open={showUserDialog} onOpenChange={setShowUserDialog}>
                    <DialogTrigger asChild>
                        <Button onClick={resetForm} className="gap-2">
                            <Plus className="w-4 h-4" />
                            משתמש חדש
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-md">
                        <DialogHeader>
                            <DialogTitle>
                                {editingUser ? 'עריכת משתמש' : 'משתמש חדש'}
                            </DialogTitle>
                        </DialogHeader>

                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="name">שם מלא</Label>
                                <Input
                                    id="name"
                                    name="name"
                                    value={formData.name}
                                    onChange={handleInputChange}
                                    placeholder="הזן שם מלא"
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="email">כתובת אימייל</Label>
                                <Input
                                    id="email"
                                    name="email"
                                    type="email"
                                    value={formData.email}
                                    onChange={handleInputChange}
                                    placeholder="user@example.com"
                                    dir="ltr"
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="password">
                                    {editingUser ? 'סיסמה חדשה (אופציונלי)' : 'סיסמה'}
                                </Label>
                                <div className="relative">
                                    <Input
                                        id="password"
                                        name="password"
                                        type={showPassword ? 'text' : 'password'}
                                        value={formData.password}
                                        onChange={handleInputChange}
                                        placeholder={editingUser ? 'השאר ריק כדי לא לשנות' : 'הזן סיסמה (מינימום 6 תווים)'}
                                        className="pl-10"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                                    >
                                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                    </button>
                                </div>
                                {editingUser && (
                                    <p className="text-xs text-gray-500">
                                        השאר ריק כדי לשמור על הסיסמה הנוכחית
                                    </p>
                                )}
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="role">תפקיד</Label>
                                <Select value={formData.role} onValueChange={handleRoleChange}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="בחר תפקיד" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="user">משתמש רגיל</SelectItem>
                                        <SelectItem value="operator">מפעיל</SelectItem>
                                        <SelectItem value="admin">מנהל מערכת</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            {error && (
                                <Alert className="border-red-200 bg-red-50">
                                    <AlertDescription className="text-red-700">
                                        {error}
                                    </AlertDescription>
                                </Alert>
                            )}

                            <div className="flex gap-2 pt-4">
                                <Button type="submit" className="flex-1">
                                    {editingUser ? 'עדכן' : 'צור משתמש'}
                                </Button>
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => setShowUserDialog(false)}
                                    className="flex-1"
                                >
                                    ביטול
                                </Button>
                            </div>
                        </form>
                    </DialogContent>
                </Dialog>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <UserIcon className="w-5 h-5" />
                        רשימת משתמשים ({users.length})
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>שם</TableHead>
                                <TableHead>אימייל</TableHead>
                                <TableHead>תפקיד</TableHead>
                                <TableHead>תאריך יצירה</TableHead>
                                <TableHead>פעולות</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {users.map((user) => (
                                <TableRow key={user.id}>
                                    <TableCell className="font-medium">{user.name}</TableCell>
                                    <TableCell className="font-mono text-sm">{user.email}</TableCell>
                                    <TableCell>{getRoleBadge(user.role)}</TableCell>
                                    <TableCell className="text-sm text-gray-600">
                                        {new Date(user.createdAt).toLocaleDateString('he-IL')}
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex gap-2">
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => handleEdit(user)}
                                                className="gap-1"
                                            >
                                                <Edit className="w-3 h-3" />
                                                ערוך
                                            </Button>
                                            <Button
                                                variant="destructive"
                                                size="sm"
                                                onClick={() => handleDelete(user.id)}
                                                className="gap-1"
                                            >
                                                <Trash2 className="w-3 h-3" />
                                                מחק
                                            </Button>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    );
}