
export type Profile = {
  id: string;
  full_name: string | null;
  role: "director" | "finance" | "admin";
  created_at?: string;
};

export type Student = {
  id: string;
  student_code: string;
  full_name: string;
  classroom: string;
  grade_level: string;
  academic_year: string;
  registered: boolean;
};
