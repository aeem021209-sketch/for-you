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
};
