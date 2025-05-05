import { useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import ky from "ky";

import { useUserStore } from "@/stores/user-store";
import { gameStore } from "@/stores/game-store";
import { useThemeStore } from "@/stores/theme-store";
import { useSoundSettings } from "@/contexts/sound-context";
import { useLeaveRoomSound } from "@/hooks/use-leave-room-sound";
import { getCandidateAvatarUrl, type UserProfile } from "@joculdemocratiei/utils";

export function useUserMenu(handleLeaveRoom?: () => void) {
  const navigate = useNavigate();
  const { user, setUser } = useUserStore();
  const gameState = gameStore.get();
  const candidateId = gameState.context.candidateId;
  const { theme, toggleTheme } = useThemeStore();
  const [showSecretKey, setShowSecretKey] = useState(false);
  const [importDialogOpen, setImportDialogOpen] = useState(false);
  const [secretKeyInput, setSecretKeyInput] = useState("");
  const [importError, setImportError] = useState("");

  let soundSettings: {
    isMuted: boolean;
    volume: number;
    setVolume: (volume: number) => void;
    setMuted: (muted: boolean) => void;
    toggleMute?: () => void;
  };

  try {
    soundSettings = useSoundSettings();
  } catch (error) {
    console.error("Error loading sound settings:", error);
    soundSettings = {
      isMuted: false,
      volume: 0.7,
      setVolume: () => {},
      setMuted: () => {},
    };
  }

  const { isMuted, volume, setVolume, setMuted } = soundSettings;
  const { handleLeaveRoomWithSound } = useLeaveRoomSound(handleLeaveRoom);

  const userInitials = user ? `${user.firstName[0]}${user.lastName[0]}` : "?";
  const userName = user ? `${user.firstName} ${user.lastName}` : "Utilizator";
  const candidateImage = candidateId ? getCandidateAvatarUrl(candidateId, theme) : undefined;

  const navigateToHome = () => {
    if (handleLeaveRoom) {
      handleLeaveRoomWithSound();
    } else {
      navigate({ to: "/" });
    }
  };

  const navigateToProfile = () => {
    if (user?.userId) {
      if (handleLeaveRoom) {
        handleLeaveRoomWithSound();
      } else {
        navigate({ to: "/u/$userId", params: { userId: user.userId } });
      }
    }
  };

  const toggleSecretKeyVisibility = () => {
    setShowSecretKey(!showSecretKey);
  };

  const copySecretKeyToClipboard = () => {
    if (user?.secretKey) {
      navigator.clipboard.writeText(user.secretKey);
      toast.success("Cheia secretă a fost copiată în clipboard");
    }
  };

  const importUserMutation = useMutation({
    mutationFn: (secretKey: string) =>
      ky
        .post("/api/import-user-profile", {
          json: { secretKey: secretKey.trim() },
        })
        .json<{ token: string; user: UserProfile; error?: string }>(),
    onMutate: () => {
      setImportError("");
    },
    onSuccess: ({ token, user }) => {
      localStorage.setItem("jd-token", token);
      toast.success("Profilul utilizatorului a fost importat cu succes!");
      setImportDialogOpen(false);
      setUser(user);
      window.location.reload();
    },
    onError: (error) => {
      console.error("Error importing user profile:", error);
      setImportError("Nu am putut importa profilul utilizatorului");
    },
  });

  const handleImportUserProfile = () => {
    if (!secretKeyInput.trim()) {
      setImportError("Cheia secretă este obligatorie");
      return;
    }

    importUserMutation.mutate(secretKeyInput);
  };

  return {
    user,
    userInitials,
    userName,
    candidateImage,
    theme,
    toggleTheme,
    isMuted,
    volume,
    setVolume,
    setMuted,
    showSecretKey,
    importDialogOpen,
    secretKeyInput,
    importError,
    isImporting: importUserMutation.isPending,
    navigateToHome,
    navigateToProfile,
    toggleSecretKeyVisibility,
    copySecretKeyToClipboard,
    handleImportUserProfile,
    setImportDialogOpen,
    setSecretKeyInput,
    handleLeaveRoomWithSound,
  };
}
