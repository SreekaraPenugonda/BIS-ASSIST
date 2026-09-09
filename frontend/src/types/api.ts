/** Shared contracts mirroring the FastAPI schemas. */

export type Role = "consumer" | "msme" | "admin";
export type Language = "en" | "hi" | "te";
export type ResponseMode = "ai" | "simulation";

export interface User {
  id: number;
  name: string;
  email: string;
  role: Role;
  created_at: string;
}

export interface TokenResponse {
  access_token: string;
  token_type: string;
  user: User;
}

export interface Source {
  document: string;
  page?: number | null;
  section?: string | null;
  url?: string | null;
}

export interface StandardRef {
  is_number: string;
  title: string;
  relevance: "high" | "medium" | "low";
  status: string;
}

export interface StructuredAnswer {
  answer: string;
  status: "INFO" | "PRODUCT_SPECIFIC" | "VERIFICATION_REQUIRED" | "NOT_FOUND";
  confidence: number;
  intent: string;
  language: string;
  standards: StandardRef[];
  sources: Source[];
  disclaimer: string;
  /** Client-side: whether the backend used Gemini or the deterministic engine. */
  mode?: "ai" | "simulation";
}

/** Client-side shape attached to an assistant chat message. */
export interface AnalysisMeta {
  status: StructuredAnswer["status"];
  confidence: number;
  mode: "ai" | "simulation";
  standards: StandardRef[];
  sources: Source[];
  disclaimer?: string;
  intent?: string;
}

export interface ChatResponse {
  conversation_id: number;
  user_message: string;
  response_mode: ResponseMode;
  language: string;
  structured: StructuredAnswer;
  created_at: string;
}

export interface StreamEvent {
  type: "token" | "meta" | "done" | "error" | "close";
  content?: string | null;
  meta?: StructuredAnswer | null;
}

export interface StandardListItem {
  is_number: string;
  title: string;
  product_category: string;
  status: string;
  is_mandatory: boolean;
  published_date: string;
  description: string;
  scope: string;
  requirements: string[];
}

export interface StandardListResponse {
  items: StandardListItem[];
  total: number;
  page: number;
  size: number;
  categories: string[];
}

export interface RecommendRequest {
  product_name: string;
  category?: string;
  description?: string;
}

export interface RecommendedStandard {
  is_number: string;
  title: string;
  relevance: "high" | "medium" | "low";
  status: string;
  scope: string;
}

export interface RecommendResponse {
  product: string;
  category: string;
  standards: RecommendedStandard[];
  disclaimer: string;
}

export interface ScanResult {
  status: string;
  confidence: number;
  verified: boolean;
  mode: ResponseMode;
  message: string;
  product: { name: string; category: string; brand?: string | null; model?: string | null };
  is_mark: { detected: boolean; text?: string | null };
  license_number?: string | null;
  standard?: StandardRef | null;
  sources: Source[];
  disclaimer: string;
}

export interface ApplicationRecord {
  id: number;
  application_number: string;
  user_id: number;
  user_name?: string;
  product_name: string;
  category: string;
  is_number: string;
  standard_title: string;
  status: string;
  notes: string;
  submitted_at: string;
  updated_at: string;
}

export interface AdminStats {
  counts: {
    users: number;
    standards: number;
    documents: number;
    chunks: number;
    applications: number;
  };
  applications_by_status: Record<string, number>;
  activity: {
    queries_today: number;
    queries_total: number;
    scans_today: number;
    scans_total: number;
    applications: number;
    logins: number;
    started_at: string;
    recent_queries: { ts: string; message: string; mode: string; intent: string; status: string }[];
    recent_scans: { ts: string; filename: string; mode: string; status: string }[];
  };
  rag: { entries: number; uses_gemini: boolean; configured: boolean };
  system: { environment: string; database: string; gemini_model: string };
}

export interface HealthResponse {
  status: string;
  version: string;
  environment: string;
  uptime_seconds: number;
  services: { database: string; ai_engine: string; rag: string };
  counts: { users: number; standards: number; documents: number; chunks: number };
}