import { useEffect, useState, ReactNode } from 'react';
import { useAuth } from '../hooks/useAuth';
import { OrgCheckState } from '../types';

export default function OrgCheckGate({
  children,
}: {
  children: ReactNode;
}) {
  const { isAuthenticated, checkCurrentOrgInMap } = useAuth();
  const [orgChecked, setOrgChecked] = useState(false);

  useEffect(() => {
    if (isAuthenticated && !orgChecked) {
      checkCurrentOrgInMap().then((status) => {
        // console.log('orgStatus', status);
        if (status === OrgCheckState.ORGANIZATION_FOUND) {
          setOrgChecked(true);
        }
      });
    }
  }, [isAuthenticated, orgChecked, checkCurrentOrgInMap]);

  // console.log('isAuthenticated', isAuthenticated, orgChecked);

  if (!isAuthenticated || !orgChecked) {
    return (
      <div className="flex items-center justify-center h-screen w-screen bg-background-bg">
        <div className="fb-body2-regular text-text-2">
          Loading organization...
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
