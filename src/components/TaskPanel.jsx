import { useEffect, useMemo, useRef, useState } from 'react';
import {
  ChevronDownIcon,
  MagnifyingGlassIcon,
  TrashIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';
import { v4 as uuidv4 } from 'uuid';
import DatePicker from './DatePicker';

const priorityOptions = [
  { value: 'High', color: '#F97066' },
  { value: 'Medium', color: '#FEC84B' },
  { value: 'Low', color: '#A0AEC0' },
  { value: 'None', color: '#CBD5E1' },
];

const emptyForm = {
  title: '',
  type: 'Call',
  priority: 'Medium',
  contactId: '',
  dueDate: '',
  dueTime: '08:00',
  notes: '',
};

const contactColorPalette = ['#64B5F6', '#00A4BD', '#7C3AED', '#F97066', '#F59E0B', '#14B8A6'];

function getInitials(name) {
  const parts = name
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '');

  if (parts.length === 0) {
    return 'NA';
  }

  if (parts.length === 1) {
    return `${parts[0]}${parts[0]}`;
  }

  return parts.join('');
}

function getColorForName(name) {
  const value = name.trim().toLowerCase();
  let hash = 0;

  for (let index = 0; index < value.length; index += 1) {
    hash = (hash << 5) - hash + value.charCodeAt(index);
    hash |= 0;
  }

  return contactColorPalette[Math.abs(hash) % contactColorPalette.length];
}

function PriorityOption({ option, active, onSelect }) {
  return (
    <button
      type="button"
      onClick={() => onSelect(option.value)}
      className={`flex w-full items-center gap-2 rounded px-3 py-2 text-sm ${
        active ? 'bg-[#F5F8FA] font-medium text-[#33475B]' : 'text-[#425B76] hover:bg-[#F5F8FA]'
      }`}
    >
      <span
        className="h-2.5 w-2.5 rounded-full"
        style={{ backgroundColor: option.color }}
        aria-hidden="true"
      />
      {option.value}
    </button>
  );
}

export default function TaskPanel({
  isOpen,
  mode,
  task,
  contacts,
  onClose,
  onDelete,
  onCreateContact,
  onSave,
}) {
  const [form, setForm] = useState(emptyForm);
  const [contactQuery, setContactQuery] = useState('');
  const [contactOpen, setContactOpen] = useState(false);
  const [creatingContact, setCreatingContact] = useState(false);
  const [priorityOpen, setPriorityOpen] = useState(false);
  const [error, setError] = useState('');
  const [selectedContactSnapshot, setSelectedContactSnapshot] = useState(null);
  const contactFieldRef = useRef(null);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    if (mode === 'edit' && task) {
      const matchedContact = contacts.find((contact) => {
        return contact.name.toLowerCase() === task.contact?.name?.toLowerCase();
      });

      const priorityValue = task.priority ?? 'None';

      setForm({
        title: task.title ?? '',
        type: task.type ?? 'Call',
        priority: priorityValue,
        contactId: matchedContact?.id ?? '',
        dueDate: task.dueDate ?? '',
        dueTime: task.dueTime ?? '08:00',
        notes: task.notes ?? '',
      });
      setContactQuery(matchedContact?.name ?? task.contact?.name ?? '');
      setSelectedContactSnapshot(matchedContact ?? null);
      setError('');
      setContactOpen(false);
      setPriorityOpen(false);
      setCreatingContact(false);
      return;
    }

    setForm(emptyForm);
    setContactQuery('');
    setError('');
    setSelectedContactSnapshot(null);
    setContactOpen(false);
    setPriorityOpen(false);
    setCreatingContact(false);
  }, [isOpen, mode, task]);

  const selectedPriority =
    priorityOptions.find((option) => option.value === form.priority) ?? priorityOptions[1];

  const trimmedContactQuery = contactQuery.trim();
  const normalizedContactQuery = trimmedContactQuery.toLowerCase();

  const filteredContacts = useMemo(() => {
    if (!normalizedContactQuery) {
      return contacts;
    }

    return contacts.filter((contact) =>
      contact.name.toLowerCase().includes(normalizedContactQuery)
    );
  }, [normalizedContactQuery, contacts]);

  const exactMatchContact = useMemo(() => {
    if (!normalizedContactQuery) {
      return null;
    }

    return (
      contacts.find((contact) => contact.name.toLowerCase() === normalizedContactQuery) ?? null
    );
  }, [contacts, normalizedContactQuery]);

  const canCreateContact = Boolean(trimmedContactQuery && !exactMatchContact && onCreateContact);

  useEffect(() => {
    if (!isOpen || !contactOpen) {
      return undefined;
    }

    const handlePointerDown = (event) => {
      if (contactFieldRef.current && !contactFieldRef.current.contains(event.target)) {
        setContactOpen(false);
      }
    };

    const handleEscape = (event) => {
      if (event.key === 'Escape') {
        setContactOpen(false);
      }
    };

    document.addEventListener('pointerdown', handlePointerDown);
    document.addEventListener('keydown', handleEscape);

    return () => {
      document.removeEventListener('pointerdown', handlePointerDown);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [contactOpen, isOpen]);

  const handleFieldChange = (field, value) => {
    setForm((current) => ({ ...current, [field]: value }));
  };

  const handleCreateInlineContact = async () => {
    if (!canCreateContact || creatingContact) {
      return;
    }

    const payload = {
      id: uuidv4(),
      name: trimmedContactQuery,
      avatarInitials: getInitials(trimmedContactQuery),
      avatarColor: getColorForName(trimmedContactQuery),
    };

    try {
      setCreatingContact(true);
      const createdContact = (await onCreateContact(payload)) ?? payload;
      setContactQuery(createdContact.name);
      setSelectedContactSnapshot(createdContact);
      handleFieldChange('contactId', createdContact.id);
      setContactOpen(false);
      setError('');
    } finally {
      setCreatingContact(false);
    }
  };

  const buildTaskPayload = () => {
    if (!form.title.trim()) {
      setError('Task title is required.');
      return null;
    }

    if (!form.type) {
      setError('Task type is required.');
      return null;
    }

    if (!form.priority) {
      setError('Priority is required.');
      return null;
    }

    const selectedContact =
      contacts.find((contact) => contact.id === form.contactId) ??
      contacts.find((contact) => {
        return contact.name.toLowerCase() === normalizedContactQuery;
      }) ??
      selectedContactSnapshot ??
      null;

    const fallbackContact = {
      name: 'Unassigned',
      avatarInitials: 'NA',
      avatarColor: '#CBD5E1',
    };

    const payload = {
      id: task?.id,
      title: form.title.trim(),
      type: form.type,
      priority: form.priority === 'None' ? null : form.priority,
      dueDate: form.dueDate,
      dueTime: form.dueTime,
      notes: form.notes,
      status: task?.status ?? 'open',
      contact: selectedContact
        ? {
            name: selectedContact.name,
            avatarInitials: selectedContact.avatarInitials,
            avatarColor: selectedContact.avatarColor,
          }
        : fallbackContact,
      createdAt: task?.createdAt,
    };

    setError('');
    return payload;
  };

  const handleSave = async (addAnother) => {
    const payload = buildTaskPayload();
    if (!payload) {
      return;
    }

    await onSave(payload, { addAnother });

    if (mode === 'create' && addAnother) {
      setForm(emptyForm);
      setContactQuery('');
      setError('');
      setSelectedContactSnapshot(null);
      setContactOpen(false);
      setPriorityOpen(false);
      setCreatingContact(false);
    }
  };

  const panelTitle = mode === 'edit' ? 'Edit task' : 'Create task';

  return (
    <div className={`fixed inset-0 z-50 ${isOpen ? '' : 'pointer-events-none'}`}>
      <button
        type="button"
        aria-label="Close panel"
        onClick={onClose}
        className={`absolute inset-0 bg-[#0B1D2A]/20 transition-opacity ${
          isOpen ? 'opacity-100' : 'opacity-0'
        }`}
      />

      <aside
        className={`absolute right-0 top-0 flex h-full w-full max-w-[460px] flex-col bg-white shadow-[0_0_24px_rgba(11,29,42,0.18)] transition-transform duration-300 ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        <div className="flex items-center justify-between bg-hubspot-teal px-5 py-4 text-white">
          <h2 className="text-lg font-semibold">{panelTitle}</h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded p-1 transition hover:bg-white/15"
            aria-label="Close"
          >
            <XMarkIcon className="h-5 w-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-5">
          <div className="space-y-4">
            <div>
              <label htmlFor="taskTitle" className="mb-1 block text-sm font-medium text-[#33475B]">
                Task Title *
              </label>
              <input
                id="taskTitle"
                type="text"
                className="input input-bordered w-full border-hubspot-border"
                value={form.title}
                onChange={(event) => handleFieldChange('title', event.target.value)}
                placeholder="Call Charlotte Arrowood"
              />
            </div>

            <div>
              <label htmlFor="taskType" className="mb-1 block text-sm font-medium text-[#33475B]">
                Task Type *
              </label>
              <select
                id="taskType"
                className="select select-bordered w-full border-hubspot-border"
                value={form.type}
                onChange={(event) => handleFieldChange('type', event.target.value)}
              >
                <option value="Call">Call</option>
                <option value="Email">Email</option>
                <option value="To-do">To-do</option>
              </select>
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-[#33475B]">Priority *</label>
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setPriorityOpen((open) => !open)}
                  className="flex w-full items-center justify-between rounded-lg border border-hubspot-border px-3 py-2 text-sm"
                >
                  <span className="flex items-center gap-2">
                    <span
                      className="h-2.5 w-2.5 rounded-full"
                      style={{ backgroundColor: selectedPriority.color }}
                    />
                    {selectedPriority.value}
                  </span>
                  <ChevronDownIcon className="h-4 w-4 text-slate-500" />
                </button>

                {priorityOpen ? (
                  <div className="absolute z-20 mt-1 w-full rounded-lg border border-hubspot-border bg-white p-1 shadow-lg">
                    {priorityOptions.map((option) => (
                      <PriorityOption
                        key={option.value}
                        option={option}
                        active={form.priority === option.value}
                        onSelect={(value) => {
                          handleFieldChange('priority', value);
                          setPriorityOpen(false);
                        }}
                      />
                    ))}
                  </div>
                ) : null}
              </div>
            </div>

            <div>
              <label
                htmlFor="associateContact"
                className="mb-1 block text-sm font-medium text-[#33475B]"
              >
                Associate with contact
              </label>

              <div ref={contactFieldRef} className="relative">
                <div className="pointer-events-none absolute left-3 top-2.5">
                  <MagnifyingGlassIcon className="h-4 w-4 text-slate-400" />
                </div>
                <input
                  id="associateContact"
                  type="text"
                  className="input input-bordered w-full border-hubspot-border pl-9"
                  placeholder="Search contacts"
                  value={contactQuery}
                  onChange={(event) => {
                    setContactQuery(event.target.value);
                    setContactOpen(true);
                    setSelectedContactSnapshot(null);
                    handleFieldChange('contactId', '');
                  }}
                  onFocus={() => setContactOpen(true)}
                  onKeyDown={(event) => {
                    if (event.key === 'Escape') {
                      setContactOpen(false);
                    }
                  }}
                />

                {contactOpen ? (
                  <div className="absolute z-20 mt-1 max-h-48 w-full overflow-y-auto rounded-lg border border-hubspot-border bg-white shadow-lg">
                    {filteredContacts.length > 0 ? (
                      filteredContacts.map((contact) => (
                        <button
                          key={contact.id}
                          type="button"
                          className="flex w-full items-center gap-3 px-3 py-2 text-left text-sm hover:bg-[#F5F8FA]"
                          onMouseDown={(event) => {
                            event.preventDefault();
                            setContactQuery(contact.name);
                            setSelectedContactSnapshot(contact);
                            handleFieldChange('contactId', contact.id);
                            setContactOpen(false);
                          }}
                        >
                          <span
                            className="inline-flex h-7 w-7 items-center justify-center rounded-full text-xs font-semibold text-white"
                            style={{ backgroundColor: contact.avatarColor }}
                          >
                            {contact.avatarInitials}
                          </span>
                          <span className="text-[#33475B]">{contact.name}</span>
                        </button>
                      ))
                    ) : (
                      <p className="px-3 py-2 text-sm text-slate-500">No contacts found</p>
                    )}
                    {canCreateContact ? (
                      <button
                        type="button"
                        className="w-full border-t border-hubspot-border px-3 py-2 text-left text-sm font-medium text-hubspot-teal hover:bg-[#F5F8FA] disabled:cursor-not-allowed disabled:text-slate-400"
                        onMouseDown={(event) => {
                          event.preventDefault();
                          handleCreateInlineContact();
                        }}
                        disabled={creatingContact}
                      >
                        {creatingContact
                          ? 'Creating contact...'
                          : `Create contact "${trimmedContactQuery}"`}
                      </button>
                    ) : null}
                  </div>
                ) : null}
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label htmlFor="dueDate" className="mb-1 block text-sm font-medium text-[#33475B]">
                  Due date
                </label>
                <DatePicker
                  id="dueDate"
                  value={form.dueDate}
                  onChange={(value) => handleFieldChange('dueDate', value)}
                />
              </div>
              <div>
                <label htmlFor="dueTime" className="mb-1 block text-sm font-medium text-[#33475B]">
                  Due time
                </label>
                <input
                  id="dueTime"
                  type="time"
                  className="input input-bordered w-full border-hubspot-border"
                  value={form.dueTime}
                  onChange={(event) => handleFieldChange('dueTime', event.target.value)}
                />
              </div>
            </div>

            <div>
              <label htmlFor="taskNotes" className="mb-1 block text-sm font-medium text-[#33475B]">
                Notes
              </label>
              <textarea
                id="taskNotes"
                className="textarea textarea-bordered h-28 w-full border-hubspot-border"
                value={form.notes}
                onChange={(event) => handleFieldChange('notes', event.target.value)}
                placeholder="Add details about this task"
              />
            </div>

            {error ? <p className="text-sm font-medium text-[#D92D20]">{error}</p> : null}
          </div>
        </div>

        <div className="border-t border-hubspot-border px-5 py-4">
          <div className="flex items-center justify-between gap-3">
            {mode === 'edit' ? (
              <button
                type="button"
                onClick={() => onDelete(task.id)}
                className="btn btn-ghost btn-sm gap-2 normal-case text-[#D92D20]"
              >
                <TrashIcon className="h-4 w-4" />
                Delete task
              </button>
            ) : (
              <span />
            )}

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="btn btn-ghost btn-sm normal-case text-[#425B76]"
              >
                Cancel
              </button>

              {mode === 'create' ? (
                <button
                  type="button"
                  onClick={() => handleSave(true)}
                  className="btn btn-sm border border-hubspot-teal bg-white normal-case text-hubspot-teal hover:bg-[#ECFDF9]"
                >
                  Create and add another
                </button>
              ) : null}

              <button
                type="button"
                onClick={() => handleSave(false)}
                className="btn btn-sm border-0 bg-hubspot-orange normal-case text-white hover:bg-[#EB6848]"
              >
                {mode === 'edit' ? 'Save task' : 'Create'}
              </button>
            </div>
          </div>
        </div>
      </aside>
    </div>
  );
}
