export interface WorkshopSession {
  id: string;
  date: string;
  startTime: string;
  endTime: string;
  vimeoLiveUrl?: string;
  isLive: boolean;
}

export interface Workshop {
  id: string;
  title: string;
  description: string;
  instructorId: string;
  instructorName: string;
  category: string;
  thumbnail: string;
  sessions: WorkshopSession[];
  enrolledStudents: string[];
  maxStudents: number;
  createdAt: string;
  status: 'upcoming' | 'ongoing' | 'completed';
}

export const createWorkshop = (workshop: Omit<Workshop, 'id' | 'createdAt' | 'enrolledStudents'>): Workshop => {
  const newWorkshop: Workshop = {
    ...workshop,
    id: `workshop-${Date.now()}`,
    createdAt: new Date().toISOString(),
    enrolledStudents: [],
  };

  const workshops = getWorkshops();
  workshops.push(newWorkshop);
  localStorage.setItem('workshops', JSON.stringify(workshops));
  
  return newWorkshop;
};

export const getWorkshops = (): Workshop[] => {
  const stored = localStorage.getItem('workshops');
  return stored ? JSON.parse(stored) : [];
};

export const getWorkshopById = (id: string): Workshop | undefined => {
  return getWorkshops().find(w => w.id === id);
};

export const getInstructorWorkshops = (instructorId: string): Workshop[] => {
  return getWorkshops().filter(w => w.instructorId === instructorId);
};

export const getEnrolledWorkshops = (studentId: string): Workshop[] => {
  return getWorkshops().filter(w => w.enrolledStudents.includes(studentId));
};

export const enrollInWorkshop = (workshopId: string, studentId: string): boolean => {
  const workshops = getWorkshops();
  const workshop = workshops.find(w => w.id === workshopId);
  
  if (!workshop) return false;
  if (workshop.enrolledStudents.includes(studentId)) return false;
  if (workshop.enrolledStudents.length >= workshop.maxStudents) return false;

  workshop.enrolledStudents.push(studentId);
  localStorage.setItem('workshops', JSON.stringify(workshops));
  return true;
};

export const updateWorkshop = (workshopId: string, updates: Partial<Workshop>): boolean => {
  const workshops = getWorkshops();
  const index = workshops.findIndex(w => w.id === workshopId);
  
  if (index === -1) return false;
  
  workshops[index] = { ...workshops[index], ...updates };
  localStorage.setItem('workshops', JSON.stringify(workshops));
  return true;
};

export const deleteWorkshop = (workshopId: string): boolean => {
  const workshops = getWorkshops();
  const filtered = workshops.filter(w => w.id !== workshopId);
  localStorage.setItem('workshops', JSON.stringify(filtered));
  return true;
};

export const updateSessionLiveStatus = (workshopId: string, sessionId: string, isLive: boolean, vimeoLiveUrl?: string): boolean => {
  const workshops = getWorkshops();
  const workshop = workshops.find(w => w.id === workshopId);
  
  if (!workshop) return false;
  
  const session = workshop.sessions.find(s => s.id === sessionId);
  if (!session) return false;
  
  session.isLive = isLive;
  if (vimeoLiveUrl) session.vimeoLiveUrl = vimeoLiveUrl;
  
  localStorage.setItem('workshops', JSON.stringify(workshops));
  return true;
};
