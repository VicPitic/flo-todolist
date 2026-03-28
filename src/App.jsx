import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  CheckIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  ChevronUpDownIcon,
  MagnifyingGlassIcon,
  EnvelopeIcon,
  PhoneIcon,
  ClipboardDocumentCheckIcon,
  TrashIcon,
  UserCircleIcon,
} from '@heroicons/react/24/outline';
import { v4 as uuidv4 } from 'uuid';
import Sidebar from './components/Sidebar';
import ContactsPanel from './components/ContactsPanel';
import TaskPanel from './components/TaskPanel';
import {
  CONTACTS_STORAGE_KEY,
  TASKS_STORAGE_KEY,
  consumeStorageNotice,
  loadAll,
  saveContacts,
  saveTasks,
} from './data/localStore';

const tabOptions = [
  { key: 'all', label: 'All' },
  { key: 'today', label: 'Due today' },
  { key: 'overdue', label: 'Overdue' },
  { key: 'upcoming', label: 'Upcoming' },
  { key: 'completed', label: 'Completed' },
];

const priorityOrder = {
  High: 3,
  Medium: 2,
  Low: 1,
  null: 0,
};

function formatLocalDate(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function formatDisplayDate(dateString) {
  if (!dateString) {
    return 'No due date';
  }

  const [year, month, day] = dateString.split('-').map(Number);
  const date = new Date(year, month - 1, day);
  return date.toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

function endOfWeek(date) {
  const copy = new Date(date);
  const day = copy.getDay();
  const offset = day === 0 ? 0 : 7 - day;
  copy.setDate(copy.getDate() + offset);
  return formatLocalDate(copy);
}

function isWithinWeek(dueDate, today, weekEnd) {
  if (!dueDate) {
    return false;
  }

  return dueDate >= today && dueDate <= weekEnd;
}

function isOverdue(task, today) {
  if (!task.dueDate) {
    return false;
  }

  return task.status === 'open' && task.dueDate < today;
}

function priorityColor(priority) {
  if (priority === 'High') {
    return '#F97066';
  }
  if (priority === 'Medium') {
    return '#FEC84B';
  }
  return '#98A2B3';
}

function getTypeIcon(type) {
  if (type === 'Call') {
    return <PhoneIcon className="h-4 w-4" aria-hidden="true" />;
  }
  if (type === 'Email') {
    return <EnvelopeIcon className="h-4 w-4" aria-hidden="true" />;
  }
  return <CheckIcon className="h-4 w-4" aria-hidden="true" />;
}

function SortHeader({ label, sortKey, activeSort, onSort }) {
  const isActive = activeSort.key === sortKey;

  return (
    <button
      type="button"
      onClick={() => onSort(sortKey)}
      className="flex items-center gap-1 text-xs font-semibold uppercase tracking-[0.08em] text-[#5B708B]"
    >
      {label}
      {isActive ? (
        activeSort.direction === 'asc' ? (
          <ChevronUpIcon className="h-3.5 w-3.5" />
        ) : (
          <ChevronDownIcon className="h-3.5 w-3.5" />
        )
      ) : (
        <ChevronUpDownIcon className="h-3.5 w-3.5 text-slate-300" />
      )}
    </button>
  );
}

export default function App() {
  const [tasks, setTasks] = useState([]);
  const [contacts, setContacts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeSidebarFilter, setActiveSidebarFilter] = useState('open');
  const [moreOpen, setMoreOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [sortState, setSortState] = useState({ key: 'dueDate', direction: 'asc' });
  const [selectedTaskIds, setSelectedTaskIds] = useState([]);
  const [panelOpen, setPanelOpen] = useState(false);
  const [panelMode, setPanelMode] = useState('create');
  const [panelTask, setPanelTask] = useState(null);
  const [contactsPanelOpen, setContactsPanelOpen] = useState(false);
  const selectAllRef = useRef(null);

  const today = formatLocalDate(new Date());
  const weekEnd = endOfWeek(new Date());

  const loadData = useCallback(async ({ showLoading = true } = {}) => {
    try {
      if (showLoading) {
        setLoading(true);
      }

      const { tasks: taskData, contacts: contactData } = await loadAll();

      setTasks(Array.isArray(taskData) ? taskData : []);
      setContacts(Array.isArray(contactData) ? contactData : []);
      setError(consumeStorageNotice() || '');
    } catch (loadError) {
      setError(loadError.message || 'Could not load local data. Check browser storage settings.');
    } finally {
      if (showLoading) {
        setLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return undefined;
    }

    const handleStorageSync = (event) => {
      if (event.storageArea !== window.localStorage) {
        return;
      }

      if (
        event.key !== null &&
        event.key !== TASKS_STORAGE_KEY &&
        event.key !== CONTACTS_STORAGE_KEY
      ) {
        return;
      }

      void loadData({ showLoading: false });
    };

    window.addEventListener('storage', handleStorageSync);

    return () => {
      window.removeEventListener('storage', handleStorageSync);
    };
  }, [loadData]);

  useEffect(() => {
    setSelectedTaskIds((currentSelected) => {
      return currentSelected.filter((id) => tasks.some((task) => task.id === id));
    });
  }, [tasks]);

  const persistTasks = async (nextTasks) => {
    setTasks(nextTasks);

    try {
      await saveTasks(nextTasks);
      setError(consumeStorageNotice() || '');
    } catch (saveError) {
      setError(
        saveError.message || 'Could not save tasks locally. Check browser storage settings.'
      );
    }
  };

  const persistContacts = async (nextContacts) => {
    setContacts(nextContacts);

    try {
      await saveContacts(nextContacts);
      setError(consumeStorageNotice() || '');
      return true;
    } catch (saveError) {
      setError(
        saveError.message || 'Could not save contacts locally. Check browser storage settings.'
      );
      return false;
    }
  };

  const counts = useMemo(() => {
    const openTasks = tasks.filter((task) => task.status === 'open');

    return {
      open: openTasks.length,
      today: openTasks.filter((task) => task.dueDate === today).length,
      week: openTasks.filter((task) => isWithinWeek(task.dueDate, today, weekEnd)).length,
      high: openTasks.filter((task) => task.priority === 'High').length,
    };
  }, [tasks, today, weekEnd]);

  const filteredAndSortedTasks = useMemo(() => {
    const sidebarFiltered =
      activeTab === 'completed'
        ? tasks.filter((task) => task.status === 'complete')
        : tasks.filter((task) => {
            if (activeSidebarFilter === 'dueToday') {
              return task.dueDate === today;
            }
            if (activeSidebarFilter === 'dueWeek') {
              return isWithinWeek(task.dueDate, today, weekEnd);
            }
            if (activeSidebarFilter === 'high') {
              return task.priority === 'High';
            }
            return task.status === 'open';
          });

    const tabFiltered = sidebarFiltered.filter((task) => {
      if (activeTab === 'completed') {
        return task.status === 'complete';
      }
      if (activeTab === 'today') {
        return task.dueDate === today;
      }
      if (activeTab === 'overdue') {
        return isOverdue(task, today);
      }
      if (activeTab === 'upcoming') {
        return task.dueDate && task.dueDate > today;
      }
      return true;
    });

    const searchFiltered = tabFiltered.filter((task) => {
      return task.title.toLowerCase().includes(searchTerm.toLowerCase().trim());
    });

    return searchFiltered.sort((firstTask, secondTask) => {
      const directionMultiplier = sortState.direction === 'asc' ? 1 : -1;

      if (sortState.key === 'status') {
        const first = firstTask.status === 'open' ? 0 : 1;
        const second = secondTask.status === 'open' ? 0 : 1;
        return (first - second) * directionMultiplier;
      }

      if (sortState.key === 'title') {
        return (
          firstTask.title.localeCompare(secondTask.title, undefined, { sensitivity: 'base' }) *
          directionMultiplier
        );
      }

      if (sortState.key === 'type') {
        return firstTask.type.localeCompare(secondTask.type) * directionMultiplier;
      }

      if (sortState.key === 'associated') {
        const firstName = firstTask.contact?.name ?? '';
        const secondName = secondTask.contact?.name ?? '';
        return firstName.localeCompare(secondName) * directionMultiplier;
      }

      if (sortState.key === 'priority') {
        const firstPriority = priorityOrder[firstTask.priority ?? 'null'];
        const secondPriority = priorityOrder[secondTask.priority ?? 'null'];
        return (secondPriority - firstPriority) * directionMultiplier;
      }

      const firstDue = `${firstTask.dueDate ?? '9999-12-31'}-${firstTask.dueTime ?? '23:59'}`;
      const secondDue = `${secondTask.dueDate ?? '9999-12-31'}-${secondTask.dueTime ?? '23:59'}`;
      return firstDue.localeCompare(secondDue) * directionMultiplier;
    });
  }, [tasks, activeSidebarFilter, activeTab, today, weekEnd, searchTerm, sortState]);

  const allVisibleIds = filteredAndSortedTasks.map((task) => task.id);
  const selectedTaskSet = useMemo(() => new Set(selectedTaskIds), [selectedTaskIds]);
  const selectedTasks = useMemo(
    () => tasks.filter((task) => selectedTaskSet.has(task.id)),
    [tasks, selectedTaskSet]
  );
  const selectedCount = selectedTasks.length;
  const selectedOpenCount = selectedTasks.filter((task) => task.status === 'open').length;
  const selectedCompleteCount = selectedCount - selectedOpenCount;
  const allVisibleSelected =
    allVisibleIds.length > 0 && allVisibleIds.every((id) => selectedTaskSet.has(id));
  const someVisibleSelected =
    !allVisibleSelected && allVisibleIds.some((id) => selectedTaskSet.has(id));

  useEffect(() => {
    if (!selectAllRef.current) {
      return;
    }

    selectAllRef.current.indeterminate = someVisibleSelected;
  }, [someVisibleSelected]);

  const handleSort = (key) => {
    setSortState((current) => {
      if (current.key === key) {
        return {
          key,
          direction: current.direction === 'asc' ? 'desc' : 'asc',
        };
      }

      return { key, direction: 'asc' };
    });
  };

  const toggleTaskSelection = (taskId) => {
    setSelectedTaskIds((current) => {
      if (current.includes(taskId)) {
        return current.filter((id) => id !== taskId);
      }
      return [...current, taskId];
    });
  };

  const toggleSelectAll = () => {
    if (allVisibleSelected) {
      setSelectedTaskIds((current) => current.filter((id) => !allVisibleIds.includes(id)));
      return;
    }

    setSelectedTaskIds((current) => {
      const next = new Set(current);
      allVisibleIds.forEach((id) => next.add(id));
      return [...next];
    });
  };

  const handleSetSelectedStatus = async (status) => {
    if (selectedCount === 0) {
      return;
    }

    let hasChanges = false;
    const nextTasks = tasks.map((task) => {
      if (!selectedTaskSet.has(task.id) || task.status === status) {
        return task;
      }

      hasChanges = true;
      return {
        ...task,
        status,
      };
    });

    if (!hasChanges) {
      return;
    }

    await persistTasks(nextTasks);
  };

  const toggleStatus = async (taskId) => {
    const nextTasks = tasks.map((task) => {
      if (task.id !== taskId) {
        return task;
      }

      const nextStatus = task.status === 'open' ? 'complete' : 'open';
      return {
        ...task,
        status: nextStatus,
      };
    });

    await persistTasks(nextTasks);
  };

  const openCreatePanel = () => {
    setPanelMode('create');
    setPanelTask(null);
    setPanelOpen(true);
  };

  const openEditPanel = (task) => {
    setPanelMode('edit');
    setPanelTask(task);
    setPanelOpen(true);
  };

  const closePanel = () => {
    setPanelOpen(false);
    setPanelTask(null);
  };

  const handleSaveTask = async (incomingTask, { addAnother }) => {
    if (panelMode === 'edit' && panelTask) {
      const nextTasks = tasks.map((task) => {
        if (task.id === panelTask.id) {
          return {
            ...task,
            ...incomingTask,
            id: panelTask.id,
            createdAt: panelTask.createdAt,
          };
        }
        return task;
      });

      await persistTasks(nextTasks);
      closePanel();
      return;
    }

    const newTask = {
      ...incomingTask,
      id: uuidv4(),
      createdAt: new Date().toISOString(),
      status: 'open',
    };

    const nextTasks = [newTask, ...tasks];
    await persistTasks(nextTasks);

    if (!addAnother) {
      closePanel();
    }
  };

  const handleDeleteTask = async (taskId) => {
    const shouldDelete = window.confirm('Delete this task?');
    if (!shouldDelete) {
      return;
    }

    const nextTasks = tasks.filter((task) => task.id !== taskId);
    await persistTasks(nextTasks);
    closePanel();
  };

  const handleDeleteSelectedTasks = async () => {
    if (selectedCount === 0) {
      return;
    }

    const shouldDelete = window.confirm(
      `Delete ${selectedCount} selected task${selectedCount > 1 ? 's' : ''}?`
    );
    if (!shouldDelete) {
      return;
    }

    const nextTasks = tasks.filter((task) => !selectedTaskSet.has(task.id));
    await persistTasks(nextTasks);
    setSelectedTaskIds([]);
  };

  const handleCreateContact = async (contact) => {
    const nextContacts = [contact, ...contacts];
    await persistContacts(nextContacts);
    return contact;
  };

  const handleUpdateContact = async (updatedContact) => {
    const existingContact = contacts.find((contact) => contact.id === updatedContact.id);
    if (!existingContact) {
      return;
    }

    const nextContacts = contacts.map((contact) => {
      return contact.id === updatedContact.id ? updatedContact : contact;
    });
    const contactsSaved = await persistContacts(nextContacts);
    if (!contactsSaved) {
      return;
    }

    let touchedTasks = false;
    const nextTasks = tasks.map((task) => {
      if (task.contact?.name !== existingContact.name) {
        return task;
      }

      touchedTasks = true;
      return {
        ...task,
        contact: {
          name: updatedContact.name,
          avatarInitials: updatedContact.avatarInitials,
          avatarColor: updatedContact.avatarColor,
        },
      };
    });

    if (touchedTasks) {
      await persistTasks(nextTasks);
    }
  };

  const handleDeleteContact = async (contactId) => {
    const contactToDelete = contacts.find((contact) => contact.id === contactId);
    if (!contactToDelete) {
      return;
    }

    const shouldDelete = window.confirm(
      `Delete contact "${contactToDelete.name}"? Tasks tied to this contact will become Unassigned.`
    );
    if (!shouldDelete) {
      return;
    }

    const nextContacts = contacts.filter((contact) => contact.id !== contactId);
    const contactsSaved = await persistContacts(nextContacts);
    if (!contactsSaved) {
      return;
    }

    let touchedTasks = false;
    const nextTasks = tasks.map((task) => {
      if (task.contact?.name !== contactToDelete.name) {
        return task;
      }

      touchedTasks = true;
      return {
        ...task,
        contact: {
          name: 'Unassigned',
          avatarInitials: 'NA',
          avatarColor: '#CBD5E1',
        },
      };
    });

    if (touchedTasks) {
      await persistTasks(nextTasks);
    }
  };

  return (
    <div className="flex min-h-screen flex-col bg-white text-[#33475B] md:flex-row">
      <Sidebar
        counts={counts}
        activeFilter={activeSidebarFilter}
        onFilterChange={setActiveSidebarFilter}
        moreOpen={moreOpen}
        onToggleMore={() => setMoreOpen((open) => !open)}
      />

      <main className="flex min-h-screen flex-1 flex-col overflow-hidden">
        <div className="border-b border-hubspot-border px-8 pb-4 pt-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <h1 className="text-3xl font-semibold text-[#213343]">Tasks</h1>

            <div className="flex flex-wrap items-center gap-2">
              <details className="dropdown dropdown-end">
                <summary className="btn btn-ghost btn-sm normal-case text-[#425B76]">Actions</summary>
                <ul className="menu dropdown-content z-[1] mt-2 w-44 rounded-box border border-hubspot-border bg-white p-2 shadow">
                  <li>
                    <button type="button" onClick={() => setContactsPanelOpen(true)}>
                      Manage contacts
                    </button>
                  </li>
                  <li>
                    <button
                      type="button"
                      onClick={() => handleSetSelectedStatus('complete')}
                      disabled={selectedOpenCount === 0}
                    >
                      Check selected
                    </button>
                  </li>
                  <li>
                    <button
                      type="button"
                      onClick={() => handleSetSelectedStatus('open')}
                      disabled={selectedCompleteCount === 0}
                    >
                      Uncheck selected
                    </button>
                  </li>
                  <li>
                    <button
                      type="button"
                      onClick={handleDeleteSelectedTasks}
                      disabled={selectedCount === 0}
                    >
                      Delete selected
                    </button>
                  </li>
                </ul>
              </details>
              <button
                type="button"
                onClick={openCreatePanel}
                className="btn btn-sm border-0 bg-hubspot-orange normal-case text-white hover:bg-[#EB6848]"
              >
                Create task
              </button>
              <button
                type="button"
                onClick={() => setContactsPanelOpen(true)}
                className="btn btn-sm border border-hubspot-border bg-white normal-case text-[#425B76] hover:bg-[#F5F8FA]"
              >
                <UserCircleIcon className="h-4 w-4" />
                Contacts
              </button>
            </div>
          </div>

          <div className="mt-5 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-center gap-1 border-b border-hubspot-border">
              {tabOptions.map((tab) => {
                const isActive = activeTab === tab.key;
                return (
                  <button
                    key={tab.key}
                    type="button"
                    onClick={() => setActiveTab(tab.key)}
                    className={`border-b-2 px-4 py-2 text-sm font-medium transition ${
                      isActive
                        ? 'border-hubspot-teal text-hubspot-teal'
                        : 'border-transparent text-[#5B708B] hover:text-[#33475B]'
                    }`}
                  >
                    {tab.label}
                  </button>
                );
              })}
            </div>

            <label className="input input-bordered flex h-10 w-full max-w-xs items-center gap-2 border-hubspot-border bg-white">
              <MagnifyingGlassIcon className="h-4 w-4 text-slate-400" />
              <input
                type="text"
                className="grow text-sm"
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                placeholder="Search for a task"
              />
            </label>
          </div>
        </div>

        <div className="flex-1 overflow-auto p-6">
          {error ? (
            <div className="mb-4 rounded border border-[#FECACA] bg-[#FEF2F2] px-4 py-3 text-sm text-[#B42318]">
              {error}
            </div>
          ) : null}

          {selectedCount > 0 ? (
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded border border-hubspot-border bg-[#FAFBFC] px-4 py-3">
              <p className="text-sm font-medium text-[#33475B]">
                {selectedCount} selected
              </p>
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  className="btn btn-sm border border-hubspot-border bg-white normal-case text-[#425B76] hover:bg-[#F5F8FA]"
                  onClick={() => handleSetSelectedStatus('complete')}
                  disabled={selectedOpenCount === 0}
                >
                  Check selected
                </button>
                <button
                  type="button"
                  className="btn btn-sm border border-hubspot-border bg-white normal-case text-[#425B76] hover:bg-[#F5F8FA]"
                  onClick={() => handleSetSelectedStatus('open')}
                  disabled={selectedCompleteCount === 0}
                >
                  Uncheck selected
                </button>
                <button
                  type="button"
                  className="btn btn-sm border border-[#F97066] bg-white normal-case text-[#B42318] hover:bg-[#FEF2F2]"
                  onClick={handleDeleteSelectedTasks}
                >
                  Delete selected
                </button>
                <button
                  type="button"
                  className="btn btn-sm btn-ghost normal-case text-[#5B708B]"
                  onClick={() => setSelectedTaskIds([])}
                >
                  Clear
                </button>
              </div>
            </div>
          ) : null}

          <div className="overflow-hidden rounded-lg border border-hubspot-border">
            {loading ? (
              <div className="flex h-72 items-center justify-center text-sm text-[#5B708B]">
                Loading tasks...
              </div>
            ) : filteredAndSortedTasks.length === 0 ? (
              <div className="flex h-80 flex-col items-center justify-center gap-3 bg-white text-center">
                <div className="rounded-full bg-[#F5F8FA] p-4">
                  <ClipboardDocumentCheckIcon className="h-8 w-8 text-[#8A9BA8]" />
                </div>
                <p className="text-sm font-medium text-[#425B76]">
                  {activeTab === 'completed'
                    ? 'No completed tasks yet.'
                    : "You're all caught up on tasks. Nice work."}
                </p>
              </div>
            ) : (
              <table className="w-full border-collapse">
                <thead className="bg-[#FAFBFC]">
                  <tr>
                    <th className="w-10 px-4 py-3 text-left">
                      <input
                        ref={selectAllRef}
                        type="checkbox"
                        className="checkbox checkbox-sm rounded border-hubspot-border"
                        checked={allVisibleSelected}
                        onChange={toggleSelectAll}
                        aria-label="Select all visible tasks"
                      />
                    </th>
                    <th className="px-4 py-3 text-left">
                      <SortHeader
                        label="Status"
                        sortKey="status"
                        activeSort={sortState}
                        onSort={handleSort}
                      />
                    </th>
                    <th className="px-4 py-3 text-left">
                      <SortHeader
                        label="Title"
                        sortKey="title"
                        activeSort={sortState}
                        onSort={handleSort}
                      />
                    </th>
                    <th className="px-4 py-3 text-left">
                      <SortHeader
                        label="Type"
                        sortKey="type"
                        activeSort={sortState}
                        onSort={handleSort}
                      />
                    </th>
                    <th className="px-4 py-3 text-left">
                      <SortHeader
                        label="Associated with"
                        sortKey="associated"
                        activeSort={sortState}
                        onSort={handleSort}
                      />
                    </th>
                    <th className="px-4 py-3 text-left">
                      <SortHeader
                        label="Priority"
                        sortKey="priority"
                        activeSort={sortState}
                        onSort={handleSort}
                      />
                    </th>
                    <th className="px-4 py-3 text-left">
                      <SortHeader
                        label="Due date"
                        sortKey="dueDate"
                        activeSort={sortState}
                        onSort={handleSort}
                      />
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {filteredAndSortedTasks.map((task) => {
                    const completed = task.status === 'complete';
                    const overdue = isOverdue(task, today);

                    return (
                      <tr
                        key={task.id}
                        className={`border-t border-hubspot-border transition hover:bg-[#F5F8FA] ${
                          completed ? 'bg-[#FAFBFC] text-[#8A9BA8]' : 'text-[#33475B]'
                        }`}
                      >
                        <td className="px-4 py-3 align-middle">
                          <input
                            type="checkbox"
                            className="checkbox checkbox-sm rounded border-hubspot-border"
                            checked={selectedTaskIds.includes(task.id)}
                            onChange={() => toggleTaskSelection(task.id)}
                            aria-label={`Select task ${task.title}`}
                          />
                        </td>

                        <td className="px-4 py-3 align-middle">
                          <button
                            type="button"
                            onClick={() => toggleStatus(task.id)}
                            className={`flex h-6 w-6 items-center justify-center rounded-full border transition ${
                              completed
                                ? 'border-hubspot-teal bg-hubspot-teal text-white'
                                : 'border-slate-300 text-transparent hover:border-hubspot-teal hover:text-hubspot-teal'
                            }`}
                            aria-label={
                              completed ? 'Mark task as open' : 'Mark task as complete'
                            }
                          >
                            <CheckIcon className="h-4 w-4" />
                          </button>
                        </td>

                        <td className="px-4 py-3 align-middle">
                          <div className="flex items-center justify-between gap-2">
                            <button
                              type="button"
                              onClick={() => openEditPanel(task)}
                              className={`text-left text-sm font-medium transition ${
                                completed
                                  ? 'text-[#8A9BA8] line-through'
                                  : 'text-[#213343] hover:text-hubspot-teal'
                              }`}
                            >
                              {task.title}
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteTask(task.id)}
                              className="rounded p-1 text-slate-400 transition hover:bg-[#F5F8FA] hover:text-[#B42318]"
                              aria-label="Delete task"
                            >
                              <TrashIcon className="h-4 w-4" />
                            </button>
                          </div>
                        </td>

                        <td className="px-4 py-3 align-middle">
                          <span className="inline-flex items-center text-[#5B708B]">
                            {getTypeIcon(task.type)}
                          </span>
                        </td>

                        <td className="px-4 py-3 align-middle">
                          <button
                            type="button"
                            className="flex items-center gap-2 text-sm text-hubspot-teal hover:underline"
                          >
                            <span
                              className="inline-flex h-7 w-7 items-center justify-center rounded-full text-xs font-semibold text-white"
                              style={{ backgroundColor: task.contact?.avatarColor || '#CBD5E1' }}
                            >
                              {task.contact?.avatarInitials || 'NA'}
                            </span>
                            <span className={completed ? 'line-through' : ''}>
                              {task.contact?.name || 'Unassigned'}
                            </span>
                          </button>
                        </td>

                        <td className="px-4 py-3 align-middle">
                          {task.priority ? (
                            <span className="inline-flex items-center gap-2 text-sm text-[#425B76]">
                              <span
                                className="h-2.5 w-2.5 rounded-full"
                                style={{ backgroundColor: priorityColor(task.priority) }}
                              />
                              {task.priority}
                            </span>
                          ) : (
                            <span className="text-sm text-slate-400">None</span>
                          )}
                        </td>

                        <td className="px-4 py-3 align-middle">
                          <span
                            className={`text-sm ${
                              overdue && !completed ? 'font-medium text-[#B42318]' : 'text-[#5B708B]'
                            }`}
                          >
                            {formatDisplayDate(task.dueDate)}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </main>

      <TaskPanel
        isOpen={panelOpen}
        mode={panelMode}
        task={panelTask}
        contacts={contacts}
        onClose={closePanel}
        onDelete={handleDeleteTask}
        onCreateContact={handleCreateContact}
        onSave={handleSaveTask}
      />

      <ContactsPanel
        isOpen={contactsPanelOpen}
        contacts={contacts}
        onClose={() => setContactsPanelOpen(false)}
        onCreate={handleCreateContact}
        onUpdate={handleUpdateContact}
        onDelete={handleDeleteContact}
      />
    </div>
  );
}
