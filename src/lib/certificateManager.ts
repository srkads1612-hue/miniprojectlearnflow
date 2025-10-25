export interface Certificate {
  id: string;
  workshopId: string;
  workshopTitle: string;
  studentId: string;
  studentName: string;
  instructorId: string;
  instructorName: string;
  issuedAt: string;
}

export const issueCertificates = (workshopId: string, workshopTitle: string, instructorId: string, instructorName: string, studentIds: string[]): Certificate[] => {
  const certificates = getCertificates();
  const newCertificates: Certificate[] = [];
  
  // Get student names from users
  const users = JSON.parse(localStorage.getItem('users') || '[]');
  
  studentIds.forEach(studentId => {
    // Check if certificate already exists
    const existingCert = certificates.find(
      c => c.workshopId === workshopId && c.studentId === studentId
    );
    
    if (!existingCert) {
      const student = users.find((u: any) => u.id === studentId);
      const certificate: Certificate = {
        id: `cert-${Date.now()}-${Math.random()}`,
        workshopId,
        workshopTitle,
        studentId,
        studentName: student?.name || 'Student',
        instructorId,
        instructorName,
        issuedAt: new Date().toISOString(),
      };
      
      certificates.push(certificate);
      newCertificates.push(certificate);
    }
  });
  
  localStorage.setItem('certificates', JSON.stringify(certificates));
  return newCertificates;
};

export const getCertificates = (): Certificate[] => {
  const stored = localStorage.getItem('certificates');
  return stored ? JSON.parse(stored) : [];
};

export const getStudentCertificates = (studentId: string): Certificate[] => {
  return getCertificates()
    .filter(c => c.studentId === studentId)
    .sort((a, b) => new Date(b.issuedAt).getTime() - new Date(a.issuedAt).getTime());
};

export const getWorkshopCertificate = (workshopId: string, studentId: string): Certificate | undefined => {
  return getCertificates().find(c => c.workshopId === workshopId && c.studentId === studentId);
};

export const hasCertificate = (workshopId: string, studentId: string): boolean => {
  return !!getWorkshopCertificate(workshopId, studentId);
};
