import { useState, useEffect, useCallback } from "react";

const STORAGE_KEY = "threatLens_history";
const MAX_ITEMS = 50;

/**
 * useScanHistory — persists scan results in localStorage.
 *
 * Returns:
 *   history       — array of past scan results (newest first)
 *   addResult()   — saves a new result
 *   clearHistory()— wipes all history
 */
export function useScanHistory() {
  const [history, setHistory] = useState([]);

  // Load on mount
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) setHistory(JSON.parse(raw));
    } catch {
      setHistory([]);
    }
  }, []);

  const addResult = useCallback((result) => {
    setHistory((prev) => {
      const entry = {
        ...result,
        id: Date.now(),
        scanned_at: new Date().toISOString(),
      };
      const next = [entry, ...prev].slice(0, MAX_ITEMS);
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      } catch {}
      return next;
    });
  }, []);

  const clearHistory = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY);
    setHistory([]);
  }, []);

  const removeItem = useCallback((id) => {
    setHistory((prev) => {
      const next = prev.filter((r) => r.id !== id);
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      } catch {}
      return next;
    });
  }, []);

  return { history, addResult, clearHistory, removeItem };
}