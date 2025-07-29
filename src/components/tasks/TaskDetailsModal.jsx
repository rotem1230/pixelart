import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";
import { X, Trash2, CheckSquare } from 'lucide-react';
import { Task } from '@/api/entities';

export default function TaskDetailsModal({ task, onClose, onUpdate }) {
  const [currentTask, setCurrentTask] = useState(task);
  const [newChecklistItem, setNewChecklistItem] = useState('');

  useEffect(() => {
    setCurrentTask(task);
  }, [task]);

  const updateTaskInBackend = async (updatedData) => {
    try {
      const updated = await Task.update(updatedData.id, { checklist: updatedData.checklist });
      setCurrentTask(updated);
      onUpdate(updated);
    } catch (error) {
      console.error("Failed to update task:", error);
      // Optionally, revert state or show an error to the user
    }
  };

  const handleChecklistItemToggle = (index) => {
    const updatedChecklist = [...currentTask.checklist];
    updatedChecklist[index].completed = !updatedChecklist[index].completed;
    const updatedTask = { ...currentTask, checklist: updatedChecklist };
    setCurrentTask(updatedTask); // Optimistic update
    updateTaskInBackend(updatedTask);
  };

  const addChecklistItem = () => {
    if (newChecklistItem.trim() !== '') {
      const newItem = { item: newChecklistItem.trim(), completed: false };
      const updatedChecklist = [...currentTask.checklist, newItem];
      const updatedTask = { ...currentTask, checklist: updatedChecklist };
      setNewChecklistItem('');
      setCurrentTask(updatedTask); // Optimistic update
      updateTaskInBackend(updatedTask);
    }
  };

  const handleChecklistKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addChecklistItem();
    }
  };

  const removeChecklistItem = (index) => {
    const updatedChecklist = currentTask.checklist.filter((_, i) => i !== index);
    const updatedTask = { ...currentTask, checklist: updatedChecklist };
    setCurrentTask(updatedTask); // Optimistic update
    updateTaskInBackend(updatedTask);
  };
  
  const completedCount = currentTask.checklist.filter(item => item.completed).length;
  const totalCount = currentTask.checklist.length;
  const progress = totalCount > 0 ? (completedCount / totalCount) * 100 : 0;

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50" onClick={onClose}>
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="p-6">
          <div className="flex justify-between items-start mb-4">
            <h2 className="text-2xl font-bold">{currentTask.description}</h2>
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="w-5 h-5" />
            </Button>
          </div>

          <div className="space-y-6">
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <h3 className="font-semibold flex items-center gap-2"><CheckSquare className="w-5 h-5" /> צ'קליסט</h3>
              </div>
              
              {totalCount > 0 && (
                <div className="flex items-center gap-2">
                  <span className="text-xs">{Math.round(progress)}%</span>
                  <Progress value={progress} className="w-full h-2" />
                </div>
              )}

              <div className="space-y-2">
                {currentTask.checklist.map((item, index) => (
                  <div key={index} className="flex items-center gap-2 group hover:bg-gray-50 p-1 rounded-md">
                    <Checkbox
                      id={`checklist-${index}`}
                      checked={item.completed}
                      onCheckedChange={() => handleChecklistItemToggle(index)}
                    />
                    <label
                      htmlFor={`checklist-${index}`}
                      className={`flex-grow text-sm ${item.completed ? 'line-through text-gray-500' : ''}`}
                    >
                      {item.item}
                    </label>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      onClick={() => removeChecklistItem(index)} 
                      className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <Trash2 className="w-4 h-4 text-red-500" />
                    </Button>
                  </div>
                ))}
              </div>

              <div className="flex items-center gap-2">
                <Input
                  value={newChecklistItem}
                  onChange={(e) => setNewChecklistItem(e.target.value)}
                  onKeyDown={handleChecklistKeyDown}
                  placeholder="הוסף פריט חדש..."
                />
                <Button onClick={addChecklistItem}>הוסף</Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}