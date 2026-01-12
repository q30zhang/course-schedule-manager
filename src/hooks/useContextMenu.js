import { useEffect, useState } from 'react';

const useContextMenu = () => {
  const [contextMenu, setContextMenu] = useState(null);

  const openContextMenu = (nextMenu) => {
    setContextMenu(nextMenu);
  };

  const closeContextMenu = () => {
    setContextMenu(null);
  };

  useEffect(() => {
    const handleClick = () => setContextMenu(null);
    const handleEscape = (e) => {
      if (e.key === 'Escape') setContextMenu(null);
    };

    document.addEventListener('click', handleClick);
    document.addEventListener('keydown', handleEscape);

    return () => {
      document.removeEventListener('click', handleClick);
      document.removeEventListener('keydown', handleEscape);
    };
  }, []);

  return {
    contextMenu,
    setContextMenu,
    openContextMenu,
    closeContextMenu
  };
};

export default useContextMenu;
