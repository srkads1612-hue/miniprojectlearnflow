import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { mockCourses, mockUsers, Course, Comment } from '@/lib/mockData';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { BookOpen, Clock, User as UserIcon, CheckCircle2, Circle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { getAvatarColor } from '@/lib/avatarColors';
import { initializeCourseProgress, getCourseProgress, updateLessonProgress, updateVideoProgress } from '@/lib/progressManager';
import { createNotification } from '@/lib/notificationManager';

export default function CourseDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [course, setCourse] = useState<Course | null>(null);
  const [currentLesson, setCurrentLesson] = useState(0);
  const [isEnrolled, setIsEnrolled] = useState(false);
  const [comment, setComment] = useState('');
  const [comments, setComments] = useState<Comment[]>([]);
  const [showNewLessonBanner, setShowNewLessonBanner] = useState(false);
  const [lessonProgress, setLessonProgress] = useState<{ [key: string]: boolean }>({});
  const sessionStartRef = useRef<number>(Date.now());
  const lastLessonRef = useRef<number>(currentLesson);

  // Track session time for accurate progress
  useEffect(() => {
    if (!user || !course || !isEnrolled) return;

    const startTime = Date.now();
    sessionStartRef.current = startTime;

    // Update time spent every 30 seconds
    const interval = setInterval(() => {
      const timeSpent = Math.floor((Date.now() - sessionStartRef.current) / 1000);
      if (timeSpent >= 30) {
        const currentLessonId = course.lessons[currentLesson]?.id;
        if (currentLessonId) {
          updateVideoProgress(user.id, course.id, currentLessonId, timeSpent, 0);
          sessionStartRef.current = Date.now();
        }
      }
    }, 30000);

    return () => {
      clearInterval(interval);
      // Save any remaining time when component unmounts
      const finalTime = Math.floor((Date.now() - sessionStartRef.current) / 1000);
      if (finalTime > 0 && course) {
        const currentLessonId = course.lessons[currentLesson]?.id;
        if (currentLessonId) {
          updateVideoProgress(user.id, course.id, currentLessonId, finalTime, 0);
        }
      }
    };
  }, [user, course, isEnrolled, currentLesson]);

  // Reset session timer when switching lessons
  useEffect(() => {
    if (lastLessonRef.current !== currentLesson) {
      sessionStartRef.current = Date.now();
      lastLessonRef.current = currentLesson;
    }
  }, [currentLesson]);

  useEffect(() => {
    const courses = JSON.parse(localStorage.getItem('courses') || JSON.stringify(mockCourses));
    const foundCourse = courses.find((c: Course) => c.id === id);
    if (foundCourse) {
      setCourse(foundCourse);
      setIsEnrolled(user ? foundCourse.enrolledStudents.includes(user.id) : false);
      
      // Load progress for enrolled students
      if (user && foundCourse.enrolledStudents.includes(user.id)) {
        const progress = getCourseProgress(user.id, foundCourse.id);
        if (progress) {
          const progressMap: { [key: string]: boolean } = {};
          progress.lessons.forEach(l => {
            progressMap[l.lessonId] = l.completed;
          });
          setLessonProgress(progressMap);
        }
      }
    }

    const savedComments = localStorage.getItem(`comments-${id}`);
    if (savedComments) {
      setComments(JSON.parse(savedComments));
    }
  }, [id, user]);

  const handleEnroll = () => {
    if (!user) {
      toast({ title: 'Please login to enroll', variant: 'destructive' });
      navigate('/login');
      return;
    }

    if (course) {
      const courses = JSON.parse(localStorage.getItem('courses') || '[]');
      const updatedCourses = courses.map((c: Course) =>
        c.id === course.id
          ? { ...c, enrolledStudents: [...c.enrolledStudents, user.id] }
          : c
      );
      localStorage.setItem('courses', JSON.stringify(updatedCourses));
      
      // Initialize progress tracking
      const lessonIds = course.lessons.map(l => l.id);
      initializeCourseProgress(user.id, course.id, lessonIds);
      
      // Create enrollment notification
      createNotification(
        user.id,
        course.id,
        course.title,
        'enrollment',
        `You've successfully enrolled in ${course.title}!`
      );
      
      setIsEnrolled(true);
      toast({ title: 'Successfully enrolled!' });
    }
  };

  const toggleLessonComplete = (lessonId: string) => {
    if (!user || !course || !isEnrolled) return;
    
    const newStatus = !lessonProgress[lessonId];
    updateLessonProgress(user.id, course.id, lessonId, newStatus, 0);
    
    setLessonProgress(prev => ({ ...prev, [lessonId]: newStatus }));
    
    toast({ 
      title: newStatus ? 'Lesson completed!' : 'Lesson marked incomplete',
      description: newStatus ? 'Keep up the great work!' : undefined
    });
  };

  const handleComment = () => {
    if (!user) {
      toast({ title: 'Please login to comment', variant: 'destructive' });
      return;
    }

    if (comment.trim() && course) {
      const newComment: Comment = {
        id: Date.now().toString(),
        courseId: course.id,
        lessonId: course.lessons[currentLesson].id,
        userId: user.id,
        content: comment,
        createdAt: new Date().toISOString(),
      };

      const updatedComments = [...comments, newComment];
      setComments(updatedComments);
      localStorage.setItem(`comments-${id}`, JSON.stringify(updatedComments));
      setComment('');
      toast({ title: 'Comment added!' });
    }
  };

  if (!course) {
    return (
      <div className="container mx-auto px-4 py-8">
        <p>Course not found</p>
      </div>
    );
  }

  const instructor = mockUsers.find(u => u.id === course.instructorId);
  const lessonComments = comments.filter(c => c.lessonId === course.lessons[currentLesson]?.id);
  const instructorColor = instructor ? getAvatarColor(instructor.name) : '';

  return (
    <div className="container mx-auto px-4 py-8">
      {showNewLessonBanner && (
        <Alert className="mb-6 bg-primary/10 border-primary">
          <AlertDescription className="text-primary font-medium">
            🎉 New Lesson Added!
          </AlertDescription>
        </Alert>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* Video Player */}
          <div className="aspect-video bg-black rounded-lg overflow-hidden relative">
            <iframe
              src={`${course.lessons[currentLesson]?.vimeoUrl.replace('vimeo.com/', 'player.vimeo.com/video/')}`}
              className="w-full h-full"
              allow="autoplay; fullscreen; picture-in-picture"
              allowFullScreen
            />
            {/* 
              For custom video players with native time tracking:
              Use the useVideoTracking hook from src/hooks/use-video-tracking.ts
              
              Example:
              const { totalWatchedTime } = useVideoTracking({
                userId: user.id,
                courseId: course.id,
                lessonId: course.lessons[currentLesson].id,
                isPlaying: videoIsPlaying,
                currentTime: videoCurrentTime,
                enabled: isEnrolled
              });
            */}
          </div>

          {/* Course Info */}
          <Card>
            <CardHeader>
              <CardTitle className="text-3xl">{course.title}</CardTitle>
              <CardDescription className="text-base">{course.description}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <span className="flex items-center gap-1">
                  <BookOpen className="h-4 w-4" />
                  {course.lessons.length} Lessons
                </span>
                <span className="flex items-center gap-1">
                  <UserIcon className="h-4 w-4" />
                  {course.enrolledStudents.length} Students
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Comments Section */}
          <Card>
            <CardHeader>
              <CardTitle>Discussion</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Textarea
                  placeholder="Share your thoughts..."
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                />
                <Button onClick={handleComment}>Post Comment</Button>
              </div>

              <div className="space-y-4 mt-6">
                {lessonComments.map(c => {
                  const commentUser = mockUsers.find(u => u.id === c.userId);
                  const commentUserColor = commentUser ? getAvatarColor(commentUser.name) : '';
                  return (
                    <div key={c.id} className="flex gap-3">
                    <Avatar style={{ backgroundColor: commentUserColor }}>
                      <AvatarFallback className="text-black dark:text-white font-semibold">
                        {commentUser?.name[0].toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-medium text-sm">{commentUser?.name}</span>
                          <span className="text-xs text-muted-foreground">
                            {new Date(c.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                        <p className="text-sm">{c.content}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          {/* Enroll Button */}
          {!isEnrolled && (
            <Button className="w-full" size="lg" onClick={handleEnroll}>
              Enroll Now
            </Button>
          )}

          {/* Lesson List */}
          <Card>
            <CardHeader>
              <CardTitle>Lessons</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {course.lessons.map((lesson, index) => (
                <div
                  key={lesson.id}
                  className={`p-3 rounded-lg transition-colors ${
                    currentLesson === index
                      ? 'bg-primary text-primary-foreground'
                      : 'hover:bg-accent'
                  }`}
                >
                  <div 
                    className="cursor-pointer"
                    onClick={() => setCurrentLesson(index)}
                  >
                    <div className="font-medium flex items-center gap-2">
                      {lessonProgress[lesson.id] ? (
                        <CheckCircle2 className="h-4 w-4 text-green-500" />
                      ) : (
                        <Circle className="h-4 w-4" />
                      )}
                      {lesson.title}
                    </div>
                    <div className="text-sm opacity-80 flex items-center gap-1 mt-1 ml-6">
                      <Clock className="h-3 w-3" />
                      {lesson.duration}
                    </div>
                  </div>
                  {isEnrolled && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="w-full mt-2"
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleLessonComplete(lesson.id);
                      }}
                    >
                      {lessonProgress[lesson.id] ? 'Mark Incomplete' : 'Mark Complete'}
                    </Button>
                  )}
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Instructor Info */}
          {instructor && (
            <Card>
              <CardHeader>
                <CardTitle>Instructor</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-3 mb-3">
                  <Avatar className="h-12 w-12" style={{ backgroundColor: instructorColor }}>
                    <AvatarFallback className="text-black dark:text-white font-semibold">
                      {instructor.name[0].toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <div className="font-semibold">{instructor.name}</div>
                    <div className="text-sm text-muted-foreground">{instructor.bio}</div>
                  </div>
                </div>
                <Button variant="outline" className="w-full" onClick={() => navigate('/profile')}>
                  View Profile
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}