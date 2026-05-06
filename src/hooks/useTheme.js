import { useState, useEffect } from 'react';

const STORAGE_KEY = 'ev:color-scheme';
const COOKIE_NAME = 'ev_theme';

function setCrossAppCookie(value) {
  const expires = new Date();
  expires.setFullYear(expires.getFullYear() + 1);
  document.cookie = `${COOKIE_NAME}=${value}; domain=.empowered.vote; path=/; expires=${expires.toUTCString()}; SameSite=Lax`;
}

export function useTheme() {
  const [isDark, setIsDark] = useState(
    () => document.documentElement.classList.contains('dark')
  );

  useEffect(() => {
    const observer = new MutationObserver(() => {
      setIsDark(document.documentElement.classList.contains('dark'));
    });
    observer.observe(document.documentElement, { attributeFilter: ['class'] });
    return () => observer.disconnect();
  }, []);

  function toggle() {
    const next = !isDark;
    document.documentElement.classList.toggle('dark', next);
    const value = next ? 'dark' : 'light';
    localStorage.setItem(STORAGE_KEY, value);
    setCrossAppCookie(value);
    setIsDark(next);
  }

  return { isDark, toggle };
}
