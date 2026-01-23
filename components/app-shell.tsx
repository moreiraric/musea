import type { ReactNode } from "react";
import { BottomNav } from "@/components/bottom-nav";
import { TopNav } from "@/components/top-nav";

type AppShellProps = {
  children: ReactNode;
};

export function AppShell({ children }: AppShellProps) {
  return (
    <div className="min-h-dvh bg-[radial-gradient(circle_at_top,_#f2f2f2,_#e6e3dd)] p-4 text-foreground">
      <div className="relative mx-auto h-[874px] w-[402px] rounded-[62px] border border-black/10 bg-[#0b0b0b] p-[10px] shadow-[0_25px_60px_-30px_rgba(0,0,0,0.45)]">
        <div className="absolute left-1/2 top-[16px] z-20 h-[34px] w-[120px] -translate-x-1/2 rounded-[20px] bg-[#050505] shadow-[inset_0_0_0_1px_rgba(255,255,255,0.08)]" />
        <div className="absolute left-[-4px] top-[130px] h-[64px] w-[6px] rounded-full bg-[#1a1a1a]" />
        <div className="absolute left-[-4px] top-[210px] h-[96px] w-[6px] rounded-full bg-[#1a1a1a]" />
        <div className="absolute right-[-4px] top-[180px] h-[96px] w-[6px] rounded-full bg-[#1a1a1a]" />
        <div className="relative flex h-full flex-col overflow-hidden rounded-[50px] bg-background">
          <TopNav />
          <main className="flex-1 overflow-y-auto pb-[100px]">{children}</main>
          <div className="absolute bottom-0 left-0 right-0">
            <BottomNav />
          </div>
        </div>
      </div>
    </div>
  );
}
