import { useEffect, useMemo, useRef, useState } from 'react';
import {
  CalendarDaysIcon,
  ChevronDownIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
} from '@heroicons/react/24/outline';

const WEEKDAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const DATE_OPTIONS = {
  today: 'Today',
  tomorrow: 'Tomorrow',
  workingDays3: 'In 3 working days',
  custom: 'Custom Date',
};

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

function startOfDay(date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function addDays(date, days) {
  const nextDate = new Date(date);
  nextDate.setDate(nextDate.getDate() + days);
  return nextDate;
}

function isWeekend(date) {
  const day = date.getDay();
  return day === 0 || day === 6;
}

function addWorkingDays(date, days) {
  const nextDate = new Date(date);
  let remainingDays = days;

  while (remainingDays > 0) {
    nextDate.setDate(nextDate.getDate() + 1);

    if (!isWeekend(nextDate)) {
      remainingDays -= 1;
    }
  }

  return nextDate;
}

function inferOptionFromValue(dateValue, presetDates) {
  if (!dateValue) {
    return '';
  }

  if (dateValue === presetDates.today) {
    return 'today';
  }

  if (dateValue === presetDates.tomorrow) {
    return 'tomorrow';
  }

  if (dateValue === presetDates.workingDays3) {
    return 'workingDays3';
  }

  return 'custom';
}

export default function DatePicker({ id, value, onChange, placeholder = 'Select a date' }) {
  const wrapperRef = useRef(null);
  const selectedDate = useMemo(() => parseDateString(value), [value]);
  const [isOpen, setIsOpen] = useState(false);
  const [pendingCustomSelection, setPendingCustomSelection] = useState(false);
  const [visibleMonth, setVisibleMonth] = useState(() => {
    return startOfMonth(selectedDate ?? new Date());
  });

  const baseDate = startOfDay(new Date());
  const presetDates = {
    today: formatDateValue(baseDate),
    tomorrow: formatDateValue(addDays(baseDate, 1)),
    workingDays3: formatDateValue(addWorkingDays(baseDate, 3)),
  };

  const selectedOptionFromValue = inferOptionFromValue(value, presetDates);

  const selectedOption = pendingCustomSelection ? 'custom' : selectedOptionFromValue;

  const calendarDays = useMemo(() => buildCalendarDays(visibleMonth), [visibleMonth]);
  const monthLabel = useMemo(() => {
    return visibleMonth.toLocaleDateString(undefined, {
      month: 'long',
      year: 'numeric',
    });
  }, [visibleMonth]);

  const today = useMemo(() => {
    return startOfDay(new Date());
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

  useEffect(() => {
    if (value || !isOpen) {
      setPendingCustomSelection(false);
    }
  }, [value, isOpen]);

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
    setPendingCustomSelection(false);
    setIsOpen(false);
  };

  const handlePresetChange = (nextOption) => {
    if (nextOption === 'custom') {
      onChange('');
      setPendingCustomSelection(true);
      setIsOpen(true);
      setVisibleMonth(startOfMonth(selectedDate ?? new Date()));
      return;
    }

    if (nextOption === 'today' || nextOption === 'tomorrow' || nextOption === 'workingDays3') {
      onChange(presetDates[nextOption]);
    }

    setPendingCustomSelection(false);
    setIsOpen(false);
  };

  return (
    <div ref={wrapperRef} className="relative">
      <div className="relative">
        <select
          id={id}
          value={selectedOption || ''}
          onChange={(event) => handlePresetChange(event.target.value)}
          className="h-10 w-full appearance-none rounded-lg border border-hubspot-border bg-white px-3 pr-9 text-sm text-[#33475B] transition hover:border-[#B7C5D6] focus:border-hubspot-teal focus:outline-none focus:ring-2 focus:ring-hubspot-teal/15"
        >
          <option value="" disabled>
            {placeholder}
          </option>
          <option value="today">{DATE_OPTIONS.today}</option>
          <option value="tomorrow">{DATE_OPTIONS.tomorrow}</option>
          <option value="workingDays3">{DATE_OPTIONS.workingDays3}</option>
          <option value="custom">{DATE_OPTIONS.custom}</option>
        </select>

        <ChevronDownIcon
          className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#5B708B]"
          aria-hidden="true"
        />
      </div>

      {selectedOption === 'custom' ? (
        <button
          type="button"
          aria-haspopup="dialog"
          aria-expanded={isOpen}
          onClick={() => setIsOpen((open) => !open)}
          className={`mt-2 flex h-10 w-full items-center justify-between rounded-lg border px-3 text-left text-sm transition ${
            selectedDate ? 'border-hubspot-border text-[#33475B]' : 'border-hubspot-border text-[#7A8CA2]'
          } ${isOpen ? 'border-hubspot-teal ring-2 ring-hubspot-teal/15' : 'hover:border-[#B7C5D6]'}`}
        >
          <span>{displayLabel}</span>
          <CalendarDaysIcon className="h-4 w-4 text-[#5B708B]" />
        </button>
      ) : null}

      {selectedOption === 'custom' && isOpen ? (
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
        </div>
      ) : null}
    </div>
  );
}
