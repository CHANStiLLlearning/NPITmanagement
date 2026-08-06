export const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

export const ROLES = {
  SUPER_ADMIN: 'super_admin',
  ADMIN: 'admin',
  PRINCIPAL: 'principal',
  TEACHER: 'teacher',
  STUDENT: 'student',
  PARENT: 'parent',
} as const;

export const APP_NAME = 'NPIT TECHO SEN INSTITUTE';
export const APP_NAME_KH = 'វិទ្យាស្ថានជាតិពហុបច្ចេកទេសតេជោសែន';
