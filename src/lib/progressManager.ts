export interface LessonProgress {
  lessonId: string;
  completed: boolean;
  completedAt?: string;
  timeSpent: number; // in seconds
}

export interface CourseProgress {
  courseId: string;
  userId: string;
  enrolledAt: string;
  lastAccessedAt: string;
  totalTimeSpent: number; // in seconds
  lessons: LessonProgress[];
  completionPercentage: number;
}

export const initializeCourseProgress = (userId: string, courseId: string, lessonIds: string[]): CourseProgress => {
  const progress: CourseProgress = {
    courseId,
    userId,
    enrolledAt: new Date().toISOString(),
    lastAccessedAt: new Date().toISOString(),
    totalTimeSpent: 0,
    lessons: lessonIds.map(id => ({
      lessonId: id,
      completed: false,
      timeSpent: 0,
    })),
    completionPercentage: 0,
  };

  const allProgress = getAllProgress();
  allProgress.push(progress);
  localStorage.setItem('courseProgress', JSON.stringify(allProgress));
  return progress;
};

export const getAllProgress = (): CourseProgress[] => {
  const stored = localStorage.getItem('courseProgress');
  return stored ? JSON.parse(stored) : [];
};

export const getCourseProgress = (userId: string, courseId: string): CourseProgress | null => {
  const allProgress = getAllProgress();
  return allProgress.find(p => p.userId === userId && p.courseId === courseId) || null;
};

export const getUserProgress = (userId: string): CourseProgress[] => {
  return getAllProgress().filter(p => p.userId === userId);
};

export const updateLessonProgress = (
  userId: string,
  courseId: string,
  lessonId: string,
  completed: boolean,
  additionalTime: number = 0
) => {
  const allProgress = getAllProgress();
  const progressIndex = allProgress.findIndex(p => p.userId === userId && p.courseId === courseId);
  
  if (progressIndex === -1) return;

  const progress = allProgress[progressIndex];
  const lessonIndex = progress.lessons.findIndex(l => l.lessonId === lessonId);
  
  if (lessonIndex === -1) return;

  progress.lessons[lessonIndex] = {
    ...progress.lessons[lessonIndex],
    completed,
    completedAt: completed ? new Date().toISOString() : progress.lessons[lessonIndex].completedAt,
    timeSpent: progress.lessons[lessonIndex].timeSpent + additionalTime,
  };

  progress.lastAccessedAt = new Date().toISOString();
  progress.totalTimeSpent += additionalTime;
  progress.completionPercentage = calculateCompletionPercentage(progress.lessons);

  allProgress[progressIndex] = progress;
  localStorage.setItem('courseProgress', JSON.stringify(allProgress));
};

export const calculateCompletionPercentage = (lessons: LessonProgress[]): number => {
  if (lessons.length === 0) return 0;
  const completed = lessons.filter(l => l.completed).length;
  return Math.round((completed / lessons.length) * 100);
};

export const formatTimeSpent = (seconds: number): string => {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  
  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  }
  return `${minutes}m`;
};
