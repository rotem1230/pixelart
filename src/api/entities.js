import { base44 } from './base44Client';


export const Event = base44.entities.Event;

export const Task = base44.entities.Task;

export const WorkHours = base44.entities.WorkHours;

export const Chat = base44.entities.Chat;

export const Canvas = base44.entities.Canvas;

export const PersonalMessage = base44.entities.PersonalMessage;

export const Tag = base44.entities.Tag;

export const Client = base44.entities.Client;

export const SeasonalClient = base44.entities.SeasonalClient;

export const Comment = base44.entities.Comment;



// User entity with both auth and CRUD operations
export const User = {
  ...base44.auth,
  ...base44.entities.User
};