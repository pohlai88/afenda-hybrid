/**
 * Relation Widget
 *
 * Renders many2one, one2many, many2many fields.
 * Supports static options or async search via onSearch callback.
 *
 * @version 1.0.0
 */

import * as React from "react";
import { Button } from "@afenda/ui-core/primitives/button";
import { Popover, PopoverContent, PopoverTrigger } from "@afenda/ui-core/primitives/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@afenda/ui-core/primitives/command";
import { Check, ChevronsUpDown } from "lucide-react";
import { cn } from "@afenda/ui-core/lib/utils";
import type { WidgetRenderProps, CellRenderProps } from "../registry/widget-registry";

export function RelationWidgetRender({
  field,
  value,
  onChange,
  onBlur,
  onSearch,
  displayValue,
  disabled,
}: WidgetRenderProps) {
  const [open, setOpen] = React.useState(false);
  const [searchQuery, setSearchQuery] = React.useState("");
  const [searchResults, setSearchResults] = React.useState<Array<{ value: string; label: string }>>(
    []
  );
  const [loading, setLoading] = React.useState(false);

  // Use static options if available, otherwise async search
  const staticOptions = field.options ?? [];
  const hasAsyncSearch = !!onSearch;

  // Debounced async search
  React.useEffect(() => {
    if (!hasAsyncSearch || !searchQuery) {
      setSearchResults([]);
      return;
    }

    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const results = await onSearch(searchQuery);
        setSearchResults(results);
      } catch (error) {
        console.error("[RelationWidget] Search failed:", error);
        setSearchResults([]);
      } finally {
        setLoading(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery, hasAsyncSearch, onSearch]);

  // Filter static options by search query
  const filteredStaticOptions = React.useMemo(() => {
    if (!searchQuery) return staticOptions;
    return staticOptions.filter((opt) =>
      opt.label.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [staticOptions, searchQuery]);

  // Combine static and async results
  const allOptions = hasAsyncSearch ? searchResults : filteredStaticOptions;

  // Resolve display label
  const selectedLabel =
    displayValue ?? staticOptions.find((opt) => opt.value === value)?.label ?? String(value ?? "");

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between"
          disabled={disabled}
          onBlur={onBlur}
        >
          {value ? selectedLabel : `Select ${field.label}`}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[400px] p-0">
        <Command shouldFilter={false}>
          <CommandInput
            placeholder={`Search ${field.label}...`}
            value={searchQuery}
            onValueChange={setSearchQuery}
          />
          <CommandList>
            {loading ? (
              <div className="py-6 text-center text-sm text-muted-foreground">Loading...</div>
            ) : allOptions.length === 0 ? (
              <CommandEmpty>No results found.</CommandEmpty>
            ) : (
              <CommandGroup>
                {allOptions.map((option) => (
                  <CommandItem
                    key={option.value}
                    value={option.value}
                    onSelect={() => {
                      onChange?.(option.value);
                      setOpen(false);
                      setSearchQuery("");
                    }}
                  >
                    <Check
                      className={cn(
                        "mr-2 h-4 w-4",
                        value === option.value ? "opacity-100" : "opacity-0"
                      )}
                    />
                    {option.label}
                  </CommandItem>
                ))}
              </CommandGroup>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

export function RelationWidgetReadonly({ displayValue, value }: WidgetRenderProps) {
  return <span className="text-sm">{displayValue ?? String(value ?? "—")}</span>;
}

export function RelationWidgetCell({ displayValue, value }: CellRenderProps) {
  return <>{displayValue ?? String(value ?? "")}</>;
}
