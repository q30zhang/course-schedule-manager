import { useEffect, useState } from 'react';

const useDarkMode = (initialValue = false) => {
  const [isDarkMode, setIsDarkMode] = useState(initialValue);

  useEffect(() => {
    const root = document.documentElement;
    if (isDarkMode) root.classList.add('dark');
    else root.classList.remove('dark');
  }, [isDarkMode]);

  const toggleDarkMode = () => {
    setIsDarkMode((prev) => !prev);
  };

  return { isDarkMode, setIsDarkMode, toggleDarkMode };
};

export default useDarkMode;
