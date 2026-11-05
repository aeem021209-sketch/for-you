
export type Profile = {
  id: string;
  full_name: string | null;
  role: "director" | "finance" | "admin";
  created_at?: string;
};
