import { useState } from "react";
import { Slider, Flex, Tooltip, IconButton, Popover } from "@radix-ui/themes";
import { SpeakerLoudIcon } from "@radix-ui/react-icons";
import { useSoundSettings } from "@/contexts/sound-context";

export function SoundVolume() {
  const { volume, setVolume, isMuted } = useSoundSettings();
  const [open, setOpen] = useState(false);
  
  const handleVolumeChange = (newVolume: number[]) => {
    setVolume(newVolume[0]);
  };
  
  return (
    <Popover.Root open={open} onOpenChange={setOpen}>
      <Popover.Trigger>
        <Tooltip content="Volum">
          <IconButton 
            size="2" 
            variant="ghost" 
            aria-label="Ajustează volumul"
            disabled={isMuted}
          >
            <SpeakerLoudIcon />
          </IconButton>
        </Tooltip>
      </Popover.Trigger>
      <Popover.Content>
        <Flex direction="column" gap="2" style={{ width: "150px" }}>
          <Slider 
            defaultValue={[volume]} 
            min={0} 
            max={1} 
            step={0.1}
            onValueChange={handleVolumeChange}
            disabled={isMuted}
          />
        </Flex>
      </Popover.Content>
    </Popover.Root>
  );
}
