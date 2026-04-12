// Global app loading fallback shown while a route segment is resolving.
// It keeps the shell populated with a centered spinner instead of a blank screen.

import { LoadingSpinner } from "@/components/loading-spinner";

// Renders the default full-app loading state.
export default function AppLoading() {
  return (
    <div className="flex flex-1 items-center justify-center bg-white">
      <LoadingSpinner size={44} />
    </div>
  );
}
