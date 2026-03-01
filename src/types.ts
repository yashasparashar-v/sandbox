export type Role = 'student' | 'teacher';

export interface User {
  id: number;
  email: string;
  role: Role;
  name: string;
  branch?: string;
  semester?: number;
  section?: string;
  bio?: string;
  profile_pic?: string;
  interests?: string;
}

export interface Post {
  id: number;
  user_id: number;
  content: string;
  type: 'social' | 'academic';
  subject_id?: number;
  created_at: string;
  name: string;
  branch: string;
  semester: number;
  profile_pic?: string;
}

export interface Subject {
  id: number;
  name: string;
  branch: string;
  semester: number;
}

export interface Resource {
  id: number;
  title: string;
  description: string;
  file_url: string;
  file_type: string;
  subject_id: number;
  semester: number;
  uploaded_by: number;
  uploader_name: string;
  created_at: string;
}

export interface Message {
  id: number;
  sender_id: number;
  receiver_id: number;
  content: string;
  created_at: string;
}

export interface StudyGroup {
  id: number;
  name: string;
  description: string;
  subject_id?: number;
  subject_name?: string;
  branch: string;
  created_by: number;
  creator_name: string;
  created_at: string;
  member_count: number;
}
