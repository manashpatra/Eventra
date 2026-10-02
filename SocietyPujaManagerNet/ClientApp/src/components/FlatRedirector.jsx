import React, { useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useSnackbar } from 'notistack';
import { parseAndSelectFlat, clearSelectedFlat } from './FlatSelectionDialog';
import LoadingScreen from './LoadingScreen';

const FlatRedirector = () => {
  const { flatId } = useParams();
  const navigate = useNavigate();
  const { enqueueSnackbar } = useSnackbar();
  const checkedRef = useRef(null);

  useEffect(() => {
    if (flatId && checkedRef.current !== flatId) {
      checkedRef.current = flatId;
      const flat = parseAndSelectFlat(flatId);
      if (!flat) {
        clearSelectedFlat();
        window.dispatchEvent(new Event('flatSelectionChanged'));
        enqueueSnackbar(`Invalid flat identifier: "${flatId}"`, {
          variant: 'error',
          autoHideDuration: 4000,
        });
      }
    }
    // Redirect to /home (replace history entry)
    navigate('/home', { replace: true });
  }, [flatId, navigate, enqueueSnackbar]);

  return <LoadingScreen message="Selecting flat and redirecting..." />;
};

export default FlatRedirector;
