export type Role = "director" | "finance" | "admin";

export type Profile = {
  id: string;
  full_name: string;
  role: Role;
  active: boolean;
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

export type Receipt = {
  id: string;
  receipt_no: string;
  student_id: string | null;
  payer_name: string;
  description: string;
  amount: number;
  receipt_date: string;
  receipt_type: "normal" | "independent";
  locked: boolean;
  created_at: string;
};
