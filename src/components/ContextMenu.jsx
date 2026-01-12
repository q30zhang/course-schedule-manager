import React from 'react';

const ContextMenu = ({
  contextMenu,
  isDarkMode,
  onEdit,
  onCopyTo,
  onCopyToNextWeek,
  onDelete,
  onCreateEvent,
  selectedEventsSize,
  currentWeek
}) => {
  if (!contextMenu) return null;

  return (
    <div
      className={`fixed rounded shadow-lg py-1 z-50 border ${isDarkMode ? 'bg-gray-900 border-gray-700 text-gray-100' : 'bg-white border-gray-300'}`}
      style={{ left: contextMenu.x, top: contextMenu.y }}
    >
      {contextMenu.type === 'event' ? (
        <>
          <button
            onClick={onEdit}
            className={`w-full px-4 py-2 text-left ${isDarkMode ? 'hover:bg-gray-800' : 'hover:bg-gray-100'}`}
          >
            Edit
          </button>
          <button
            onClick={onCopyTo}
            className={`w-full px-4 py-2 text-left ${isDarkMode ? 'hover:bg-gray-800' : 'hover:bg-gray-100'}`}
          >
            Copy to...
          </button>
          {currentWeek === 0 && (
            <button
              onClick={onCopyToNextWeek}
              className={`w-full px-4 py-2 text-left ${isDarkMode ? 'hover:bg-gray-800' : 'hover:bg-gray-100'}`}
            >
              Copy to next week
            </button>
          )}
          <button
            onClick={onDelete}
            className={`w-full px-4 py-2 text-left text-red-500 ${isDarkMode ? 'hover:bg-gray-800' : 'hover:bg-gray-100'}`}
          >
            Delete {selectedEventsSize > 1 ? `(${selectedEventsSize})` : ''}
          </button>
        </>
      ) : (
        <button
          onClick={onCreateEvent}
          className={`w-full px-4 py-2 text-left ${isDarkMode ? 'hover:bg-gray-800' : 'hover:bg-gray-100'}`}
        >
          Create Event
        </button>
      )}
    </div>
  );
};

export default ContextMenu;
