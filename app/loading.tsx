import { LoadingSpinner } from "@/components/loading-spinner";

export default function AppLoading() {
  return (
    <div className="flex flex-1 items-center justify-center bg-white">
      <LoadingSpinner size={44} />
    </div>
  );
}
