import React, { useState, useEffect } from 'react';
import { User } from '@/api/entities';
import { Comment } from '@/api/entities';
import { PersonalMessage } from '@/api/entities';
import { createPageUrl } from '@/utils';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Send, AtSign, MessageSquare, Trash2, CheckCircle } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { he } from 'date-fns/locale';

export default function Comments({ itemId, itemType, itemName }) {
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [users, setUsers] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  const [showMentions, setShowMentions] = useState(false);
  const [mentionQuery, setMentionQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  useEffect(() => {
    const loadUsersAndMe = async () => {
      try {
        const [usersData, currentUserData] = await Promise.all([User.getAll(), User.getCurrentUser()]);
        setUsers(usersData);
        setCurrentUser(currentUserData);
      } catch (error) {
        console.error("Error loading user data for comments:", error);
      }
    };
    loadUsersAndMe();
  }, []);

  useEffect(() => {
    if (!itemId) return;

    let isMounted = true;
    const fetchComments = async () => {
      try {
        const allComments = await Comment.getAll();
        const commentsData = allComments
          .filter(comment => comment.item_id === itemId)
          .sort((a, b) => new Date(b.created_date || b.created_at) - new Date(a.created_date || a.created_at));
        if (isMounted) {
          setComments(commentsData);
        }
      } catch (error) {
        console.error("Error polling for comments:", error);
      }
    };

    setIsLoading(true);
    fetchComments().finally(() => {
      if (isMounted) setIsLoading(false);
    });

    const interval = setInterval(fetchComments, 5000);

    // Listen for localStorage changes to update comments in real-time
    const handleStorageChange = (e) => {
      if (e.key === 'comments') {
        fetchComments();
      }
    };

    window.addEventListener('storage', handleStorageChange);

    return () => {
      isMounted = false;
      clearInterval(interval);
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [itemId]);

  const handleCommentChange = (e) => {
    const text = e.target.value;
    setNewComment(text);

    const atIndex = text.lastIndexOf('@');
    if (atIndex !== -1) {
      const query = text.substring(atIndex + 1).split(' ')[0];
      if (query.match(/^[a-zA-Z0-9_א-ת]*$/)) {
        setMentionQuery(query.toLowerCase());
        setShowMentions(true);
      } else {
        setShowMentions(false);
      }
    } else {
      setShowMentions(false);
    }
  };

  const handleMentionSelect = (user) => {
    const atIndex = newComment.lastIndexOf('@');
    const textBefore = newComment.substring(0, atIndex);
    const userName = user.full_name || user.name || user.email;
    const newText = `${textBefore}@${userName} `;
    setNewComment(newText);
    setShowMentions(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!newComment.trim() || !currentUser) return;

    const mentionedUsers = users.filter(user => {
      const userName = user.full_name || user.name || user.email;
      return userName && newComment.includes(`@${userName}`);
    });
    const mentionIds = mentionedUsers.map(u => u.id);

    try {
      const senderDisplayName = currentUser.full_name || currentUser.email;

      const createdComment = await Comment.create({
        item_id: itemId,
        item_type: itemType,
        content: newComment,
        mentions: mentionIds,
        author_name: senderDisplayName,
        created_by: currentUser.email,
        created_date: new Date().toISOString()
      });

      setComments(prev => [createdComment, ...prev]);
      setNewComment('');

      // Show success message for all comments
      if (mentionedUsers.length === 0) {
        setSuccessMessage('התגובה נשלחה בהצלחה!');
        setShowSuccessMessage(true);
        setTimeout(() => setShowSuccessMessage(false), 2000);
      }

      if (mentionedUsers.length > 0) {
        const notificationPromises = mentionedUsers
          .filter(user => user.id !== currentUser.id)
          .map(user => {
            return PersonalMessage.create({
              recipient_id: user.id,
              sender_name: senderDisplayName,
              title: `תויגת ב${itemType === 'event' ? 'אירוע' : 'משימה'}`,
              content: `"${createdComment.content}"`,
              context_link: createPageUrl(itemType === 'event' ? 'Events' : 'Tasks'),
              context_text: `ב${itemType === 'event' ? 'אירוע' : 'משימת'}: ${itemName}`
            });
          });

        await Promise.all(notificationPromises);

        // Show success message for mentions (longer duration)
        if (mentionedUsers.length > 0) {
          setSuccessMessage(`התיוג נשלח ל-${mentionedUsers.length} משתמשים!`);
          setShowSuccessMessage(true);
          setTimeout(() => setShowSuccessMessage(false), 3000);
        }
      }

    } catch (error) {
      console.error("Error submitting comment or sending notifications:", error);

      // More specific error handling
      if (error.message?.includes('Comment')) {
        alert("שגיאה בשליחת התגובה. אנא נסה שוב.");
      } else if (error.message?.includes('PersonalMessage')) {
        alert("התגובה נשלחה אך ההתראות לא נשלחו.");
      } else {
        alert("שגיאה בשליחת התגובה. אנא נסה שוב.");
      }
    }
  };

  const handleDeleteComment = async (commentId, commentAuthorName) => {
    if (!confirm("האם אתה בטוח שברצונך למחוק את התגובה?")) {
      return;
    }

    try {
      await Comment.delete(commentId);
      setComments(prev => prev.filter(comment => comment.id !== commentId));
    } catch (error) {
      console.error("Error deleting comment:", error);
      alert("שגיאה במחיקת התגובה.");
    }
  };

  const canDeleteComment = (comment) => {
    if (!currentUser) return false;

    // Admin can delete any comment
    if (currentUser.role === 'admin') return true;

    // User with permission can delete any comment
    if (currentUser.permissions?.can_delete_comments) return true;

    // User can delete their own comment if they have permission
    if (currentUser.permissions?.can_delete_own_comments &&
      (comment.created_by === currentUser.email || comment.author_name === (currentUser.full_name || currentUser.name))) return true;

    return false;
  };

  const filteredUsers = users.filter(u => {
    const fullName = u.full_name || u.name || '';
    const email = u.email || '';
    const query = mentionQuery.toLowerCase();

    return fullName.toLowerCase().includes(query) ||
      email.toLowerCase().includes(query);
  });

  return (
    <div className="space-y-4 border-t pt-4">
      <h3 className="font-semibold text-right flex items-center gap-2">
        <MessageSquare className="w-5 h-5" />
        תגובות ({comments.length})
      </h3>

      <form onSubmit={handleSubmit} className="relative">
        <Textarea
          value={newComment}
          onChange={handleCommentChange}
          placeholder="כתוב תגובה... הקלד @ כדי לתייג משתמש."
          className="pr-10"
        />
        <AtSign className="absolute top-3 right-3 w-4 h-4 text-gray-400" />
        <div className="flex items-center justify-between mt-2">
          <Button type="submit" size="sm" disabled={!newComment.trim()}>
            <Send className="w-4 h-4 ml-2" />
            שלח
          </Button>

          {showSuccessMessage && (
            <div className="flex items-center gap-2 text-green-600 text-sm transition-all duration-300 ease-in-out">
              <CheckCircle className="w-4 h-4" />
              <span>{successMessage}</span>
            </div>
          )}
        </div>

        {showMentions && filteredUsers.length > 0 && (
          <div className="absolute z-10 w-full bg-white border rounded-md shadow-lg mt-1 max-h-40 overflow-y-auto">
            {filteredUsers.map(user => (
              <div
                key={user.id}
                onClick={() => handleMentionSelect(user)}
                className="p-2 hover:bg-gray-100 cursor-pointer text-sm"
              >
                <div className="font-medium">{user.full_name || user.name}</div>
                {user.email && <div className="text-xs text-gray-500">{user.email}</div>}
              </div>
            ))}
          </div>
        )}
      </form>

      <div className="space-y-3">
        {isLoading ? (
          <p>טוען תגובות...</p>
        ) : comments.length === 0 ? (
          <p className="text-sm text-gray-500 text-center py-4">אין עדיין תגובות.</p>
        ) : (
          comments.map(comment => (
            <div key={comment.id} className="bg-gray-50 p-3 rounded-lg">
              <div className="flex justify-between items-center text-xs mb-1">
                <div className="flex items-center gap-2">
                  <span className="font-bold">{comment.author_name}</span>
                  <span className="text-gray-500">
                    {formatDistanceToNow(new Date(comment.created_date), { addSuffix: true, locale: he })}
                  </span>
                </div>
                {canDeleteComment(comment) && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDeleteComment(comment.id, comment.author_name)}
                    className="h-6 w-6 p-0 text-red-500 hover:text-red-700 hover:bg-red-50"
                  >
                    <Trash2 className="w-3 h-3" />
                  </Button>
                )}
              </div>
              <p className="text-sm text-gray-800 whitespace-pre-wrap">{comment.content}</p>
            </div>
          ))
        )}
      </div>
    </div>
  );
}