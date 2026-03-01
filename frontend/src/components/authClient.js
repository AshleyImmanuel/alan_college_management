const getDefaultApiBase = () => {
    if (typeof window === 'undefined') return '';
    const isLocalHost = ['localhost', '127.0.0.1', '::1'].includes(window.location.hostname);
    if (!isLocalHost) return '';
    if (window.location.port === '5000') return '';
    return 'http://localhost:5000';
};

const API_BASE = String(process.env.REACT_APP_API_BASE_URL || getDefaultApiBase()).replace(/\/+$/, '');
const DEV_FALLBACK_API_BASE = process.env.NODE_ENV === 'development' ? 'http://localhost:5000' : '';
const AUTH_MARKER_KEY = 'parker_auth_active';

const buildApiUrl = (base, url) => {
    if (/^https?:\/\//i.test(url)) return url;
    const normalizedPath = String(url || '').startsWith('/') ? String(url) : `/${String(url || '')}`;
    return `${base}${normalizedPath}`;
};

const shouldRetryWithFallback = (res, primaryUrl, fallbackUrl) => {
    if (!fallbackUrl || primaryUrl === fallbackUrl) return false;
    const status = Number(res?.status || 0);
    return [404, 502, 503, 504].includes(status);
};

export const authFetch = async (url, options = {}) => {
    const { headers = {}, ...rest } = options;
    const primaryUrl = buildApiUrl(API_BASE, url);
    const fallbackUrl = buildApiUrl(DEV_FALLBACK_API_BASE, url);
    const fetchOptions = {
        ...rest,
        headers,
        credentials: 'include'
    };

    try {
        const res = await fetch(primaryUrl, fetchOptions);
        if (shouldRetryWithFallback(res, primaryUrl, fallbackUrl)) {
            return fetch(fallbackUrl, fetchOptions);
        }
        return res;
    } catch (error) {
        if (fallbackUrl && primaryUrl !== fallbackUrl) {
            return fetch(fallbackUrl, fetchOptions);
        }
        throw error;
    }
};

const setAuthMarker = (isActive) => {
    if (typeof window === 'undefined') return;
    try {
        if (isActive) {
            window.localStorage.setItem(AUTH_MARKER_KEY, '1');
        } else {
            window.localStorage.removeItem(AUTH_MARKER_KEY);
        }
    } catch (error) {
        // ignore storage errors
    }
};

const hasAuthMarker = () => {
    if (typeof window === 'undefined') return false;
    try {
        return window.localStorage.getItem(AUTH_MARKER_KEY) === '1';
    } catch (error) {
        return false;
    }
};

const shouldProbeAuthWithoutMarker = () => {
    if (typeof window === 'undefined') return false;
    const protectedPathPattern = /^\/(admin|hod|faculty|student|dashboard)(\/|$)/;
    return protectedPathPattern.test(String(window.location.pathname || ''));
};

export const markAuthActive = () => {
    setAuthMarker(true);
};

export const getCurrentUser = async () => {
    if (!hasAuthMarker() && !shouldProbeAuthWithoutMarker()) {
        return null;
    }

    const res = await authFetch('/api/auth/me');
    if (!res.ok) {
        if ([401, 403].includes(Number(res.status))) {
            setAuthMarker(false);
        }
        return null;
    }

    const data = await res.json().catch(() => ({}));
    const user = data?.user || null;
    if (user) {
        setAuthMarker(true);
    } else {
        setAuthMarker(false);
    }
    return user;
};

export const logoutUser = async () => {
    setAuthMarker(false);
    try {
        await authFetch('/api/auth/logout', { method: 'POST' });
    } catch (error) {
        // ignore network errors on logout
    }
};

export const notifyAuthChanged = () => {
    window.dispatchEvent(new Event('auth-changed'));
};
