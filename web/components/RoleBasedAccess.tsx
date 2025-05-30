'use client';

import { ReactNode, useEffect, useState } from 'react';
import { getUserRole } from '@/lib/store';

interface RoleBasedAccessProps {
  allowedRoles: string[];
  children: ReactNode;
  fallback?: ReactNode;
}

export default function RoleBasedAccess({ 
  allowedRoles, 
  children, 
  fallback = null 
}: RoleBasedAccessProps) {
  const [userRole, setUserRole] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Get user role on client side
    const role = getUserRole();
    setUserRole(role);
    setIsLoading(false);
  }, []);

  if (isLoading) {
    return null;
  }

  if (!userRole || !allowedRoles.includes(userRole)) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}