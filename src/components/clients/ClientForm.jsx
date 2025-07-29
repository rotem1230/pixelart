import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function ClientForm({ client, onSubmit, onCancel }) {
  const [formData, setFormData] = useState({
    name: "",
    contact_person: "",
    email: "",
    phone: "",
    address: ""
  });

  useEffect(() => {
    if (client) {
      setFormData({
        name: client.name || "",
        contact_person: client.contact_person || "",
        email: client.email || "",
        phone: client.phone || "",
        address: client.address || ""
      });
    }
  }, [client]);

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData);
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <Card className="bg-white shadow-lg border-0 rounded-2xl">
      <CardHeader className="bg-gray-100 rounded-t-2xl">
        <CardTitle className="text-xl font-bold text-gray-900">
          {client ? "עריכת לקוח" : "לקוח חדש"}
        </CardTitle>
      </CardHeader>
      <CardContent className="p-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="name" className="font-medium">שם הלקוח *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => handleInputChange("name", e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="contact_person" className="font-medium">איש קשר</Label>
              <Input
                id="contact_person"
                value={formData.contact_person}
                onChange={(e) => handleInputChange("contact_person", e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email" className="font-medium">אימייל</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => handleInputChange("email", e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone" className="font-medium">טלפון</Label>
              <Input
                id="phone"
                value={formData.phone}
                onChange={(e) => handleInputChange("phone", e.target.value)}
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="address" className="font-medium">כתובת</Label>
            <Input
              id="address"
              value={formData.address}
              onChange={(e) => handleInputChange("address", e.target.value)}
            />
          </div>
          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="outline" onClick={onCancel}>ביטול</Button>
            <Button type="submit" className="bg-green-600 hover:bg-green-700">
              {client ? "עדכן לקוח" : "שמור לקוח"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}