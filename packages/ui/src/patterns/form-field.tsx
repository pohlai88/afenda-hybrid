"use client";

import * as React from "react";
import { Label } from "../primitives/label";
import { Input } from "../primitives/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../primitives/select";
import { Checkbox } from "../primitives/checkbox";
import { Switch } from "../primitives/switch";
import { cn } from "../lib/utils";

export interface FormFieldProps {
  label: string;
  name: string;
  type?: "text" | "email" | "password" | "number" | "select" | "checkbox" | "switch" | "date";
  value?: string | number | boolean;
  onChange?: (value: unknown) => void;
  error?: string;
  required?: boolean;
  placeholder?: string;
  options?: Array<{ value: string; label: string }>;
  className?: string;
  disabled?: boolean;
}

export function FormField({
  label,
  name,
  type = "text",
  value,
  onChange,
  error,
  required,
  placeholder,
  options,
  className,
  disabled,
}: FormFieldProps) {
  const renderInput = () => {
    switch (type) {
      case "select":
        return (
          <Select
            value={String(value || "")}
            onValueChange={(val) => onChange?.(val)}
            disabled={disabled}
          >
            <SelectTrigger>
              <SelectValue placeholder={placeholder} />
            </SelectTrigger>
            <SelectContent>
              {options?.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        );

      case "checkbox":
        return (
          <div className="flex items-center gap-2">
            <Checkbox
              id={name}
              checked={Boolean(value)}
              onCheckedChange={(checked) => onChange?.(checked)}
              disabled={disabled}
            />
            <Label htmlFor={name} className="text-sm font-normal cursor-pointer">
              {label}
            </Label>
          </div>
        );

      case "switch":
        return (
          <div className="flex items-center justify-between">
            <Label htmlFor={name}>{label}</Label>
            <Switch
              id={name}
              checked={Boolean(value)}
              onCheckedChange={(checked) => onChange?.(checked)}
              disabled={disabled}
            />
          </div>
        );

      default:
        return (
          <Input
            id={name}
            name={name}
            type={type}
            value={String(value || "")}
            onChange={(e) => {
              const val = type === "number" ? Number(e.target.value) : e.target.value;
              onChange?.(val);
            }}
            placeholder={placeholder}
            disabled={disabled}
          />
        );
    }
  };

  if (type === "checkbox" || type === "switch") {
    return (
      <div className={cn("space-y-2", className)}>
        {renderInput()}
        {error && <p className="text-sm text-destructive">{error}</p>}
      </div>
    );
  }

  return (
    <div className={cn("space-y-2", className)}>
      <Label htmlFor={name}>
        {label}
        {required && <span className="text-destructive ml-1">*</span>}
      </Label>
      {renderInput()}
      {error && <p className="text-sm text-destructive">{error}</p>}
    </div>
  );
}
