
import React, { useState, useEffect } from "react";
import { Tag } from "@/api/entities";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Plus, Trash2, Edit, Save, X, Palette } from "lucide-react";

function getTextColor(bgColor) {
  if (!bgColor) return '#000000';
  const color = bgColor.substring(1); // remove #
  const rgb = parseInt(color, 16);
  const r = (rgb >> 16) & 0xff;
  const g = (rgb >> 8) & 0xff;
  const b = (rgb >> 0) & 0xff;
  const luma = 0.2126 * r + 0.7152 * g + 0.0722 * b;
  return luma < 128 ? '#ffffff' : '#000000';
}

export default function TagManager() {
  const [tags, setTags] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [newTagName, setNewTagName] = useState("");
  const [newTagColor, setNewTagColor] = useState("#e2e8f0");
  const [editingTag, setEditingTag] = useState(null);

  useEffect(() => {
    fetchTags();
  }, []);

  const fetchTags = async () => {
    setIsLoading(true);
    try {
      const tagsData = await Tag.getAll();
      setTags(tagsData);
    } catch (error) {
      console.error("Error fetching tags:", error);
    }
    setIsLoading(false);
  };

  const handleAddTag = async () => {
    if (!newTagName) return;
    try {
      await Tag.create({
        name: newTagName,
        color: newTagColor,
        text_color: getTextColor(newTagColor)
      });
      setNewTagName("");
      setNewTagColor("#e2e8f0");
      fetchTags();
    } catch (error) {
      console.error("Error adding tag:", error);
    }
  };

  const handleDeleteTag = async (tagId) => {
    if (confirm("האם אתה בטוח שברצונך למחוק תיוג זה?")) {
      try {
        await Tag.delete(tagId);
        fetchTags();
      } catch (error) {
        console.error("Error deleting tag:", error);
      }
    }
  };

  const handleUpdateTag = async (tag) => {
    try {
      await Tag.update(tag.id, { 
        name: tag.name, 
        color: tag.color,
        text_color: getTextColor(tag.color)
      });
      setEditingTag(null);
      fetchTags();
    } catch (error) {
      console.error("Error updating tag:", error);
    }
  };

  const startEditing = (tag) => {
    setEditingTag({ ...tag });
  };
  
  const cancelEditing = () => {
    setEditingTag(null);
  };

  const onEditFormChange = (field, value) => {
    setEditingTag(prev => ({ ...prev, [field]: value }));
  };

  if (isLoading) {
    return <div className="p-4 text-center">טוען תיוגים...</div>;
  }

  return (
    <div className="grid md:grid-cols-2 gap-8" dir="rtl">
      <Card>
        <CardHeader>
          <CardTitle className="text-right">הוספת תיוג חדש</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="new-tag-name" className="text-right block">שם התיוג</Label>
            <Input
              id="new-tag-name"
              value={newTagName}
              onChange={(e) => setNewTagName(e.target.value)}
              placeholder="למשל: חשוב"
              className="text-right"
            />
          </div>
          <div className="space-y-2">
            <Label className="text-right block">צבע רקע</Label>
            <div className="flex items-center gap-4 justify-end">
              <Input
                value={newTagColor}
                onChange={(e) => setNewTagColor(e.target.value)}
                className="w-32 text-left"
                dir="ltr"
              />
              <Input
                type="color"
                value={newTagColor}
                onChange={(e) => setNewTagColor(e.target.value)}
                className="p-1 h-10 w-16 cursor-pointer"
              />
            </div>
            <div className="flex gap-2 justify-end flex-wrap mt-2">
              {['#ef4444', '#f97316', '#eab308', '#22c55e', '#3b82f6', '#8b5cf6', '#ec4899', '#6b7280'].map(color => (
                <button
                  key={color}
                  type="button"
                  onClick={() => setNewTagColor(color)}
                  className="w-6 h-6 rounded border-2 border-gray-300 hover:border-gray-500 transition-colors"
                  style={{ backgroundColor: color }}
                  title={color}
                />
              ))}
            </div>
          </div>
          <Button onClick={handleAddTag} className="w-full">
            <Plus className="w-4 h-4 mr-2" />
            הוסף תיוג
          </Button>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle className="text-right">תיוגים קיימים ({tags.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {tags.map((tag) => (
              <div key={tag.id}>
                {editingTag?.id === tag.id ? (
                  // Edit View
                  <div className="p-3 border rounded-lg space-y-3">
                    <Input
                      value={editingTag.name}
                      onChange={(e) => onEditFormChange('name', e.target.value)}
                      className="text-right"
                    />
                    <div className="flex items-center gap-4 justify-end">
                      <Input
                        value={editingTag.color}
                        onChange={(e) => onEditFormChange('color', e.target.value)}
                        className="w-32 text-left"
                        dir="ltr"
                      />
                      <Input
                        type="color"
                        value={editingTag.color}
                        onChange={(e) => onEditFormChange('color', e.target.value)}
                        className="p-1 h-10 w-16 cursor-pointer"
                      />
                    </div>
                    <div className="flex gap-2 justify-end flex-wrap">
                      {['#ef4444', '#f97316', '#eab308', '#22c55e', '#3b82f6', '#8b5cf6', '#ec4899', '#6b7280'].map(color => (
                        <button
                          key={color}
                          type="button"
                          onClick={() => onEditFormChange('color', color)}
                          className="w-6 h-6 rounded border-2 border-gray-300 hover:border-gray-500 transition-colors"
                          style={{ backgroundColor: color }}
                          title={color}
                        />
                      ))}
                    </div>
                    <div className="flex gap-2 justify-end">
                      <Button size="sm" variant="ghost" onClick={cancelEditing}>
                        <X className="w-4 h-4 mr-1" /> ביטול
                      </Button>
                      <Button size="sm" onClick={() => handleUpdateTag(editingTag)}>
                        <Save className="w-4 h-4 mr-1" /> שמור
                      </Button>
                    </div>
                  </div>
                ) : (
                  // Display View
                  <div className="flex items-center justify-between p-2 border rounded-lg">
                    <div className="flex gap-1">
                      <Button variant="ghost" size="icon" onClick={() => handleDeleteTag(tag.id)}>
                        <Trash2 className="w-4 h-4 text-red-500" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => startEditing(tag)}>
                        <Edit className="w-4 h-4" />
                      </Button>
                    </div>
                    <Badge style={{ backgroundColor: tag.color, color: tag.text_color }}>
                      {tag.name}
                    </Badge>
                  </div>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
