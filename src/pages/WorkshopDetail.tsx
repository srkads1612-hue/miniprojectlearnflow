import { useState, useEffect } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { getWorkshopById, Workshop } from '@/lib/workshopManager';
import { Calendar as CalendarIcon, Clock, Users, Video } from 'lucide-react';
import { format } from 'date-fns';

export default function WorkshopDetail() {
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const sessionId = searchParams.get('session');
  const { user } = useAuth();
  const [workshop, setWorkshop] = useState<Workshop | null>(null);

  useEffect(() => {
    if (id) {
      const ws = getWorkshopById(id);
      setWorkshop(ws || null);
    }
  }, [id]);

  if (!workshop) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">Workshop not found</p>
      </div>
    );
  }

  const currentSession = sessionId 
    ? workshop.sessions.find(s => s.id === sessionId)
    : workshop.sessions.find(s => s.isLive);

  const isEnrolled = user && workshop.enrolledStudents.includes(user.id);

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-5xl mx-auto space-y-6">
          {/* Workshop Header */}
          <div>
            <Badge className="mb-4">{workshop.category}</Badge>
            <h1 className="text-4xl font-bold mb-2">{workshop.title}</h1>
            <p className="text-xl text-muted-foreground mb-4">{workshop.description}</p>
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <span>Instructor: {workshop.instructorName}</span>
              <div className="flex items-center gap-1">
                <Users className="h-4 w-4" />
                {workshop.enrolledStudents.length}/{workshop.maxStudents} enrolled
              </div>
            </div>
          </div>

          {/* Live Video Player */}
          {currentSession?.isLive && currentSession.vimeoLiveUrl && isEnrolled && (
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center gap-2 mb-4">
                  <Badge variant="destructive" className="animate-pulse">LIVE</Badge>
                  <span className="text-sm font-medium">
                    {format(new Date(currentSession.date), 'MMMM dd, yyyy')} • {currentSession.startTime} - {currentSession.endTime}
                  </span>
                </div>
                <div className="aspect-video bg-black rounded-lg overflow-hidden">
                  <iframe
                    src={currentSession.vimeoLiveUrl}
                    className="w-full h-full"
                    frameBorder="0"
                    allow="autoplay; fullscreen; picture-in-picture"
                    allowFullScreen
                    title="Live Workshop"
                  />
                </div>
              </CardContent>
            </Card>
          )}

          {/* Not Enrolled Message */}
          {currentSession?.isLive && !isEnrolled && (
            <Card className="border-primary">
              <CardContent className="p-6 text-center">
                <Video className="h-12 w-12 mx-auto mb-4 text-primary" />
                <h3 className="text-xl font-semibold mb-2">This workshop is live now!</h3>
                <p className="text-muted-foreground">
                  Enroll in this workshop to join live sessions
                </p>
              </CardContent>
            </Card>
          )}

          {/* Session Schedule */}
          <Card>
            <CardContent className="p-6">
              <h2 className="text-2xl font-semibold mb-4">Session Schedule</h2>
              <div className="space-y-3">
                {workshop.sessions.map((session) => (
                  <div
                    key={session.id}
                    className={`p-4 rounded-lg border ${
                      session.isLive ? 'border-primary bg-primary/5' : 'border-border'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2">
                          <CalendarIcon className="h-4 w-4 text-muted-foreground" />
                          <span className="font-medium">
                            {format(new Date(session.date), 'EEEE, MMMM dd, yyyy')}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Clock className="h-4 w-4 text-muted-foreground" />
                          <span>{session.startTime} - {session.endTime}</span>
                        </div>
                      </div>
                      {session.isLive && (
                        <Badge variant="destructive">LIVE NOW</Badge>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* About Workshop */}
          <Card>
            <CardContent className="p-6">
              <h2 className="text-2xl font-semibold mb-4">About This Workshop</h2>
              <p className="text-muted-foreground leading-relaxed">
                {workshop.description}
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
