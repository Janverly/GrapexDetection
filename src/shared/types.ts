import z from "zod";

export const ScanSchema = z.object({
  id: z.number(),
  user_id: z.string(),
  image_url: z.string(),
  disease_detected: z.string().nullable(),
  confidence_score: z.number().nullable(),
  recommendations: z.string().nullable(),
  location_lat: z.number().nullable(),
  location_lng: z.number().nullable(),
  created_at: z.string(),
  updated_at: z.string(),
});

export const DiseaseSchema = z.object({
  id: z.number(),
  name: z.string(),
  description: z.string().nullable(),
  symptoms: z.string().nullable(),
  treatment: z.string().nullable(),
  prevention: z.string().nullable(),
  severity_level: z.string().nullable(),
  created_at: z.string(),
  updated_at: z.string(),
});

export const CreateScanSchema = z.object({
  image_url: z.string(),
  disease_detected: z.string().optional(),
  confidence_score: z.number().optional(),
  recommendations: z.string().optional(),
  location_lat: z.number().optional(),
  location_lng: z.number().optional(),
});

export type ScanType = z.infer<typeof ScanSchema>;
export type DiseaseType = z.infer<typeof DiseaseSchema>;
export type CreateScanType = z.infer<typeof CreateScanSchema>;

export interface PredictionResult {
  disease: string;
  confidence: number;
  recommendations: string;
}

export interface AdminStats {
  totalUsers: number;
  totalScans: number;
  recentScans: ScanType[];
  diseaseDistribution: { [key: string]: number };
}

export interface UserStats {
  user_id: string;
  total_scans: number;
  disease_scans: number;
  first_scan: string;
  last_scan: string;
}

export const CreateReportSchema = z.object({
  type: z.enum(["disease_outbreak", "false_detection", "app_issue", "general"]),
  title: z.string().min(1),
  description: z.string().min(1),
  scan_id: z.number().optional(),
  location_lat: z.number().optional(),
  location_lng: z.number().optional(),
  severity: z.enum(["low", "medium", "high", "critical"]),
});

export const ReportSchema = z.object({
  id: z.number(),
  user_id: z.string(),
  type: z.string(),
  title: z.string(),
  description: z.string(),
  scan_id: z.number().nullable(),
  location_lat: z.number().nullable(),
  location_lng: z.number().nullable(),
  severity: z.string(),
  status: z.string(),
  created_at: z.string(),
  updated_at: z.string(),
});

export type CreateReportType = z.infer<typeof CreateReportSchema>;
export type ReportType = z.infer<typeof ReportSchema>;
