// services/googleFetch.js
const createGoogleFetch = (accessToken) => async (url, init = {}) => {
    if (!accessToken) throw new Error('Not signed in');
    const res = await fetch(url, {
      ...init,
      headers: {
        ...(init.headers || {}),
        Authorization: `Bearer ${accessToken}`
      }
    });
    if (!res.ok) {
      let details = '';
      try {
        details = await res.text();
      } catch {
        // ignore
      }
      throw new Error(`Google API error ${res.status}: ${details || res.statusText}`);
    }
    const ct = res.headers.get('content-type') || '';
    if (ct.includes('application/json')) return res.json();
    return res.text();
};

export default createGoogleFetch;
