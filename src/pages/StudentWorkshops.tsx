import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { Calendar as CalendarIcon, Clock, Users, Video, CheckCircle } from 'lucide-react';
import { format } from 'date-fns';
import { getWorkshops, getEnrolledWorkshops, enrollInWorkshop, Workshop } from '@/lib/workshopManager';
export default function StudentWorkshops() {
  const {
    user
  } = useAuth();
  const navigate = useNavigate();
  const [allWorkshops, setAllWorkshops] = useState<Workshop[]>([]);
  const [enrolledWorkshops, setEnrolledWorkshops] = useState<Workshop[]>([]);
  useEffect(() => {
    if (user) {
      loadWorkshops();
    }
  }, [user]);
  const loadWorkshops = () => {
    if (user) {
      setAllWorkshops(getWorkshops());
      setEnrolledWorkshops(getEnrolledWorkshops(user.id));
    }
  };
  const handleEnroll = (workshopId: string) => {
    if (!user) return;
    const success = enrollInWorkshop(workshopId, user.id);
    if (success) {
      loadWorkshops();
      toast.success('Successfully enrolled in workshop!');
    } else {
      toast.error('Could not enroll. Workshop may be full or you are already enrolled.');
    }
  };
  const isEnrolled = (workshopId: string) => {
    return enrolledWorkshops.some(w => w.id === workshopId);
  };
  const handleJoinLive = (workshop: Workshop, sessionId: string) => {
    navigate(`/workshop/${workshop.id}?session=${sessionId}`);
  };
  const renderWorkshopCard = (workshop: Workshop) => {
    const enrolled = isEnrolled(workshop.id);
    const isFull = workshop.enrolledStudents.length >= workshop.maxStudents;
    const liveSession = workshop.sessions.find(s => s.isLive);
    return <Card key={workshop.id} className="group hover:shadow-lg transition-shadow">
        <CardHeader>
          <div className="flex justify-between items-start mb-2">
            <Badge>{workshop.category}</Badge>
            {enrolled && <Badge variant="secondary"><CheckCircle className="h-3 w-3 mr-1" />Enrolled</Badge>}
          </div>
          <CardTitle className="line-clamp-2">{workshop.title}</CardTitle>
          <CardDescription className="line-clamp-2">{workshop.description}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between text-sm">
              
              <span className="text-muted-foreground">by {workshop.instructorName}</span>
            </div>

            {liveSession && enrolled && <Button className="w-full gap-2 animate-pulse" variant="glow" onClick={() => handleJoinLive(workshop, liveSession.id)}>
                <Video className="h-4 w-4" />
                JOIN LIVE NOW
              </Button>}

            <div className="space-y-2">
              <p className="text-sm font-medium">Upcoming Sessions:</p>
              {workshop.sessions.slice(0, 3).map(session => <div key={session.id} className="flex items-center gap-2 p-2 rounded-lg bg-muted/50 text-sm">
                  <CalendarIcon className="h-4 w-4 text-muted-foreground" />
                  <span>{format(new Date(session.date), 'MMM dd, yyyy')}</span>
                  <Clock className="h-4 w-4 text-muted-foreground ml-2" />
                  <span>{session.startTime} - {session.endTime}</span>
                  {session.isLive && <Badge variant="destructive" className="ml-auto">LIVE</Badge>}
                </div>)}
            </div>

            {!enrolled && <Button className="w-full" onClick={() => handleEnroll(workshop.id)} disabled={isFull}>
                {isFull ? 'Workshop Full' : 'Enroll Now'}
              </Button>}
          </div>
        </CardContent>
      </Card>;
  };
  return <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">Workshops</h1>
          <p className="text-muted-foreground">Join live workshop sessions with expert instructors</p>
        </div>

        <Tabs defaultValue="all" className="space-y-6">
          <TabsList>
            <TabsTrigger value="all">All Workshops</TabsTrigger>
            <TabsTrigger value="enrolled">My Workshops ({enrolledWorkshops.length})</TabsTrigger>
          </TabsList>

          <TabsContent value="all" className="space-y-6">
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {allWorkshops.map(renderWorkshopCard)}
            </div>
            {allWorkshops.length === 0 && <div className="text-center py-12">
                <Video className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-xl font-semibold mb-2">No workshops available</h3>
                <p className="text-muted-foreground">Check back soon for new workshops!</p>
              </div>}
          </TabsContent>

          <TabsContent value="enrolled" className="space-y-6">
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {enrolledWorkshops.map(renderWorkshopCard)}
            </div>
            {enrolledWorkshops.length === 0 && <div className="text-center py-12">
                <Video className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-xl font-semibold mb-2">No enrolled workshops</h3>
                <p className="text-muted-foreground">Enroll in a workshop to get started!</p>
              </div>}
          </TabsContent>
        </Tabs>
      </div>
    </div>;
}