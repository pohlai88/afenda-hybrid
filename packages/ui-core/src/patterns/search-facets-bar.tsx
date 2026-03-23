"use client";

import * as React from "react";
import { Button } from "../primitives/button";
import { Badge } from "../primitives/badge";
import { Input } from "../primitives/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../primitives/select";
import { Popover, PopoverContent, PopoverTrigger } from "../primitives/popover";
import { Plus, X, Search } from "lucide-react";
import { cn } from "../lib/utils";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type FacetOperator =
  | "="
  | "!="
  | ">"
  | ">="
  | "<"
  | "<="
  | "contains"
  | "not contains"
  | "is set"
  | "is not set";

export interface FacetFieldOption {
  /** Technical field name. */
  name: string;
  /** Display label. */
  label: string;
  /** Allowed operators (defaults to `["=", "!=", "contains"]`). */
  operators?: FacetOperator[];
  /** Optional selection values for the value step. */
  options?: Array<{ value: string; label: string }>;
}

export interface SearchFacet {
  id: string;
  fieldName: string;
  fieldLabel: string;
  operator: FacetOperator;
  value: string;
  displayValue?: string;
}

export interface SearchFacetsBarProps {
  /** Currently active facets. */
  facets: SearchFacet[];
  /** Available fields the user can filter on. */
  fields: FacetFieldOption[];
  /** Called when a facet is added. */
  onAddFacet?: (facet: Omit<SearchFacet, "id">) => void;
  /** Called when a facet is removed. */
  onRemoveFacet?: (id: string) => void;
  /** Called when all facets are cleared. */
  onClearAll?: () => void;
  /** Free-text search value (optional companion to facets). */
  search?: string;
  /** Called when the free-text search changes. */
  onSearchChange?: (value: string) => void;
  /** Placeholder for the search input. */
  searchPlaceholder?: string;
  className?: string;
}

// ---------------------------------------------------------------------------
// Defaults
// ---------------------------------------------------------------------------

const DEFAULT_OPERATORS: FacetOperator[] = ["=", "!=", "contains"];

const UNARY_OPERATORS: FacetOperator[] = ["is set", "is not set"];

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function SearchFacetsBar({
  facets,
  fields,
  onAddFacet,
  onRemoveFacet,
  onClearAll,
  search,
  onSearchChange,
  searchPlaceholder = "Search...",
  className,
}: SearchFacetsBarProps) {
  const [open, setOpen] = React.useState(false);
  const [step, setStep] = React.useState<"field" | "operator" | "value">("field");
  const [selectedField, setSelectedField] = React.useState<FacetFieldOption | null>(null);
  const [selectedOperator, setSelectedOperator] = React.useState<FacetOperator | null>(null);
  const [inputValue, setInputValue] = React.useState("");

  const resetWizard = () => {
    setStep("field");
    setSelectedField(null);
    setSelectedOperator(null);
    setInputValue("");
  };

  const handleFieldSelect = (fieldName: string) => {
    const f = fields.find((fld) => fld.name === fieldName);
    if (!f) return;
    setSelectedField(f);
    setStep("operator");
  };

  const handleOperatorSelect = (op: FacetOperator) => {
    setSelectedOperator(op);
    if (UNARY_OPERATORS.includes(op)) {
      onAddFacet?.({
        fieldName: selectedField!.name,
        fieldLabel: selectedField!.label,
        operator: op,
        value: "",
        displayValue: op,
      });
      resetWizard();
      setOpen(false);
    } else {
      setStep("value");
    }
  };

  const handleValueCommit = () => {
    if (!selectedField || !selectedOperator || !inputValue.trim()) return;

    const displayValue =
      selectedField.options?.find((o) => o.value === inputValue)?.label ?? inputValue;

    onAddFacet?.({
      fieldName: selectedField.name,
      fieldLabel: selectedField.label,
      operator: selectedOperator,
      value: inputValue,
      displayValue,
    });
    resetWizard();
    setOpen(false);
  };

  const operators = selectedField?.operators ?? DEFAULT_OPERATORS;

  return (
    <div className={cn("space-y-2", className)}>
      <div className="flex flex-wrap items-center gap-2">
        {onSearchChange && (
          <div className="relative max-w-xs flex-1">
            <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search ?? ""}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder={searchPlaceholder}
              className="pl-9 h-8 text-sm"
              compact
            />
          </div>
        )}

        {facets.map((facet) => (
          <Badge key={facet.id} variant="secondary" className="gap-1 pr-1">
            <span className="text-muted-foreground">{facet.fieldLabel}</span>
            <span className="text-muted-foreground/60">{facet.operator}</span>
            {facet.displayValue || facet.value}
            {onRemoveFacet && (
              <button
                onClick={() => onRemoveFacet(facet.id)}
                className="ml-0.5 rounded-full p-0.5 hover:bg-muted"
                aria-label={`Remove ${facet.fieldLabel} filter`}
              >
                <X className="h-3 w-3" />
              </button>
            )}
          </Badge>
        ))}

        {onAddFacet && (
          <Popover
            open={open}
            onOpenChange={(v) => {
              setOpen(v);
              if (!v) resetWizard();
            }}
          >
            <PopoverTrigger asChild>
              <Button variant="outline" size="sm" className="gap-1.5 h-7 text-xs">
                <Plus className="h-3 w-3" />
                Add Filter
              </Button>
            </PopoverTrigger>
            <PopoverContent align="start" className="w-64 p-3">
              {step === "field" && (
                <div className="space-y-1.5">
                  <p className="text-xs font-medium text-muted-foreground">Select field</p>
                  {fields.map((f) => (
                    <button
                      key={f.name}
                      className="flex w-full items-center rounded-md px-2 py-1.5 text-sm hover:bg-muted"
                      onClick={() => handleFieldSelect(f.name)}
                    >
                      {f.label}
                    </button>
                  ))}
                </div>
              )}

              {step === "operator" && selectedField && (
                <div className="space-y-1.5">
                  <p className="text-xs font-medium text-muted-foreground">
                    {selectedField.label} — operator
                  </p>
                  {operators.map((op) => (
                    <button
                      key={op}
                      className="flex w-full items-center rounded-md px-2 py-1.5 text-sm hover:bg-muted"
                      onClick={() => handleOperatorSelect(op)}
                    >
                      {op}
                    </button>
                  ))}
                  {UNARY_OPERATORS.filter((u) => !operators.includes(u)).length === 0
                    ? null
                    : UNARY_OPERATORS.map((op) =>
                        operators.includes(op) ? null : (
                          <button
                            key={op}
                            className="flex w-full items-center rounded-md px-2 py-1.5 text-sm text-muted-foreground hover:bg-muted"
                            onClick={() => handleOperatorSelect(op)}
                          >
                            {op}
                          </button>
                        )
                      )}
                </div>
              )}

              {step === "value" && selectedField && (
                <div className="space-y-2">
                  <p className="text-xs font-medium text-muted-foreground">
                    {selectedField.label} {selectedOperator}
                  </p>
                  {selectedField.options ? (
                    <Select value={inputValue} onValueChange={setInputValue}>
                      <SelectTrigger className="h-8 text-sm">
                        <SelectValue placeholder="Select value..." />
                      </SelectTrigger>
                      <SelectContent>
                        {selectedField.options.map((opt) => (
                          <SelectItem key={opt.value} value={opt.value}>
                            {opt.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  ) : (
                    <Input
                      autoFocus
                      value={inputValue}
                      onChange={(e) => setInputValue(e.target.value)}
                      placeholder="Enter value..."
                      className="h-8 text-sm"
                      onKeyDown={(e) => {
                        if (e.key === "Enter") handleValueCommit();
                      }}
                    />
                  )}
                  <Button
                    size="sm"
                    className="w-full"
                    onClick={handleValueCommit}
                    disabled={!inputValue.trim()}
                  >
                    Apply
                  </Button>
                </div>
              )}
            </PopoverContent>
          </Popover>
        )}

        {facets.length > 1 && onClearAll && (
          <button
            onClick={onClearAll}
            className="text-xs text-muted-foreground hover:text-foreground"
          >
            Clear all
          </button>
        )}
      </div>
    </div>
  );
}
