// hooks/useAuthGuard.ts
'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { jwtDecode } from 'jwt-decode'
import Cookies from 'js-cookie'
import { toast } from 'react-toastify'

type DecodedToken = {
  email: string
  sub: string
  ['custom:tenantId']?: string
  ['custom:tenantName']?: string
  [key: string]: any
}

export const useAuthGuard = (): DecodedToken | null => {
  const router = useRouter()
  const [decodedToken, setDecodedToken] = useState<DecodedToken | null>(null)

  useEffect(() => {
    const id_token = Cookies.get('id_token')

    if (!id_token) {
      toast.info('Session ended. Please log in again.')
      router.push('/')
      return
    }

    try {
      const decoded: DecodedToken = jwtDecode(id_token)
      if (!decoded.email || !decoded.sub) {
        toast.error('Unauthorized. Try logging in again.')
        router.push('/')
        return
      }

      setDecodedToken(decoded)
    } catch (err) {
      toast.error('Unauthorized. Try logging in again.')
      router.push('/')
    }
  }, [])

  return decodedToken
}
