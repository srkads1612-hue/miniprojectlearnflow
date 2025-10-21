import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { GraduationCap } from 'lucide-react';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { login, user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const success = await login(email, password);
    
    if (success) {
      // Wait briefly for user state to update, then redirect based on role
      setTimeout(() => {
        const users = JSON.parse(localStorage.getItem('users') || '[]');
        const loggedInUser = users.find((u: any) => u.email === email);
        
        toast({ title: 'Welcome back!' });
        
        if (loggedInUser?.role === 'admin') {
          navigate('/admin');
        } else if (loggedInUser?.role === 'instructor') {
          navigate('/instructor/home');
        } else if (loggedInUser?.role === 'student') {
          navigate('/student/dashboard');
        } else {
          navigate('/');
        }
      }, 100);
    } else {
      toast({ 
        title: 'Login failed', 
        description: 'Invalid email or password',
        variant: 'destructive'
      });
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden">
      <div className="absolute inset-0 hero-gradient"></div>
      <div className="absolute inset-0 bg-grid-white/[0.02] bg-[size:50px_50px]"></div>
      
      <Card className="w-full max-w-md relative z-10 border-2 card-glass shadow-2xl">
        <CardHeader className="text-center space-y-4">
          <div className="flex justify-center">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl educational-gradient shadow-lg">
              <GraduationCap className="h-8 w-8 text-white" />
            </div>
          </div>
          <CardTitle className="text-3xl font-display font-bold">Welcome to LearnFlow</CardTitle>
          <CardDescription className="text-base">Sign in to continue your learning journey</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm font-medium">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="your@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="h-11 border-2"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password" className="text-sm font-medium">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="h-11 border-2"
              />
            </div>
            <Button type="submit" variant="glow" size="lg" className="w-full">
              Continue
            </Button>
          </form>
          
          <div className="mt-6 text-center text-sm">
            <span className="text-muted-foreground">Don't have an account? </span>
            <Link to="/signup" className="text-primary hover:text-primary-glow font-semibold hover:underline">
              Sign up
            </Link>
          </div>
          
          <div className="mt-6 p-4 bg-muted/50 rounded-xl text-xs text-muted-foreground border border-border/50">
            <p className="font-semibold mb-2 text-foreground">Demo Accounts:</p>
            <div className="space-y-1">
              <p><span className="font-medium">Admin:</span> admin@learnflow.com</p>
              <p><span className="font-medium">Instructor:</span> john@instructor.com</p>
              <p><span className="font-medium">Student:</span> student@example.com</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}