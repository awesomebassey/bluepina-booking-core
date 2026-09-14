import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";
import { Newsreader } from "next/font/google";

export const metadata: Metadata = {
  title: "Bluepina Booking Core | Proof of Work",
  description: "A focused booking and host-onboarding architecture exercise.",
};

const newsreader = Newsreader({
  subsets: ["latin"],
  variable: "--font-newsreader",
  display: "swap",
});

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body className={newsreader.variable}>
        <header className="nav">
          <Link className="brand" href="/">
            bluepina / engineering study
          </Link>
          <nav>
            <Link href="/book">Book</Link>
            <Link href="/host">Host</Link>
            <Link href="/architecture">Architecture</Link>
          </nav>
        </header>
        <main>{children}</main>
        <footer>
          Independent proof-of-work project built for the Bluepina
          founding-engineer application.
        </footer>
      </body>
    </html>
  );
}
