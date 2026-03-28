import {
  ChevronDownIcon,
  ChevronRightIcon,
} from '@heroicons/react/24/outline';

function SidebarFilterItem({ label, count, id, activeFilter, onSelect }) {
  const isActive = activeFilter === id;

  return (
    <button
      type="button"
      onClick={() => onSelect(id)}
      className={`flex w-full items-center justify-between border-l-4 px-4 py-2 text-sm transition ${
        isActive
          ? 'border-hubspot-teal bg-white font-semibold text-[#33475B]'
          : 'border-transparent text-[#425B76] hover:bg-white'
      }`}
    >
      <span>{label}</span>
      <span className="text-xs text-slate-500">{count}</span>
    </button>
  );
}

export default function Sidebar({
  counts,
  activeFilter,
  onFilterChange,
  moreOpen,
  onToggleMore,
}) {
  return (
    <aside className="flex w-full flex-col border-b border-hubspot-border bg-hubspot-sidebar md:h-screen md:w-[280px] md:border-b-0 md:border-r">
      <div className="border-b border-hubspot-border px-5 py-5 md:py-6">
        <p className="logo-font text-4xl leading-none text-hubspot-teal">Flo</p>
      </div>

      <div className="flex-1 overflow-y-auto py-4">
        <div className="space-y-1">
          <SidebarFilterItem
            label="Open tasks"
            count={counts.open}
            id="open"
            activeFilter={activeFilter}
            onSelect={onFilterChange}
          />
          <SidebarFilterItem
            label="Due today"
            count={counts.today}
            id="dueToday"
            activeFilter={activeFilter}
            onSelect={onFilterChange}
          />
          <SidebarFilterItem
            label="Due this week"
            count={counts.week}
            id="dueWeek"
            activeFilter={activeFilter}
            onSelect={onFilterChange}
          />
          <SidebarFilterItem
            label="High priority"
            count={counts.high}
            id="high"
            activeFilter={activeFilter}
            onSelect={onFilterChange}
          />
        </div>

        <div className="mt-3 border-t border-hubspot-border pt-3">
          <button
            type="button"
            onClick={onToggleMore}
            className="flex w-full items-center justify-between px-4 py-2 text-xs font-semibold uppercase tracking-wide text-[#5B708B]"
          >
            <span>More</span>
            {moreOpen ? (
              <ChevronDownIcon className="h-4 w-4" />
            ) : (
              <ChevronRightIcon className="h-4 w-4" />
            )}
          </button>
          {moreOpen ? (
            <div className="space-y-1 px-4 pb-2">
              <p className="text-sm text-[#5B708B]">Completed</p>
              <p className="text-sm text-[#5B708B]">No due date</p>
            </div>
          ) : null}
        </div>

      </div>
    </aside>
  );
}
