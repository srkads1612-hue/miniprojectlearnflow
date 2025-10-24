export interface LessonProgress {
  lessonId: string;
  completed: boolean;
  completedAt?: string;
  timeSpent: number; // in seconds
  videoWatchTime: number; // in seconds - actual video watched
  lastWatchPosition: number; // in seconds - where user left off
  watchCount: number; // how many times watched
}

export interface CourseProgress {
  courseId: string;
  userId: string;
  enrolledAt: string;
  lastAccessedAt: string;
  totalTimeSpent: number; // in seconds
  lessons: LessonProgress[];
  completionPercentage: number;
  currentStreak: number; // consecutive days of learning
  lastActivityDate?: string;
  achievements: string[];
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
      videoWatchTime: 0,
      lastWatchPosition: 0,
      watchCount: 0,
    })),
    completionPercentage: 0,
    currentStreak: 1,
    lastActivityDate: new Date().toISOString(),
    achievements: [],
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

  // Update streak
  progress.currentStreak = updateStreak(progress);
  progress.lastAccessedAt = new Date().toISOString();
  progress.lastActivityDate = new Date().toISOString();
  progress.totalTimeSpent += additionalTime;
  progress.completionPercentage = calculateCompletionPercentage(progress.lessons);

  // Check for achievements
  progress.achievements = checkAchievements(progress);

  allProgress[progressIndex] = progress;
  localStorage.setItem('courseProgress', JSON.stringify(allProgress));
};

export const updateVideoProgress = (
  userId: string,
  courseId: string,
  lessonId: string,
  watchTime: number,
  currentPosition: number
) => {
  const allProgress = getAllProgress();
  const progressIndex = allProgress.findIndex(p => p.userId === userId && p.courseId === courseId);
  
  if (progressIndex === -1) return;

  const progress = allProgress[progressIndex];
  const lessonIndex = progress.lessons.findIndex(l => l.lessonId === lessonId);
  
  if (lessonIndex === -1) return;

  progress.lessons[lessonIndex] = {
    ...progress.lessons[lessonIndex],
    videoWatchTime: progress.lessons[lessonIndex].videoWatchTime + watchTime,
    lastWatchPosition: currentPosition,
    watchCount: progress.lessons[lessonIndex].watchCount + 1,
    timeSpent: progress.lessons[lessonIndex].timeSpent + watchTime,
  };

  progress.lastAccessedAt = new Date().toISOString();
  progress.lastActivityDate = new Date().toISOString();
  progress.totalTimeSpent += watchTime;
  progress.currentStreak = updateStreak(progress);

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

const updateStreak = (progress: CourseProgress): number => {
  if (!progress.lastActivityDate) return 1;
  
  const lastActivity = new Date(progress.lastActivityDate);
  const today = new Date();
  const diffInDays = Math.floor((today.getTime() - lastActivity.getTime()) / (1000 * 60 * 60 * 24));
  
  if (diffInDays === 0) {
    // Same day, maintain streak
    return progress.currentStreak;
  } else if (diffInDays === 1) {
    // Consecutive day, increase streak
    return progress.currentStreak + 1;
  } else {
    // Streak broken, reset to 1
    return 1;
  }
};

const checkAchievements = (progress: CourseProgress): string[] => {
  const achievements = [...progress.achievements];
  
  // First lesson completed
  if (progress.lessons.some(l => l.completed) && !achievements.includes('first_lesson')) {
    achievements.push('first_lesson');
  }
  
  // 5 lessons completed
  const completedCount = progress.lessons.filter(l => l.completed).length;
  if (completedCount >= 5 && !achievements.includes('five_lessons')) {
    achievements.push('five_lessons');
  }
  
  // Course completed
  if (progress.completionPercentage === 100 && !achievements.includes('course_complete')) {
    achievements.push('course_complete');
  }
  
  // 7 day streak
  if (progress.currentStreak >= 7 && !achievements.includes('week_streak')) {
    achievements.push('week_streak');
  }
  
  // 5 hours of learning
  if (progress.totalTimeSpent >= 18000 && !achievements.includes('five_hours')) {
    achievements.push('five_hours');
  }
  
  return achievements;
};

export const getAchievementDetails = (achievementId: string) => {
  const achievements: Record<string, { title: string; description: string; icon: string }> = {
    first_lesson: {
      title: 'First Steps',
      description: 'Completed your first lesson',
      icon: '🎯',
    },
    five_lessons: {
      title: 'Knowledge Seeker',
      description: 'Completed 5 lessons',
      icon: '📚',
    },
    course_complete: {
      title: 'Course Master',
      description: 'Completed an entire course',
      icon: '🏆',
    },
    week_streak: {
      title: 'Consistent Learner',
      description: 'Maintained a 7-day learning streak',
      icon: '🔥',
    },
    five_hours: {
      title: 'Time Invested',
      description: 'Spent 5 hours learning',
      icon: '⏰',
    },
  };
  
  return achievements[achievementId] || { title: 'Achievement', description: '', icon: '⭐' };
};
