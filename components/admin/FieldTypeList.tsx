'use client'
import { useState } from 'react'
import { GripVertical, Pencil, Trash2, Plus, Check, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { toast } from 'sonner'

interface FieldItem {
  id: string
  value: string
  sortOrder: number
}

interface FieldTypeListProps {
  fieldType: string
  label: string
  items: FieldItem[]
  onAdd: (value: string) => void
  onDelete: (id: string) => void
  onEdit: (id: string, value: string) => void
  onReorder: (orderedIds: string[]) => void
}

export function FieldTypeList({
  fieldType,
  label,
  items,
  onAdd,
  onDelete,
  onEdit,
  onReorder,
}: FieldTypeListProps) {
  const [newValue, setNewValue] = useState('')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editValue, setEditValue] = useState('')
  const [localItems, setLocalItems] = useState<FieldItem[]>(items)
  const [dragging, setDragging] = useState<string | null>(null)
  const [dragOver, setDragOver] = useState<string | null>(null)

  // Sync local items when props change
  if (items.length !== localItems.length || items.some((item, i) => item.id !== localItems[i]?.id)) {
    setLocalItems(items)
  }

  const handleAdd = () => {
    if (!newValue.trim()) return
    onAdd(newValue.trim())
    setNewValue('')
  }

  const handleEditStart = (item: FieldItem) => {
    setEditingId(item.id)
    setEditValue(item.value)
  }

  const handleEditSave = () => {
    if (!editValue.trim() || !editingId) return
    onEdit(editingId, editValue.trim())
    setEditingId(null)
    setEditValue('')
  }

  const handleDeleteConfirm = (id: string) => {
    if (confirm('Delete this value?')) onDelete(id)
  }

  // Simple HTML5 drag-and-drop for reordering
  const handleDragStart = (id: string) => setDragging(id)
  const handleDragEnd = () => {
    if (!dragging || !dragOver || dragging === dragOver) {
      setDragging(null)
      setDragOver(null)
      return
    }

    const newItems = [...localItems]
    const fromIndex = newItems.findIndex(i => i.id === dragging)
    const toIndex = newItems.findIndex(i => i.id === dragOver)
    const [moved] = newItems.splice(fromIndex, 1)
    newItems.splice(toIndex, 0, moved)

    setLocalItems(newItems)
    onReorder(newItems.map(i => i.id))
    setDragging(null)
    setDragOver(null)
  }

  return (
    <div className="bg-card rounded-xl border border-border">
      <div className="px-5 py-4 border-b border-border">
        <h3 className="font-medium text-foreground">{label} Options</h3>
        <p className="text-xs text-muted-foreground mt-0.5">
          {localItems.length} values
          {localItems.length > 1 ? ' · Drag to reorder' : ''}
        </p>
      </div>

      <div className="divide-y divide-border">
        {localItems.map(item => (
          <div
            key={item.id}
            draggable
            onDragStart={() => handleDragStart(item.id)}
            onDragOver={e => { e.preventDefault(); setDragOver(item.id) }}
            onDragEnd={handleDragEnd}
            className={`flex items-center gap-3 px-5 py-3 transition-colors ${
              dragOver === item.id ? 'bg-secondary' : 'hover:bg-secondary/30'
            }`}
          >
            <div
              className="text-muted-foreground/40 hover:text-muted-foreground cursor-grab active:cursor-grabbing"
              title="Drag to reorder"
            >
              <GripVertical size={16} />
            </div>

            {editingId === item.id ? (
              <div className="flex-1 flex items-center gap-2">
                <Input
                  value={editValue}
                  onChange={e => setEditValue(e.target.value)}
                  className="h-8 text-sm"
                  autoFocus
                  onKeyDown={e => {
                    if (e.key === 'Enter') handleEditSave()
                    if (e.key === 'Escape') setEditingId(null)
                  }}
                />
                <button
                  onClick={handleEditSave}
                  className="text-foreground hover:text-foreground/80"
                  title="Save"
                >
                  <Check size={15} />
                </button>
                <button
                  onClick={() => setEditingId(null)}
                  className="text-muted-foreground hover:text-foreground"
                  title="Cancel"
                >
                  <X size={15} />
                </button>
              </div>
            ) : (
              <>
                <span className="flex-1 text-sm text-foreground">{item.value}</span>
                <button
                  onClick={() => handleEditStart(item)}
                  className="text-muted-foreground hover:text-foreground transition-colors"
                  title="Edit"
                >
                  <Pencil size={13} />
                </button>
                <button
                  onClick={() => handleDeleteConfirm(item.id)}
                  className="text-muted-foreground hover:text-destructive transition-colors"
                  title="Delete"
                >
                  <Trash2 size={13} />
                </button>
              </>
            )}
          </div>
        ))}

        {localItems.length === 0 && (
          <p className="px-5 py-4 text-sm text-muted-foreground italic">No values yet. Add one below.</p>
        )}
      </div>

      {/* Add new value */}
      <div className="px-5 py-4 border-t border-border">
        <div className="flex gap-2">
          <Input
            value={newValue}
            onChange={e => setNewValue(e.target.value)}
            placeholder={`Add new ${label.toLowerCase()} value...`}
            className="h-9 text-sm"
            onKeyDown={e => {
              if (e.key === 'Enter') {
                e.preventDefault()
                handleAdd()
              }
            }}
          />
          <Button size="sm" onClick={handleAdd} disabled={!newValue.trim()}>
            <Plus size={14} className="mr-1" />
            Add
          </Button>
        </div>
      </div>
    </div>
  )
}
