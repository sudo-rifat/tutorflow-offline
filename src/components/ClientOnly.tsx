import { useEffect, useState, type ReactNode } from "react";

/**
 * The local database only exists in the browser, so data screens must not run
 * during server rendering. This gate renders children after hydration.
 */
export function ClientOnly({ children, fallback = null }: { children: ReactNode; fallback?: ReactNode }) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  if (!mounted) return <>{fallback}</>;
  return <>{children}</>;
}
