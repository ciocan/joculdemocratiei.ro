import { IconButton, Tooltip } from "@radix-ui/themes";
import { SpeakerLoudIcon, SpeakerOffIcon } from "@radix-ui/react-icons";
import { useSoundSettings } from "@/contexts/sound-context";

export function SoundToggle() {
  const { isMuted, toggleMute } = useSoundSettings();

  return (
    <Tooltip content={isMuted ? "Activează sunetul" : "Dezactivează sunetul"}>
      <IconButton size="2" variant="ghost" onClick={toggleMute} aria-label={isMuted ? "Unmute" : "Mute"}>
        {isMuted ? <SpeakerOffIcon /> : <SpeakerLoudIcon />}
      </IconButton>
    </Tooltip>
  );
}
