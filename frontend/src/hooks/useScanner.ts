import { useCallback, useRef, useState } from "react";
import { getErrorMessage } from "@/services/api";
import { analyzeImage } from "@/services/scannerApi";
import { useUserMode } from "@/context/UserModeContext";
import type { ScanResult } from "@/types/api";

export type ScanStage = "idle" | "uploading" | "scanning" | "analyzing" | "done" | "error";

export interface UseScannerState {
  stage: ScanStage;
  result: ScanResult | null;
  error: string | null;
  imagePreview: string | null;
  lastFilename: string;
  run: (file: File, productHint?: string) => Promise<void>;
  reset: () => void;
}

export function useScanner(): UseScannerState {
  const { addActivity } = useUserMode();
  const [stage, setStage] = useState<ScanStage>("idle");
  const [result, setResult] = useState<ScanResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [lastFilename, setLastFilename] = useState("");

  const run = useCallback(
    async (file: File, productHint = "") => {
      setError(null);
      setResult(null);
      setLastFilename(file.name);
      const preview = URL.createObjectURL(file);
      setImagePreview(preview);
      setStage("uploading");
      try {
        setStage("scanning");
        const res = await analyzeImage(file, file.name, productHint);
        setResult(res);
        setStage("done");
        addActivity({
          title: file.name,
          detail: res.product?.name ?? "Product scan",
          kind: "scan",
          status: res.status,
        });
      } catch (err) {
        setError(getErrorMessage(err));
        setStage("error");
      }
    },
    [addActivity]
  );

  const reset = useCallback(() => {
    setStage("idle");
    setResult(null);
    setError(null);
    setImagePreview(null);
    setLastFilename("");
  }, []);

  return { stage, result, error, imagePreview, lastFilename, run, reset };
}