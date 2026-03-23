"use client";

import * as React from "react";
import {
  CommandDialog,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandSeparator,
} from "../primitives/command";

export interface SearchCommandItem {
  id: string;
  label: string;
  icon?: React.ReactNode;
  description?: string;
  shortcut?: string;
  onSelect: () => void;
}

export interface SearchCommandGroup {
  heading: string;
  items: SearchCommandItem[];
}

export interface SearchCommandProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  groups: SearchCommandGroup[];
  placeholder?: string;
  emptyMessage?: string;
  className?: string;
}

export function SearchCommand({
  open,
  onOpenChange,
  groups,
  placeholder = "Type a command or search...",
  emptyMessage = "No results found.",
  className,
}: SearchCommandProps) {
  return (
    <CommandDialog open={open} onOpenChange={onOpenChange}>
      <CommandInput placeholder={placeholder} />
      <CommandList className={className}>
        <CommandEmpty>{emptyMessage}</CommandEmpty>
        {groups.map((group, idx) => (
          <React.Fragment key={group.heading}>
            {idx > 0 && <CommandSeparator />}
            <CommandGroup heading={group.heading}>
              {group.items.map((item) => (
                <CommandItem
                  key={item.id}
                  onSelect={() => {
                    item.onSelect();
                    onOpenChange(false);
                  }}
                >
                  {item.icon && (
                    <span className="mr-2 flex h-4 w-4 items-center justify-center">
                      {item.icon}
                    </span>
                  )}
                  <div className="flex flex-1 flex-col">
                    <span>{item.label}</span>
                    {item.description && (
                      <span className="text-xs text-muted-foreground">{item.description}</span>
                    )}
                  </div>
                  {item.shortcut && (
                    <kbd className="pointer-events-none ml-auto inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground">
                      {item.shortcut}
                    </kbd>
                  )}
                </CommandItem>
              ))}
            </CommandGroup>
          </React.Fragment>
        ))}
      </CommandList>
    </CommandDialog>
  );
}
