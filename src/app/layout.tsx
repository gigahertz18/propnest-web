import type { Metadata } from "next"
import { Inter, Geist } from "next/font/google"
import { AuthProvider } from "@/context/AuthContext"
import { getCurrentUser } from "@/lib/auth/session"
import "./globals.css"
import { cn } from "@/lib/utils"

const geist = Geist({ subsets: ["latin"], variable: "--font-sans" })

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "PropNest",
  description: "Property Management Platform",
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const initialUser = await getCurrentUser()

  return (
    <html lang="en" className={cn("font-sans", geist.variable)}>
      <body className={`${inter.className} antialiased`} suppressHydrationWarning>
        <AuthProvider initialUser={initialUser}>{children}</AuthProvider>
      </body>
    </html>
  )
}
