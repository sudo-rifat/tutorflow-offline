import { useEffect } from "react";
import { seedSampleData } from "@/services/seed";
import { getSetting, setSetting } from "@/services/settings";

const SEED_KEY = "sampleDataSeeded";

/** Runs once on a fresh install so the app never opens completely empty. */
export function useFirstRunSeed() {
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const seeded = await getSetting(SEED_KEY, false);
        if (seeded || cancelled) return;
        await seedSampleData();
        await setSetting(SEED_KEY, true);
      } catch (error) {
        console.error("Sample data setup failed", error);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);
}
