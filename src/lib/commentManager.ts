export interface Comment {
  id: string;
  workshopId: string;
  userId: string;
  userName: string;
  message: string;
  createdAt: string;
}

export const createComment = (workshopId: string, userId: string, userName: string, message: string): Comment => {
  const comment: Comment = {
    id: `comment-${Date.now()}-${Math.random()}`,
    workshopId,
    userId,
    userName,
    message,
    createdAt: new Date().toISOString(),
  };

  const comments = getComments();
  comments.push(comment);
  localStorage.setItem('workshop_comments', JSON.stringify(comments));
  return comment;
};

export const getComments = (): Comment[] => {
  const stored = localStorage.getItem('workshop_comments');
  return stored ? JSON.parse(stored) : [];
};

export const getWorkshopComments = (workshopId: string): Comment[] => {
  return getComments()
    .filter(c => c.workshopId === workshopId)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
};

export const deleteComment = (commentId: string): boolean => {
  const comments = getComments();
  const filtered = comments.filter(c => c.id !== commentId);
  localStorage.setItem('workshop_comments', JSON.stringify(filtered));
  return true;
};
