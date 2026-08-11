/**
 * usePermissions — hook to check user permissions from localStorage.
 * Admin/master always return true for everything.
 */
export function usePermissions() {
  const userStr = localStorage.getItem('brewpos_user');
  const user = userStr ? JSON.parse(userStr) : null;
  const userRole = user?.role;
  const userPermissions: string[] = user?.permissions || [];

  const can = (permission?: string | null): boolean => {
    if (!permission) return true;
    if (userRole === 'admin' || userRole === 'master') return true;
    return userPermissions.includes(permission);
  };

  return { can, userRole, userPermissions, user };
}
