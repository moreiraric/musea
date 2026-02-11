import { LoadingSpinner } from "@/components/loading-spinner";

export default function ArtworkDetailLoading() {
  return (
    <div className="relative flex min-h-full w-full flex-col bg-white">
      <div className="absolute inset-0 z-10 flex items-center justify-center bg-white/70">
        <LoadingSpinner size={44} />
      </div>
      <div className="h-[393px] w-full bg-[#f5f5f5] p-[20px]">
        <div className="h-full w-full animate-pulse rounded-[16px] bg-[#e5e5e5]" />
      </div>
      <div className="flex w-full flex-col gap-[24px] px-[20px] py-[16px]">
        <div className="h-[28px] w-[60%] animate-pulse rounded-full bg-[#e5e5e5]" />
        <div className="flex items-center justify-between">
          <div className="h-[40px] w-[180px] animate-pulse rounded-full bg-[#e5e5e5]" />
          <div className="h-[20px] w-[48px] animate-pulse rounded-full bg-[#e5e5e5]" />
        </div>
        <div className="h-[120px] w-full animate-pulse rounded-[16px] bg-[#e5e5e5]" />
        <div className="h-[44px] w-[70%] animate-pulse rounded-full bg-[#e5e5e5]" />
        <div className="h-[220px] w-full animate-pulse rounded-[24px] bg-[#e5e5e5]" />
      </div>
    </div>
  );
}
