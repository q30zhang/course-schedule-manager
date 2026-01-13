import React from 'react';

const EventCard = ({
  event,
  viewMode = 'all',
  top,
  height,
  leftPct = 0,
  widthPct = 100,
  color,
  isSelected,
  onDragStart,
  onClick,
  onDoubleClick,
  onContextMenu
}) => {
  const cleanTeacher = (name) => {
    return String(name || '')
      .replace(/\b1v1\b/gi, '')
      .replace(/\s+/g, ' ')
      .trim();
  };

  const teacherText = (event.teachers || []).map(cleanTeacher).filter(Boolean).join(', ');
  const studentText = (event.students || []).filter(Boolean).join(', ');
  const showStudents = viewMode !== 'student';

  return (
    <div
      draggable
      onDragStart={onDragStart}
      onClick={onClick}
      onDoubleClick={onDoubleClick}
      onContextMenu={onContextMenu}
      className={`absolute rounded p-2 cursor-move text-xs overflow-hidden text-gray-900 border border-black/40 shadow-sm ${
        isSelected ? 'ring-2 ring-blue-500' : ''
      }`}
      style={{
        top: `${top}px`,
        height: `${height}px`,
        left: `${leftPct}%`,
        width: `${widthPct}%`,
        backgroundColor: color
      }}
    >
      <div className="font-semibold truncate text-gray-900">{event.subject}</div>
      <div className="truncate text-gray-800">{teacherText}</div>
      {showStudents && (
        <div className="truncate text-[11px] text-gray-800">{studentText}</div>
      )}
      <div className="truncate text-[10px] text-gray-700">{event.branch}</div>
    </div>
  );
};

export default EventCard;
