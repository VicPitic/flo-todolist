import { useEffect, useMemo, useState } from 'react';
import { CheckIcon, PencilSquareIcon, TrashIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { v4 as uuidv4 } from 'uuid';

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

  if (parts.length === 1 && parts[0].length === 1) {
    return `${parts[0]}${parts[0]}`;
  }

  return parts.join('');
}

const emptyForm = {
  name: '',
  avatarColor: '#64B5F6',
};

export default function ContactsPanel({ isOpen, contacts, onClose, onCreate, onUpdate, onDelete }) {
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!isOpen) {
      setEditingId(null);
      setForm(emptyForm);
      setError('');
    }
  }, [isOpen]);

  const sortedContacts = useMemo(() => {
    return [...contacts].sort((first, second) => first.name.localeCompare(second.name));
  }, [contacts]);

  const startEdit = (contact) => {
    setEditingId(contact.id);
    setForm({
      name: contact.name,
      avatarColor: contact.avatarColor,
    });
    setError('');
  };

  const resetForm = () => {
    setEditingId(null);
    setForm(emptyForm);
    setError('');
  };

  const submit = async () => {
    const trimmedName = form.name.trim();
    if (!trimmedName) {
      setError('Contact name is required.');
      return;
    }

    const duplicate = contacts.find((contact) => {
      if (editingId && contact.id === editingId) {
        return false;
      }
      return contact.name.toLowerCase() === trimmedName.toLowerCase();
    });

    if (duplicate) {
      setError('A contact with that name already exists.');
      return;
    }

    const payload = {
      id: editingId ?? uuidv4(),
      name: trimmedName,
      avatarInitials: getInitials(trimmedName),
      avatarColor: form.avatarColor,
    };

    if (editingId) {
      await onUpdate(payload);
    } else {
      await onCreate(payload);
    }

    resetForm();
  };

  return (
    <div className={`fixed inset-0 z-50 ${isOpen ? '' : 'pointer-events-none'}`}>
      <button
        type="button"
        aria-label="Close contacts panel"
        onClick={onClose}
        className={`absolute inset-0 bg-[#0B1D2A]/20 transition-opacity ${
          isOpen ? 'opacity-100' : 'opacity-0'
        }`}
      />

      <aside
        className={`absolute right-0 top-0 flex h-full w-full max-w-[430px] flex-col bg-white shadow-[0_0_24px_rgba(11,29,42,0.18)] transition-transform duration-300 ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        <div className="flex items-center justify-between bg-hubspot-teal px-5 py-4 text-white">
          <h2 className="text-lg font-semibold">Manage contacts</h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded p-1 transition hover:bg-white/15"
            aria-label="Close"
          >
            <XMarkIcon className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-4 border-b border-hubspot-border px-5 py-5">
          <h3 className="text-sm font-semibold text-[#33475B]">
            {editingId ? 'Edit contact' : 'Add contact'}
          </h3>

          <div>
            <label htmlFor="contactName" className="mb-1 block text-sm font-medium text-[#33475B]">
              Name
            </label>
            <input
              id="contactName"
              type="text"
              className="input input-bordered w-full border-hubspot-border"
              placeholder="Charlotte Arrowood"
              value={form.name}
              onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
            />
          </div>

          <div className="grid grid-cols-[1fr_auto] items-end gap-3">
            <div>
              <label htmlFor="contactColor" className="mb-1 block text-sm font-medium text-[#33475B]">
                Avatar color
              </label>
              <input
                id="contactColor"
                type="color"
                className="h-10 w-full rounded border border-hubspot-border bg-white"
                value={form.avatarColor}
                onChange={(event) =>
                  setForm((current) => ({ ...current, avatarColor: event.target.value }))
                }
              />
            </div>

            <div className="flex items-center gap-2 rounded border border-hubspot-border px-3 py-2">
              <span
                className="inline-flex h-7 w-7 items-center justify-center rounded-full text-xs font-semibold text-white"
                style={{ backgroundColor: form.avatarColor }}
              >
                {getInitials(form.name || 'NA')}
              </span>
              <span className="text-xs text-[#5B708B]">Preview</span>
            </div>
          </div>

          {error ? <p className="text-sm font-medium text-[#B42318]">{error}</p> : null}

          <div className="flex items-center gap-2">
            {editingId ? (
              <button
                type="button"
                onClick={resetForm}
                className="btn btn-ghost btn-sm normal-case text-[#425B76]"
              >
                Cancel edit
              </button>
            ) : null}
            <button
              type="button"
              onClick={submit}
              className="btn btn-sm border-0 bg-hubspot-orange normal-case text-white hover:bg-[#EB6848]"
            >
              {editingId ? 'Save contact' : 'Add contact'}
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-4">
          <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-[#5B708B]">Contacts</h3>

          <div className="space-y-2">
            {sortedContacts.map((contact) => {
              const isEditing = editingId === contact.id;

              return (
                <div
                  key={contact.id}
                  className="flex items-center justify-between rounded-lg border border-hubspot-border px-3 py-2"
                >
                  <div className="flex items-center gap-3">
                    <span
                      className="inline-flex h-8 w-8 items-center justify-center rounded-full text-xs font-semibold text-white"
                      style={{ backgroundColor: contact.avatarColor }}
                    >
                      {contact.avatarInitials}
                    </span>
                    <span className="text-sm text-[#33475B]">{contact.name}</span>
                  </div>

                  <div className="flex items-center gap-1">
                    {isEditing ? (
                      <span className="inline-flex items-center gap-1 px-2 text-xs font-medium text-hubspot-teal">
                        <CheckIcon className="h-4 w-4" />
                        Editing
                      </span>
                    ) : null}

                    <button
                      type="button"
                      onClick={() => startEdit(contact)}
                      className="rounded p-1.5 text-slate-500 transition hover:bg-[#F5F8FA] hover:text-[#33475B]"
                      aria-label={`Edit ${contact.name}`}
                    >
                      <PencilSquareIcon className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => onDelete(contact.id)}
                      className="rounded p-1.5 text-slate-500 transition hover:bg-[#F5F8FA] hover:text-[#B42318]"
                      aria-label={`Delete ${contact.name}`}
                    >
                      <TrashIcon className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </aside>
    </div>
  );
}
