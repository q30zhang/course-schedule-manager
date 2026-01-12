import { useMemo } from 'react';

const useCalendarMath = ({ currentWeek }) => {
  const days = useMemo(
    () => ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
    []
  );
  const hours = useMemo(() => Array.from({ length: 24 }, (_, i) => i), []);
  const hourHeight = 80;

  const getWeekDates = () => {
    const today = new Date();
    const currentDay = today.getDay();
    const diff = currentDay === 0 ? -6 : 1 - currentDay;

    const monday = new Date(today);
    monday.setDate(today.getDate() + diff + (currentWeek * 7));

    return days.map((_, idx) => {
      const date = new Date(monday);
      date.setDate(monday.getDate() + idx);
      return `${(date.getMonth() + 1).toString().padStart(2, '0')}-${date.getDate().toString().padStart(2, '0')}`;
    });
  };

  const weekDates = useMemo(getWeekDates, [currentWeek, days]);

  const timeToPixels = (hour, minute) => {
    return (hour * hourHeight) + (minute / 60 * hourHeight);
  };

  const pixelsToTime = (pixels) => {
    const totalMinutes = Math.round((pixels / hourHeight) * 60 / 15) * 15;
    const hour = Math.floor(totalMinutes / 60);
    const minute = totalMinutes % 60;
    return { hour: Math.min(hour, 23), minute };
  };

  return {
    days,
    hours,
    hourHeight,
    weekDates,
    timeToPixels,
    pixelsToTime
  };
};

export default useCalendarMath;
