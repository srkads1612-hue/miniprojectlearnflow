export interface Notification {
  id: string;
  userId: string;
  itemId: string; // courseId or workshopId
  itemTitle: string; // course or workshop title
  itemType: 'course' | 'workshop';
  type: 'course_update' | 'course_created' | 'enrollment' | 'workshop_live' | 'workshop_update' | 'certificate_issued';
  message: string;
  createdAt: string;
  read: boolean;
}

export const createNotification = (
  userId: string,
  itemId: string,
  itemTitle: string,
  itemType: 'course' | 'workshop',
  type: Notification['type'],
  message: string
) => {
  const notification: Notification = {
    id: `notif-${Date.now()}-${Math.random()}`,
    userId,
    itemId,
    itemTitle,
    itemType,
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
      createNotification(studentId, courseId, courseTitle, 'course', 'course_update', message);
    });
  }
};

export const notifyEnrolledWorkshopStudents = (workshopId: string, workshopTitle: string, type: Notification['type'], message: string) => {
  const workshops = JSON.parse(localStorage.getItem('workshops') || '[]');
  const workshop = workshops.find((w: any) => w.id === workshopId);
  
  if (workshop && workshop.enrolledStudents) {
    workshop.enrolledStudents.forEach((studentId: string) => {
      createNotification(studentId, workshopId, workshopTitle, 'workshop', type, message);
    });
  }
};
