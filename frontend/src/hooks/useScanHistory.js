import { useState, useEffect, useCallback } from "react";
import { db } from "../firebase";
import {
  collection,
  addDoc,
  getDocs,
  deleteDoc,
  doc,
  query,
  orderBy,
  limit,
  serverTimestamp,
} from "firebase/firestore";

const MAX_ITEMS = 50;

/**
 * useScanHistory — stores scan results in Firestore under each user's UID.
 * History is private per user and syncs across all devices.
 *
 * Firestore path: users/{uid}/scans/{scanId}
 */
export function useScanHistory(user) {
  const [history, setHistory]   = useState([]);
  const [loading, setLoading]   = useState(false);

  // ── Collection ref helper ────────────────────────────────────────────────
  const scansRef = useCallback(() => {
    if (!user?.uid) return null;
    return collection(db, "users", user.uid, "scans");
  }, [user]);

  // ── Load history when user changes ───────────────────────────────────────
  useEffect(() => {
    if (!user?.uid) {
      setHistory([]);
      return;
    }

    const fetchHistory = async () => {
      setLoading(true);
      try {
        const ref = scansRef();
        const q   = query(ref, orderBy("scanned_at", "desc"), limit(MAX_ITEMS));
        const snap = await getDocs(q);
        const items = snap.docs.map(d => ({
          id: d.id,
          ...d.data(),
          // Convert Firestore Timestamp → ISO string for display
          scanned_at: d.data().scanned_at?.toDate?.()?.toISOString() ?? new Date().toISOString(),
        }));
        setHistory(items);
      } catch (e) {
        console.error("Failed to load scan history:", e);
      }
      setLoading(false);
    };

    fetchHistory();
  }, [user, scansRef]);

  // ── Add a new scan result ─────────────────────────────────────────────────
  const addResult = useCallback(async (result) => {
    if (!user?.uid) return;
    try {
      const ref  = scansRef();
      const entry = {
        analysis_type:   result.analysis_type  ?? "",
        input:           result.input           ?? "",
        risk_score:      result.risk_score      ?? 0,
        classification:  result.classification  ?? "",
        detected_issues: result.detected_issues ?? [],
        red_flags:       result.red_flags       ?? [],
        extracted_text:  result.extracted_text  ?? null,
        scanned_at:      serverTimestamp(),
      };

      const docRef = await addDoc(ref, entry);

      // Optimistically update local state
      setHistory(prev => [{
        ...entry,
        id: docRef.id,
        scanned_at: new Date().toISOString(),
      }, ...prev].slice(0, MAX_ITEMS));

    } catch (e) {
      console.error("Failed to save scan result:", e);
    }
  }, [user, scansRef]);

  // ── Delete a single scan ──────────────────────────────────────────────────
  const removeItem = useCallback(async (id) => {
    if (!user?.uid) return;
    try {
      await deleteDoc(doc(db, "users", user.uid, "scans", id));
      setHistory(prev => prev.filter(r => r.id !== id));
    } catch (e) {
      console.error("Failed to delete scan:", e);
    }
  }, [user]);

  // ── Clear all scans ───────────────────────────────────────────────────────
  const clearHistory = useCallback(async () => {
    if (!user?.uid) return;
    try {
      const ref  = scansRef();
      const snap = await getDocs(ref);
      const deletes = snap.docs.map(d => deleteDoc(doc(db, "users", user.uid, "scans", d.id)));
      await Promise.all(deletes);
      setHistory([]);
    } catch (e) {
      console.error("Failed to clear history:", e);
    }
  }, [user, scansRef]);

  return { history, loading, addResult, clearHistory, removeItem };
}