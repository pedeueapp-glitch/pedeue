"use client";

import { SessionProvider } from "next-auth/react";
import { Toaster } from "react-hot-toast";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      {children}
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: {
            background: "#1f2937",
            color: "#f9fafb",
            borderRadius: "12px",
            border: "1px solid #374151",
          },
          success: {
            iconTheme: {
              primary: "#f97316",
              secondary: "#fff",
            },
          },
        }}
      />
    </SessionProvider>
  );
}
