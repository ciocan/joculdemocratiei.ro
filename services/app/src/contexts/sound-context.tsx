import { createContext, useContext, useState, useCallback, type ReactNode } from "react";

interface SoundContextType {
  isMuted: boolean;
  toggleMute: () => void;
  setMuted: (muted: boolean) => void;
  volume: number;
  setVolume: (volume: number) => void;
}

const SoundContext = createContext<SoundContextType | undefined>(undefined);

export function SoundProvider({ children }: { children: ReactNode }) {
  const [isMuted, setIsMuted] = useState<boolean>(() => {
    if (typeof window !== "undefined") {
      const savedMute = localStorage.getItem("jd-sound-muted");
      return savedMute === "true";
    }
    return false;
  });

  const [volume, setVolumeState] = useState<number>(() => {
    if (typeof window !== "undefined") {
      const savedVolume = localStorage.getItem("jd-sound-volume");
      return savedVolume ? Number.parseFloat(savedVolume) : 0.7;
    }
    return 0.7;
  });

  const toggleMute = useCallback(() => {
    setIsMuted((prev) => {
      const newValue = !prev;
      if (typeof window !== "undefined") {
        localStorage.setItem("jd-sound-muted", String(newValue));
      }
      return newValue;
    });
  }, []);

  const setMuted = useCallback((muted: boolean) => {
    setIsMuted(muted);
    if (typeof window !== "undefined") {
      localStorage.setItem("jd-sound-muted", String(muted));
    }
  }, []);

  const setVolume = useCallback((newVolume: number) => {
    setVolumeState(newVolume);
    if (typeof window !== "undefined") {
      localStorage.setItem("jd-sound-volume", String(newVolume));
    }
  }, []);

  return (
    <SoundContext.Provider value={{ isMuted, toggleMute, setMuted, volume, setVolume }}>
      {children}
    </SoundContext.Provider>
  );
}

export function useSoundSettings() {
  const context = useContext(SoundContext);
  if (context === undefined) {
    throw new Error("useSoundSettings must be used within a SoundProvider");
  }
  return context;
}
