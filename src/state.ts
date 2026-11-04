import { useEffect, useRef, useState } from "react";
import { SAMPLE_PROFILES, type Profile } from "./data";
const STORAGE_KEY = "rs3-compass-design-v1";
interface SavedState {
  version: 1;
  activeId: string;
  profiles: Profile[];
}
function validProfile(value: unknown): value is Profile {
  if (!value || typeof value !== "object") return false;
  const p = value as Partial<Profile>;
  return (
    typeof p.id === "string" &&
    typeof p.name === "string" &&
    (p.kind === "Solo Ironman" || p.kind === "Group Ironman") &&
    (p.mode === "f2p" || p.mode === "members") &&
    typeof p.activeTask === "string" &&
    !!p.levels &&
    typeof p.levels === "object" &&
    Object.values(p.levels).every(
      (n) => Number.isInteger(n) && n >= 1 && n <= 120,
    ) &&
    [p.completedQuests, p.packed, p.completedTasks].every(
      (a) => Array.isArray(a) && a.every((x) => typeof x === "string"),
    ) &&
    !!p.notes &&
    typeof p.notes === "object" &&
    Object.values(p.notes).every((n) => typeof n === "string")
  );
}
function initialState(): SavedState {
  try {
    const saved: unknown = JSON.parse(
      localStorage.getItem(STORAGE_KEY) || "null",
    );
    if (saved && typeof saved === "object") {
      const s = saved as SavedState;
      if (
        s.version === 1 &&
        Array.isArray(s.profiles) &&
        s.profiles.length > 0 &&
        s.profiles.every(validProfile) &&
        s.profiles.some((p) => p.id === s.activeId)
      )
        return s;
    }
  } catch {
    /* The design remains usable when browser storage is unavailable. */
  }
  return {
    version: 1,
    activeId: SAMPLE_PROFILES[0].id,
    profiles: structuredClone(SAMPLE_PROFILES),
  };
}
export function useProfiles() {
  const [saved, setSaved] = useState<SavedState>(initialState);
  const [storageError, setStorageError] = useState(false);
  const lastStorageError = useRef(false);
  useEffect(() => {
    let failed = false;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(saved));
    } catch {
      failed = true;
    }
    // A successful write must not enqueue another render on every keystroke.
    if (lastStorageError.current !== failed) {
      lastStorageError.current = failed;
      setStorageError(failed);
    }
  }, [saved]);
  const profile = saved.profiles.find((p) => p.id === saved.activeId)!;
  const updateProfile = (update: (current: Profile) => Profile) =>
    setSaved((current) => ({
      ...current,
      profiles: current.profiles.map((p) =>
        p.id === current.activeId ? update(p) : p,
      ),
    }));
  const selectProfile = (id: string) =>
    setSaved((current) =>
      current.profiles.some((p) => p.id === id)
        ? { ...current, activeId: id }
        : current,
    );
  return {
    profile,
    profiles: saved.profiles,
    updateProfile,
    selectProfile,
    storageError,
  };
}
