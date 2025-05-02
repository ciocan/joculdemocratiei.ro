import { useEffect, useState } from "react";
import { useCountdown } from "usehooks-ts";
import { COUNTDOWN_UPDATE_INTERVAL } from "@joculdemocratiei/utils";

interface UseDebateCountdownProps {
  countdownEndTime?: number;
  totalTimeMs: number;
}

interface UseDebateCountdownResult {
  countdown: number;
  progressPercentage: number;
}

export function useRoomCountdown({
  countdownEndTime,
  totalTimeMs,
}: UseDebateCountdownProps): UseDebateCountdownResult {
  const [progressPercentage, setProgressPercentage] = useState(0);

  const [countdown, { startCountdown, stopCountdown, resetCountdown }] = useCountdown({
    countStart: countdownEndTime ? Math.ceil((countdownEndTime - Date.now()) / 1000) : 0,
  });

  useEffect(() => {
    if (countdownEndTime && countdownEndTime > Date.now()) {
      resetCountdown();
      startCountdown();
    } else {
      stopCountdown();
      resetCountdown();
    }

    return () => {
      stopCountdown();
    };
  }, [countdownEndTime, startCountdown, stopCountdown, resetCountdown]);

  useEffect(() => {
    if (!countdownEndTime) {
      return;
    }

    const updateProgress = () => {
      const now = Date.now();
      const timeLeft = countdownEndTime - now;
      const percentage = Math.max(0, (timeLeft / totalTimeMs) * 100);
      setProgressPercentage(percentage);
    };

    updateProgress();

    const interval = setInterval(updateProgress, COUNTDOWN_UPDATE_INTERVAL);

    return () => clearInterval(interval);
  }, [countdownEndTime, totalTimeMs]);

  return {
    countdown,
    progressPercentage,
  };
}
