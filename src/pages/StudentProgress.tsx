import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { getUserProgress, formatTimeSpent, CourseProgress } from '@/lib/progressManager';
import { Course } from '@/lib/mockData';
import { BookOpen, Clock, CheckCircle2, TrendingUp, Award } from 'lucide-react';

export default function StudentProgress() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [progress, setProgress] = useState<CourseProgress[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);

  useEffect(() => {
    if (!user || user.role !== 'student') {
      navigate('/');
      return;
    }

    const userProgress = getUserProgress(user.id);
    setProgress(userProgress);

    const allCourses = JSON.parse(localStorage.getItem('courses') || '[]');
    setCourses(allCourses);
  }, [user, navigate]);

  const getCourseDetails = (courseId: string) => {
    return courses.find(c => c.id === courseId);
  };

  const totalTimeSpent = progress.reduce((acc, p) => acc + p.totalTimeSpent, 0);
  const totalLessonsCompleted = progress.reduce(
    (acc, p) => acc + p.lessons.filter(l => l.completed).length,
    0
  );
  const totalLessons = progress.reduce((acc, p) => acc + p.lessons.length, 0);
  const averageCompletion = progress.length > 0
    ? Math.round(progress.reduce((acc, p) => acc + p.completionPercentage, 0) / progress.length)
    : 0;

  const inProgressCourses = progress.filter(p => p.completionPercentage > 0 && p.completionPercentage < 100);
  const completedCourses = progress.filter(p => p.completionPercentage === 100);
  const notStartedCourses = progress.filter(p => p.completionPercentage === 0);

  const renderCourseCard = (courseProgress: CourseProgress) => {
    const course = getCourseDetails(courseProgress.courseId);
    if (!course) return null;

    const completedLessons = courseProgress.lessons.filter(l => l.completed).length;

    return (
      <Card key={courseProgress.courseId} className="hover:shadow-lg transition-shadow">
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="space-y-1 flex-1">
              <CardTitle className="text-lg">{course.title}</CardTitle>
              <CardDescription>{course.category}</CardDescription>
            </div>
            <Badge variant={courseProgress.completionPercentage === 100 ? "default" : "secondary"}>
              {courseProgress.completionPercentage}%
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <Progress value={courseProgress.completionPercentage} className="h-2" />
          
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
              <span className="text-muted-foreground">
                {completedLessons}/{courseProgress.lessons.length} lessons
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <span className="text-muted-foreground">
                {formatTimeSpent(courseProgress.totalTimeSpent)}
              </span>
            </div>
          </div>

          <Button 
            onClick={() => navigate(`/course/${course.id}`)}
            className="w-full"
            variant={courseProgress.completionPercentage === 100 ? "outline" : "default"}
          >
            {courseProgress.completionPercentage === 100 ? 'Review Course' : 'Continue Learning'}
          </Button>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2">My Progress</h1>
        <p className="text-muted-foreground">Track your learning journey</p>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Time</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatTimeSpent(totalTimeSpent)}</div>
            <p className="text-xs text-muted-foreground">Learning time</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completed Lessons</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalLessonsCompleted}</div>
            <p className="text-xs text-muted-foreground">Out of {totalLessons} total</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Courses Enrolled</CardTitle>
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{progress.length}</div>
            <p className="text-xs text-muted-foreground">{completedCourses.length} completed</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg. Completion</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{averageCompletion}%</div>
            <p className="text-xs text-muted-foreground">Across all courses</p>
          </CardContent>
        </Card>
      </div>

      {/* Course Progress Tabs */}
      <Tabs defaultValue="in-progress" className="space-y-6">
        <TabsList>
          <TabsTrigger value="in-progress">
            In Progress ({inProgressCourses.length})
          </TabsTrigger>
          <TabsTrigger value="completed">
            Completed ({completedCourses.length})
          </TabsTrigger>
          <TabsTrigger value="not-started">
            Not Started ({notStartedCourses.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="in-progress" className="space-y-4">
          {inProgressCourses.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center text-muted-foreground">
                <BookOpen className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p>No courses in progress</p>
                <Button 
                  variant="outline" 
                  className="mt-4"
                  onClick={() => navigate('/courses')}
                >
                  Browse Courses
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {inProgressCourses.map(renderCourseCard)}
            </div>
          )}
        </TabsContent>

        <TabsContent value="completed" className="space-y-4">
          {completedCourses.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center text-muted-foreground">
                <Award className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p>No completed courses yet</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {completedCourses.map(renderCourseCard)}
            </div>
          )}
        </TabsContent>

        <TabsContent value="not-started" className="space-y-4">
          {notStartedCourses.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center text-muted-foreground">
                <CheckCircle2 className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p>You've started all your enrolled courses!</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {notStartedCourses.map(renderCourseCard)}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
