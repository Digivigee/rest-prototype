'use client'

import { SessionProvider } from "next-auth/react"
import { ToastProvider } from "@/lib/ToastContext"

import { ConfirmProvider } from "@/lib/ConfirmContext"

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <ConfirmProvider>
        <ToastProvider>
          {children}
        </ToastProvider>
      </ConfirmProvider>
    </SessionProvider>
  )
}
