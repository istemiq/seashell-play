import { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';

export function useNavigateBackOrHome(homePath = '/') {
  const navigate = useNavigate();

  return useCallback(() => {
    if (window.history.length > 1) {
      navigate(-1);
      return;
    }
    navigate(homePath, { replace: true });
  }, [navigate, homePath]);
}
