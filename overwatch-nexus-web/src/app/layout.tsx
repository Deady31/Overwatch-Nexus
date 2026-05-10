import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Overwatch Nexus - Tactical Dashboard",
  description: "Advanced tactical insights and live winrates for Overwatch 2 Season 16.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr" className="dark">
      <body className={`${inter.variable} min-h-screen bg-black antialiased relative`}>
        {/* Fixed Parallax Background */}
        <div 
          className="fixed inset-0 z-[-1] bg-cover bg-center bg-no-repeat"
          style={{
            backgroundImage: "linear-gradient(rgba(15, 15, 35, 0.8), rgba(15, 15, 35, 0.95)), url('https://images8.alphacoders.com/133/1332026.png')"
          }}
        />
        
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 relative z-0">
          {children}
        </main>
      </body>
    </html>
  );
}
