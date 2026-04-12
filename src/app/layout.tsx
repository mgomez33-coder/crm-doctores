import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "CRM Doctores - Gestión Médica",
  description: "Sistema CRM para gestión de doctores y seguimiento comercial",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body className="bg-gray-50 text-gray-900 antialiased">
        <div className="flex min-h-screen">
          <SidebarWrapper />
          <main className="flex-1 lg:ml-64">
            <div className="p-4 pt-16 lg:pt-4 max-w-7xl mx-auto">
              {children}
            </div>
          </main>
        </div>
      </body>
    </html>
  );
}

import SidebarWrapper from "@/components/Sidebar";
