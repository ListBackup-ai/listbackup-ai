'use client'

import { useAuthInit } from '@/lib/hooks/use-auth-init'

export function AuthInitializer() {
  useAuthInit()
  return null
}