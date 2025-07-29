
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
      const tagsData = await Tag.list();
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
    return <div>טוען תיוגים...</div>;
  }

  return (
    <div className="grid md:grid-cols-2 gap-8">
      <Card>
        <CardHeader>
          <CardTitle>הוספת תיוג חדש</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="new-tag-name">שם התיוג</Label>
            <Input
              id="new-tag-name"
              value={newTagName}
              onChange={(e) => setNewTagName(e.target.value)}
              placeholder="למשל: חשוב"
            />
          </div>
          <div>
            <Label>צבע רקע</Label>
            <div className="flex items-center gap-4">
              <Input
                type="color"
                value={newTagColor}
                onChange={(e) => setNewTagColor(e.target.value)}
                className="p-1 h-10 w-16 cursor-pointer"
              />
              <Input
                value={newTagColor}
                onChange={(e) => setNewTagColor(e.target.value)}
                className="w-32"
              />
            </div>
          </div>
          <Button onClick={handleAddTag} className="w-full">
            <Plus className="w-4 h-4 ml-2" />
            הוסף תיוג
          </Button>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>תיוגים קיימים ({tags.length})</CardTitle>
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
                    />
                    <div className="flex items-center gap-4">
                      <Input
                        type="color"
                        value={editingTag.color}
                        onChange={(e) => onEditFormChange('color', e.target.value)}
                        className="p-1 h-10 w-16 cursor-pointer"
                      />
                      <Input
                        value={editingTag.color}
                        onChange={(e) => onEditFormChange('color', e.target.value)}
                        className="w-32"
                      />
                    </div>
                    <div className="flex gap-2">
                      <Button size="sm" onClick={() => handleUpdateTag(editingTag)}>
                        <Save className="w-4 h-4 ml-1" /> שמור
                      </Button>
                      <Button size="sm" variant="ghost" onClick={cancelEditing}>
                        <X className="w-4 h-4 ml-1" /> ביטול
                      </Button>
                    </div>
                  </div>
                ) : (
                  // Display View
                  <div className="flex items-center justify-between p-2 border rounded-lg">
                    <Badge style={{ backgroundColor: tag.color, color: tag.text_color }}>
                      {tag.name}
                    </Badge>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="icon" onClick={() => startEditing(tag)}>
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => handleDeleteTag(tag.id)}>
                        <Trash2 className="w-4 h-4 text-red-500" />
                      </Button>
                    </div>
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
