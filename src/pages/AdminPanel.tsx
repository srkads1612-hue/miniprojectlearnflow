import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { InstructorApplication, Course, User, mockUsers } from '@/lib/mockData';
import { Check, X, Trash2 } from 'lucide-react';

export default function AdminPanel() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [applications, setApplications] = useState<InstructorApplication[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [users, setUsers] = useState<User[]>([]);

  useEffect(() => {
    if (!user || user.role !== 'admin') {
      navigate('/');
      return;
    }

    const savedApplications = JSON.parse(localStorage.getItem('instructorApplications') || '[]');
    setApplications(savedApplications);

    const savedCourses = JSON.parse(localStorage.getItem('courses') || '[]');
    setCourses(savedCourses);

    const savedUsers = JSON.parse(localStorage.getItem('users') || JSON.stringify(mockUsers));
    setUsers(savedUsers);
  }, [user, navigate]);

  const handleApproveApplication = (appId: string) => {
    const app = applications.find(a => a.id === appId);
    if (!app) return;

    // Update application status
    const updatedApps = applications.map(a =>
      a.id === appId ? { ...a, status: 'approved' as const } : a
    );
    setApplications(updatedApps);
    localStorage.setItem('instructorApplications', JSON.stringify(updatedApps));

    // Update user role
    const updatedUsers = users.map(u =>
      u.id === app.userId
        ? { ...u, role: 'instructor' as const, isApproved: true }
        : u
    );
    setUsers(updatedUsers);
    localStorage.setItem('users', JSON.stringify(updatedUsers));

    toast({ title: 'Application approved!' });
  };

  const handleRejectApplication = (appId: string) => {
    const updatedApps = applications.map(a =>
      a.id === appId ? { ...a, status: 'rejected' as const } : a
    );
    setApplications(updatedApps);
    localStorage.setItem('instructorApplications', JSON.stringify(updatedApps));
    toast({ title: 'Application rejected' });
  };

  const handleDeleteCourse = (courseId: string) => {
    const updated = courses.filter(c => c.id !== courseId);
    setCourses(updated);
    localStorage.setItem('courses', JSON.stringify(updated));
    toast({ title: 'Course deleted' });
  };

  const handleDeleteUser = (userId: string) => {
    const updated = users.filter(u => u.id !== userId);
    setUsers(updated);
    localStorage.setItem('users', JSON.stringify(updated));
    toast({ title: 'User deleted' });
  };

  if (!user || user.role !== 'admin') {
    return null;
  }

  const pendingApplications = applications.filter(a => a.status === 'pending');

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-4xl font-bold mb-8">Admin Panel</h1>

      <Tabs defaultValue="applications" className="space-y-6">
        <TabsList>
          <TabsTrigger value="applications">
            Instructor Applications
            {pendingApplications.length > 0 && (
              <span className="ml-2 bg-primary text-primary-foreground rounded-full px-2 py-0.5 text-xs">
                {pendingApplications.length}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value="courses">Courses</TabsTrigger>
          <TabsTrigger value="users">Users</TabsTrigger>
        </TabsList>

        <TabsContent value="applications">
          <Card>
            <CardHeader>
              <CardTitle>Instructor Applications</CardTitle>
              <CardDescription>Review and approve instructor applications</CardDescription>
            </CardHeader>
            <CardContent>
              {applications.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">No instructor applications yet.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {applications.map(app => {
                    const applicant = users.find(u => u.id === app.userId);
                    return (
                      <Card key={app.id}>
                        <CardHeader>
                          <div className="flex items-center justify-between">
                            <div>
                              <CardTitle className="text-lg">{applicant?.name}</CardTitle>
                              <CardDescription>{applicant?.email}</CardDescription>
                            </div>
                            <div className="flex items-center gap-2">
                              <span
                                className={`px-3 py-1 rounded-full text-xs font-medium ${
                                  app.status === 'approved'
                                    ? 'bg-green-100 text-green-800'
                                    : app.status === 'rejected'
                                    ? 'bg-red-100 text-red-800'
                                    : 'bg-yellow-100 text-yellow-800'
                                }`}
                              >
                                {app.status}
                              </span>
                              {app.status === 'pending' && (
                                <div className="flex gap-2">
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => handleApproveApplication(app.id)}
                                  >
                                    <Check className="h-4 w-4 mr-1" />
                                    Approve
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="destructive"
                                    onClick={() => handleRejectApplication(app.id)}
                                  >
                                    <X className="h-4 w-4 mr-1" />
                                    Reject
                                  </Button>
                                </div>
                              )}
                            </div>
                          </div>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          <div>
                            <h4 className="font-semibold text-sm mb-1">Why they want to teach:</h4>
                            <p className="text-sm text-muted-foreground">{app.reason}</p>
                          </div>
                          
                          <div>
                            <h4 className="font-semibold text-sm mb-1">Teaching Experience:</h4>
                            <p className="text-sm text-muted-foreground">{app.experience}</p>
                          </div>

                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <h4 className="font-semibold text-sm mb-1">Area of Expertise:</h4>
                              <p className="text-sm text-muted-foreground">{app.expertise}</p>
                            </div>
                            <div>
                              <h4 className="font-semibold text-sm mb-1">Submitted:</h4>
                              <p className="text-sm text-muted-foreground">
                                {new Date(app.createdAt).toLocaleDateString()}
                              </p>
                            </div>
                          </div>

                          <div>
                            <h4 className="font-semibold text-sm mb-1">Qualifications:</h4>
                            <p className="text-sm text-muted-foreground">{app.qualifications}</p>
                          </div>

                          <div>
                            <h4 className="font-semibold text-sm mb-1">First Course Idea:</h4>
                            <p className="text-sm text-muted-foreground">{app.courseIdea}</p>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="courses">
          <Card>
            <CardHeader>
              <CardTitle>All Courses</CardTitle>
              <CardDescription>Manage all courses on the platform</CardDescription>
            </CardHeader>
            <CardContent>
              {courses.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">No courses available yet.</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Title</TableHead>
                      <TableHead>Instructor</TableHead>
                      <TableHead>Students</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {courses.map(course => {
                      const instructor = users.find(u => u.id === course.instructorId);
                      return (
                        <TableRow key={course.id}>
                          <TableCell className="font-medium">{course.title}</TableCell>
                          <TableCell>{instructor?.name}</TableCell>
                          <TableCell>{course.enrolledStudents.length}</TableCell>
                          <TableCell>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => handleDeleteCourse(course.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="users">
          <Card>
            <CardHeader>
              <CardTitle>All Users</CardTitle>
              <CardDescription>Manage platform users</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.map(u => (
                    <TableRow key={u.id}>
                      <TableCell className="font-medium">{u.name}</TableCell>
                      <TableCell>{u.email}</TableCell>
                      <TableCell>
                        <span className="capitalize px-2 py-1 bg-primary/10 text-primary rounded text-xs">
                          {u.role}
                        </span>
                      </TableCell>
                      <TableCell>
                        {u.id !== user.id && (
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => handleDeleteUser(u.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}