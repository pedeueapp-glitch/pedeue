"use client";

import { useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Sidebar } from "@/components/Sidebar";
import { SidebarProvider, useSidebar } from "@/lib/contexts/SidebarContext";

export default function SuperAdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/entrar");
      return;
    }

    if (status === "authenticated" && session.user.role !== "SUPERADMIN") {
      router.push("/dashboard");
    }
  }, [status, session, router]);

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500"></div>
          <p className="text-[10px] font-black  text-slate-400 tracking-widest">Validando Acesso SuperAdmin...</p>
        </div>
      </div>
    );
  }

  if (!session || session.user.role !== "SUPERADMIN") return null;

  return (
    <SidebarProvider>
      <SuperAdminContent>
        {children}
      </SuperAdminContent>
    </SidebarProvider>
  );
}

function SuperAdminContent({ children }: { children: React.ReactNode }) {
  const { isOpen, close } = useSidebar();

  return (
    <div className="flex min-h-screen bg-slate-50/50">
      <Sidebar 
        isOpen={isOpen} 
        onClose={close}
        mode="SUPERADMIN"
      />
      
      <main className="flex-1 flex flex-col min-w-0">
        {children}
      </main>
    </div>
  );
}
