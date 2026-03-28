import { useEffect, useMemo, useRef, useState } from 'react';
import {
  CalendarDaysIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
} from '@heroicons/react/24/outline';

const WEEKDAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

function parseDateString(dateString) {
  if (!dateString) {
    return null;
  }

  const [year, month, day] = dateString.split('-').map(Number);

  if (!year || !month || !day) {
    return null;
  }

  const parsedDate = new Date(year, month - 1, day);

  if (
    Number.isNaN(parsedDate.getTime()) ||
    parsedDate.getFullYear() !== year ||
    parsedDate.getMonth() !== month - 1 ||
    parsedDate.getDate() !== day
  ) {
    return null;
  }

  return parsedDate;
}

function formatDateValue(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function startOfMonth(date) {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

function buildCalendarDays(monthDate) {
  const firstDayOfMonth = startOfMonth(monthDate);
  const gridStartDate = new Date(
    firstDayOfMonth.getFullYear(),
    firstDayOfMonth.getMonth(),
    firstDayOfMonth.getDate() - firstDayOfMonth.getDay()
  );

  return Array.from({ length: 42 }, (_, index) => {
    const nextDate = new Date(gridStartDate);
    nextDate.setDate(gridStartDate.getDate() + index);
    return nextDate;
  });
}

function isSameDay(firstDate, secondDate) {
  return (
    firstDate.getFullYear() === secondDate.getFullYear() &&
    firstDate.getMonth() === secondDate.getMonth() &&
    firstDate.getDate() === secondDate.getDate()
  );
}

export default function DatePicker({ id, value, onChange, placeholder = 'Select a date' }) {
  const wrapperRef = useRef(null);
  const selectedDate = useMemo(() => parseDateString(value), [value]);
  const [isOpen, setIsOpen] = useState(false);
  const [visibleMonth, setVisibleMonth] = useState(() => {
    return startOfMonth(selectedDate ?? new Date());
  });

  const calendarDays = useMemo(() => buildCalendarDays(visibleMonth), [visibleMonth]);
  const monthLabel = useMemo(() => {
    return visibleMonth.toLocaleDateString(undefined, {
      month: 'long',
      year: 'numeric',
    });
  }, [visibleMonth]);

  const today = useMemo(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), now.getDate());
  }, []);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const onPointerDown = (event) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    const onEscape = (event) => {
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', onPointerDown);
    document.addEventListener('keydown', onEscape);

    return () => {
      document.removeEventListener('mousedown', onPointerDown);
      document.removeEventListener('keydown', onEscape);
    };
  }, [isOpen]);

  useEffect(() => {
    setVisibleMonth(startOfMonth(selectedDate ?? new Date()));
  }, [selectedDate, isOpen]);

  const displayLabel = selectedDate
    ? selectedDate.toLocaleDateString(undefined, {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      })
    : placeholder;

  const selectDate = (date) => {
    onChange(formatDateValue(date));
    setIsOpen(false);
  };

  const selectOffsetDate = (offset) => {
    const nextDate = new Date();
    nextDate.setHours(0, 0, 0, 0);
    nextDate.setDate(nextDate.getDate() + offset);
    selectDate(nextDate);
  };

  return (
    <div ref={wrapperRef} className="relative">
      <button
        id={id}
        type="button"
        aria-haspopup="dialog"
        aria-expanded={isOpen}
        onClick={() => setIsOpen((open) => !open)}
        className={`flex h-10 w-full items-center justify-between rounded-lg border px-3 text-left text-sm transition ${
          selectedDate
            ? 'border-hubspot-border text-[#33475B]'
            : 'border-hubspot-border text-[#7A8CA2]'
        } ${isOpen ? 'border-hubspot-teal ring-2 ring-hubspot-teal/15' : 'hover:border-[#B7C5D6]'}`}
      >
        <span>{displayLabel}</span>
        <CalendarDaysIcon className="h-4 w-4 text-[#5B708B]" />
      </button>

      {isOpen ? (
        <div className="absolute z-30 mt-1 w-full rounded-xl border border-hubspot-border bg-white p-3 shadow-[0_12px_32px_rgba(11,29,42,0.16)] sm:w-[19rem]">
          <div className="flex items-center justify-between">
            <button
              type="button"
              className="rounded-md p-1.5 text-[#5B708B] transition hover:bg-[#F5F8FA]"
              onClick={() => {
                setVisibleMonth((current) => new Date(current.getFullYear(), current.getMonth() - 1, 1));
              }}
              aria-label="Previous month"
            >
              <ChevronLeftIcon className="h-4 w-4" />
            </button>

            <p className="text-sm font-semibold text-[#33475B]">{monthLabel}</p>

            <button
              type="button"
              className="rounded-md p-1.5 text-[#5B708B] transition hover:bg-[#F5F8FA]"
              onClick={() => {
                setVisibleMonth((current) => new Date(current.getFullYear(), current.getMonth() + 1, 1));
              }}
              aria-label="Next month"
            >
              <ChevronRightIcon className="h-4 w-4" />
            </button>
          </div>

          <div className="mt-3 grid grid-cols-7 gap-1 text-center text-xs font-medium text-[#7A8CA2]">
            {WEEKDAY_LABELS.map((label) => (
              <span key={label}>{label}</span>
            ))}
          </div>

          <div className="mt-1 grid grid-cols-7 gap-1">
            {calendarDays.map((day) => {
              const isCurrentMonth = day.getMonth() === visibleMonth.getMonth();
              const isSelected = selectedDate ? isSameDay(day, selectedDate) : false;
              const isToday = isSameDay(day, today);

              return (
                <button
                  key={day.toISOString()}
                  type="button"
                  onClick={() => selectDate(day)}
                  className={`h-8 rounded-md text-sm transition ${
                    isSelected
                      ? 'bg-hubspot-teal text-white hover:bg-hubspot-teal'
                      : isCurrentMonth
                        ? 'text-[#33475B] hover:bg-[#F5F8FA]'
                        : 'text-[#A0AEC0] hover:bg-[#F5F8FA]'
                  } ${isToday && !isSelected ? 'ring-1 ring-hubspot-teal/35' : ''}`}
                >
                  {day.getDate()}
                </button>
              );
            })}
          </div>

          <div className="mt-3 flex items-center justify-between border-t border-hubspot-border pt-2">
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => selectOffsetDate(0)}
                className="rounded-md px-2 py-1 text-xs font-medium text-hubspot-teal transition hover:bg-[#ECFDF9]"
              >
                Today
              </button>
              <button
                type="button"
                onClick={() => selectOffsetDate(1)}
                className="rounded-md px-2 py-1 text-xs font-medium text-hubspot-teal transition hover:bg-[#ECFDF9]"
              >
                Tomorrow
              </button>
            </div>

            <button
              type="button"
              onClick={() => {
                onChange('');
                setIsOpen(false);
              }}
              className="rounded-md px-2 py-1 text-xs font-medium text-[#5B708B] transition hover:bg-[#F5F8FA]"
            >
              Clear
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
