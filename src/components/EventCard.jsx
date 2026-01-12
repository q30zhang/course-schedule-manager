import React from 'react';

const EventCard = ({
  event,
  top,
  height,
  color,
  isSelected,
  onDragStart,
  onClick,
  onDoubleClick,
  onContextMenu
}) => {
  return (
    <div
      draggable
      onDragStart={onDragStart}
      onClick={onClick}
      onDoubleClick={onDoubleClick}
      onContextMenu={onContextMenu}
      className={`absolute left-1 right-1 rounded p-2 cursor-move text-xs overflow-hidden text-gray-900 ${
        isSelected ? 'ring-2 ring-blue-500' : ''
      }`}
      style={{
        top: `${top}px`,
        height: `${height}px`,
        backgroundColor: color
      }}
    >
      <div className="font-semibold truncate text-gray-900">{event.subject}</div>
      <div className="truncate text-gray-800">{event.teachers.join(', ')}</div>
      <div className="truncate text-[10px] text-gray-700">{event.branch}</div>
    </div>
  );
};

export default EventCard;
