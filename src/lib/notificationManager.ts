export interface Notification {
  id: string;
  userId: string;
  courseId: string;
  courseTitle: string;
  type: 'course_update' | 'course_created' | 'enrollment';
  message: string;
  createdAt: string;
  read: boolean;
}

export const createNotification = (
  userId: string,
  courseId: string,
  courseTitle: string,
  type: Notification['type'],
  message: string
) => {
  const notification: Notification = {
    id: `notif-${Date.now()}-${Math.random()}`,
    userId,
    courseId,
    courseTitle,
    type,
    message,
    createdAt: new Date().toISOString(),
    read: false,
  };

  const notifications = getNotifications();
  notifications.push(notification);
  localStorage.setItem('notifications', JSON.stringify(notifications));
  return notification;
};

export const getNotifications = (): Notification[] => {
  const stored = localStorage.getItem('notifications');
  return stored ? JSON.parse(stored) : [];
};

export const getUserNotifications = (userId: string): Notification[] => {
  return getNotifications()
    .filter(n => n.userId === userId)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
};

export const markAsRead = (notificationId: string) => {
  const notifications = getNotifications();
  const updated = notifications.map(n =>
    n.id === notificationId ? { ...n, read: true } : n
  );
  localStorage.setItem('notifications', JSON.stringify(updated));
};

export const markAllAsRead = (userId: string) => {
  const notifications = getNotifications();
  const updated = notifications.map(n =>
    n.userId === userId ? { ...n, read: true } : n
  );
  localStorage.setItem('notifications', JSON.stringify(updated));
};

export const getUnreadCount = (userId: string): number => {
  return getNotifications().filter(n => n.userId === userId && !n.read).length;
};

export const notifyEnrolledStudents = (courseId: string, courseTitle: string, message: string) => {
  const courses = JSON.parse(localStorage.getItem('courses') || '[]');
  const course = courses.find((c: any) => c.id === courseId);
  
  if (course && course.enrolledStudents) {
    course.enrolledStudents.forEach((studentId: string) => {
      createNotification(studentId, courseId, courseTitle, 'course_update', message);
    });
  }
};
