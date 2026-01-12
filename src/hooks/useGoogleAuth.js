import { useEffect, useMemo, useRef, useState } from 'react';

const loadScript = (src) =>
  new Promise((resolve, reject) => {
    const existing = document.querySelector(`script[src="${src}"]`);

    if (existing && existing.dataset.loaded === 'true') return resolve();

    const onLoad = () => {
      const s = document.querySelector(`script[src="${src}"]`);
      if (s) s.dataset.loaded = 'true';
      resolve();
    };

    const onError = () => {
      try {
        existing?.remove?.();
      } catch {}
      reject(new Error(`Failed to load ${src} (blocked by network/adblock/CSP?)`));
    };

    if (existing) {
      existing.addEventListener('load', onLoad, { once: true });
      existing.addEventListener('error', onError, { once: true });
      return;
    }

    const script = document.createElement('script');
    script.src = src;
    script.async = true;
    script.defer = true;
    script.onload = onLoad;
    script.onerror = onError;
    document.head.appendChild(script);
  });

const useGoogleAuth = ({ clientId, onSignedOut } = {}) => {
  const [accessToken, setAccessToken] = useState('');
  const [authError, setAuthError] = useState('');
  const [showAuthError, setShowAuthError] = useState(true);
  const tokenClientRef = useRef(null);

  const googleScopes = useMemo(() => {
    return [
      'https://www.googleapis.com/auth/spreadsheets',
      'https://www.googleapis.com/auth/drive.file'
    ].join(' ');
  }, []);

  useEffect(() => {
    (async () => {
      try {
        setAuthError('');
        if (!clientId) {
          setShowAuthError(true);
          setAuthError('Missing VITE_GOOGLE_CLIENT_ID. Add it to your .env and restart the dev server.');
          return;
        }

        await loadScript('https://accounts.google.com/gsi/client');
        await new Promise((r) => setTimeout(r, 0));

        if (!window.google?.accounts?.oauth2) {
          setShowAuthError(true);
          setAuthError(
            `GIS not initialized. window.google=${!!window.google}, ` +
            `accounts=${!!window.google?.accounts}, oauth2=${!!window.google?.accounts?.oauth2}. ` +
            `Check DevTools -> Network for gsi/client, disable adblock, check CSP.`
          );
          return;
        }

        tokenClientRef.current = window.google.accounts.oauth2.initTokenClient({
          client_id: clientId,
          scope: googleScopes,
          callback: (resp) => {
            if (resp?.error) {
              setShowAuthError(true);
              setAuthError(resp.error);
              setAccessToken('');
              return;
            }
            setAuthError('');
            setAccessToken(resp.access_token || '');
          }
        });
      } catch (err) {
        setShowAuthError(true);
        setAuthError(err?.message || String(err));
      }
    })();
  }, [clientId, googleScopes]);

  const signIn = () => {
    setAuthError('');
    if (!tokenClientRef.current) {
      setShowAuthError(true);
      setAuthError('Token client not ready yet (GIS script not loaded).');
      return;
    }
    tokenClientRef.current.requestAccessToken({ prompt: accessToken ? '' : 'consent' });
  };

  const signOut = () => {
    try {
      if (accessToken && window.google?.accounts?.oauth2?.revoke) {
        window.google.accounts.oauth2.revoke(accessToken, () => {});
      }
    } catch {
      // ignore
    }
    setAccessToken('');
    setShowAuthError(true);
    onSignedOut?.();
  };

  return {
    accessToken,
    setAccessToken,
    authError,
    setAuthError,
    showAuthError,
    setShowAuthError,
    signIn,
    signOut
  };
};

export default useGoogleAuth;
