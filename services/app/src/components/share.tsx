import { IconButton, Tooltip } from "@radix-ui/themes";
import { CopyIcon, Share1Icon } from "@radix-ui/react-icons";

export const copyRoomUrl = () => {
  navigator.clipboard.writeText(window.location.href);
};

export const shareRoom = () => {
  if (navigator.share) {
    navigator.share({
      title: "Jocul Democrației",
      text: "Vino să jucăm Jocul Democrației!",
      url: window.location.href,
    });
  } else {
    copyRoomUrl();
  }
};

export function ShareButtons() {
  return (
    <>
      <Tooltip content="Copiază adresa camerei">
        <IconButton size="3" variant="surface" onClick={copyRoomUrl}>
          <CopyIcon />
        </IconButton>
      </Tooltip>
      <Tooltip content="Distribuie link-ul">
        <IconButton size="3" variant="surface" onClick={shareRoom}>
          <Share1Icon />
        </IconButton>
      </Tooltip>
    </>
  );
}
