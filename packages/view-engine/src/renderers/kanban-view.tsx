/**
 * Kanban View Renderer
 *
 * Renders a state-machine workflow as a Kanban board.
 * Groups records by state field value and supports drag-and-drop transitions.
 *
 * @version 1.0.0
 */

import * as React from "react";
import {
  DndContext,
  DragOverlay,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  useDroppable,
  type DragEndEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy, useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Card } from "@afenda/ui-core/primitives/card";
import { Badge } from "@afenda/ui-core/primitives/badge";
import { cn } from "@afenda/ui-core/lib/utils";
import type { ModelDef } from "../metadata/model-def";
import type { ViewDef } from "../metadata/view-kind";

export interface KanbanViewProps {
  /** Model definition (must have states defined). */
  model: ModelDef;
  /** View definition (kind: "kanban"). */
  view: ViewDef;
  /** Array of records to display. */
  data: unknown[];
  /** Called when a record is moved to a new state. */
  onStateChange?: (record: unknown, newState: string) => Promise<void>;
  /** Called when a record is clicked. */
  onRecordClick?: (record: unknown) => void;
  /** Additional CSS classes. */
  className?: string;
}

/**
 * Validates if a state transition is allowed by the state machine.
 */
function isValidTransition(model: ModelDef, fromState: string, toState: string): boolean {
  if (!model.states) return false;
  const state = model.states.states.find((s) => s.value === fromState);
  if (!state?.transitions) return false;
  return state.transitions.includes(toState);
}

/**
 * Kanban View Renderer.
 *
 * Renders a complete Kanban board from ModelDef + ViewDef.
 * Requires ModelDef.states to be defined.
 */
export function KanbanView({
  model,
  view,
  data,
  onStateChange,
  onRecordClick,
  className,
}: KanbanViewProps) {
  const [activeId, setActiveId] = React.useState<string | null>(null);

  const sensors = useSensors(useSensor(PointerSensor), useSensor(KeyboardSensor));

  if (!model.states) {
    return (
      <div className="text-sm text-muted-foreground">
        No state machine defined for model "{model.name}". Kanban view requires ModelDef.states.
      </div>
    );
  }

  const stateField = model.states.field;
  const states = model.states.states;

  // Group records by state
  const recordsByState = React.useMemo(() => {
    const groups = new Map<string, Array<Record<string, unknown> & { _kanbanId: string }>>();

    // Initialize all states with empty arrays
    states.forEach((state) => {
      groups.set(state.value, []);
    });

    // Group records and assign unique IDs for DnD
    (data as Record<string, unknown>[]).forEach((record, idx) => {
      const stateValue = String(record[stateField] ?? "");
      const recordId = String(record.id ?? idx);
      if (groups.has(stateValue)) {
        groups.get(stateValue)!.push({ ...record, _kanbanId: recordId });
      }
    });

    return groups;
  }, [data, stateField, states]);

  // Determine which fields to display in cards
  const displayFields = view.fields ?? Object.keys(model.fields).slice(0, 4);

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(String(event.active.id));
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);

    if (!over || !onStateChange) return;

    const recordId = String(active.id);
    const targetState = String(over.id);

    // Find the record and its current state
    let record: Record<string, unknown> | undefined;
    let currentState: string | undefined;

    for (const [state, records] of recordsByState.entries()) {
      const found = records.find((r) => r._kanbanId === recordId);
      if (found) {
        record = found;
        currentState = state;
        break;
      }
    }

    if (!record || !currentState || currentState === targetState) return;

    // Validate transition
    if (!isValidTransition(model, currentState, targetState)) {
      console.warn(`[KanbanView] Invalid transition: ${currentState} → ${targetState}`);
      return;
    }

    // Call onStateChange for valid transitions
    await onStateChange(record, targetState);
  };

  const activeRecord = React.useMemo(() => {
    if (!activeId) return null;
    for (const records of recordsByState.values()) {
      const found = records.find((r) => r._kanbanId === activeId);
      if (found) return found;
    }
    return null;
  }, [activeId, recordsByState]);

  const dragSourceState = React.useMemo(() => {
    if (!activeId) return null;
    for (const [stateValue, records] of recordsByState.entries()) {
      if (records.some((r) => r._kanbanId === activeId)) {
        return stateValue;
      }
    }
    return null;
  }, [activeId, recordsByState]);

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className={cn("flex gap-4 overflow-x-auto pb-4", className)}>
        {states.map((state) => {
          // Skip folded states unless they have records
          if (state.folded && (recordsByState.get(state.value)?.length ?? 0) === 0) {
            return null;
          }

          const records = recordsByState.get(state.value) ?? [];
          const recordIds = records.map((r) => r._kanbanId);

          const dropAllowed =
            !dragSourceState ||
            dragSourceState === state.value ||
            isValidTransition(model, dragSourceState, state.value);

          return (
            <KanbanColumn
              key={state.value}
              state={state}
              records={records}
              recordIds={recordIds}
              model={model}
              displayFields={displayFields}
              onRecordClick={onRecordClick}
              isDragging={!!activeId}
              dropAllowed={dropAllowed}
            />
          );
        })}
      </div>

      <DragOverlay>
        {activeRecord && (
          <KanbanCard
            record={activeRecord}
            model={model}
            displayFields={displayFields}
            isDragging
          />
        )}
      </DragOverlay>
    </DndContext>
  );
}

// ---------------------------------------------------------------------------
// Kanban Column (Droppable)
// ---------------------------------------------------------------------------

interface KanbanColumnProps {
  state: { value: string; label: string; folded?: boolean; transitions?: string[] };
  records: Array<Record<string, unknown> & { _kanbanId: string }>;
  recordIds: string[];
  model: ModelDef;
  displayFields: string[];
  onRecordClick?: (record: unknown) => void;
  /** True while any card is being dragged (used for drop-target affordances). */
  isDragging: boolean;
  /** Whether a drop from the current drag source is allowed on this column. */
  dropAllowed: boolean;
}

function KanbanColumn({
  state,
  records,
  recordIds,
  model,
  displayFields,
  onRecordClick,
  isDragging,
  dropAllowed,
}: KanbanColumnProps) {
  const { setNodeRef, isOver } = useDroppable({
    id: state.value,
    data: { type: "column", state: state.value },
  });

  return (
    <div className="flex min-w-[280px] flex-col gap-3">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-sm">{state.label}</h3>
        <Badge variant="secondary" className="text-xs">
          {records.length}
        </Badge>
      </div>

      <SortableContext items={recordIds} strategy={verticalListSortingStrategy}>
        <div
          ref={setNodeRef}
          className={cn(
            "space-y-2 min-h-[100px] rounded-md border-2 border-dashed p-2 transition-colors",
            isDragging &&
              isOver &&
              !dropAllowed &&
              "border-destructive bg-destructive/5 cursor-not-allowed",
            isDragging && isOver && dropAllowed && "border-primary bg-primary/5",
            (!isDragging || !isOver) && "border-muted",
            isDragging && !isOver && !dropAllowed && "opacity-60"
          )}
        >
          {records.map((record) => (
            <DraggableKanbanCard
              key={record._kanbanId}
              record={record}
              model={model}
              displayFields={displayFields}
              onClick={() => onRecordClick?.(record)}
            />
          ))}
        </div>
      </SortableContext>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Draggable Kanban Card
// ---------------------------------------------------------------------------

interface DraggableKanbanCardProps {
  record: Record<string, unknown> & { _kanbanId: string };
  model: ModelDef;
  displayFields: string[];
  onClick?: () => void;
}

function DraggableKanbanCard({ record, model, displayFields, onClick }: DraggableKanbanCardProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: record._kanbanId,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      <KanbanCard
        record={record}
        model={model}
        displayFields={displayFields}
        onClick={onClick}
        isDragging={isDragging}
      />
    </div>
  );
}

// ---------------------------------------------------------------------------
// Kanban Card
// ---------------------------------------------------------------------------

interface KanbanCardProps {
  record: Record<string, unknown>;
  model: ModelDef;
  displayFields: string[];
  onClick?: () => void;
  isDragging?: boolean;
}

function KanbanCard({ record, model, displayFields, onClick, isDragging }: KanbanCardProps) {
  return (
    <Card
      className={cn(
        "p-3 cursor-pointer hover:shadow-md transition-shadow",
        isDragging && "shadow-lg ring-2 ring-primary",
        onClick && "cursor-pointer"
      )}
      onClick={onClick}
    >
      <div className="space-y-2">
        {displayFields.map((fieldName) => {
          const fieldDef = model.fields[fieldName];
          if (!fieldDef) return null;

          const value = record[fieldName];
          if (value === null || value === undefined) return null;

          return (
            <div key={fieldName} className="text-sm">
              <span className="font-medium text-muted-foreground">{fieldDef.label}: </span>
              <span>{String(value)}</span>
            </div>
          );
        })}
      </div>
    </Card>
  );
}
