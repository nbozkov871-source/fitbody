import type { Metadata } from "next";
import { Inter, JetBrains_Mono, Roboto_Condensed } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";

const sans = Inter({
  variable: "--font-sans",
  subsets: ["latin", "cyrillic"],
});

const mono = JetBrains_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin", "cyrillic"],
});

// Carries headings on both the marketing page and the app, so the brand voice
// does not stop at the signup form.
const display = Roboto_Condensed({
  variable: "--font-display",
  subsets: ["latin", "cyrillic"],
  weight: ["700", "900"],
});

export const metadata: Metadata = {
  title: "FitBody — CRM за фитнес треньори",
  description:
    "Профилите, мерките и прогресът на всичките ви клиенти на едно място — и хранителен режим, който излиза готов от техните данни.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="bg"
      className={`dark ${sans.variable} ${mono.variable} ${display.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        {children}
        <Toaster />
      </body>
    </html>
  );
}
