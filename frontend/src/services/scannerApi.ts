import { api } from "@/services/api";
import type { ScanResult } from "@/types/api";

export async function analyzeImage(image: Blob, filename: string, productHint: string): Promise<ScanResult> {
  const form = new FormData();
  form.append("image", image, filename);
  if (productHint && productHint.trim()) {
    form.append("product_hint", productHint.trim());
  }
  const { data } = await api.post<ScanResult>("/api/scanner/analyze", form, {
    headers: { "Content-Type": "multipart/form-data" },
    timeout: 120_000,
  });
  return data;
}