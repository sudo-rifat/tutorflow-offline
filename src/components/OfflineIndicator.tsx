import { useEffect, useState } from "react";
import { CloudOff, HardDriveDownload } from "lucide-react";

/** Offline is normal here — the indicator stays calm and informative. */
export function OfflineIndicator() {
  const [online, setOnline] = useState(true);

  useEffect(() => {
    const update = () => setOnline(navigator.onLine);
    update();
    window.addEventListener("online", update);
    window.addEventListener("offline", update);
    return () => {
      window.removeEventListener("online", update);
      window.removeEventListener("offline", update);
    };
  }, []);

  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-2.5 py-1 text-xs text-muted-foreground"
      title={
        online
          ? "Your data is saved on this device."
          : "You are offline — TutorFlow keeps working normally."
      }
    >
      {online ? (
        <>
          <HardDriveDownload className="size-3.5 text-success" aria-hidden="true" />
          Saved on this device
        </>
      ) : (
        <>
          <CloudOff className="size-3.5" aria-hidden="true" />
          Offline mode
        </>
      )}
    </span>
  );
}
