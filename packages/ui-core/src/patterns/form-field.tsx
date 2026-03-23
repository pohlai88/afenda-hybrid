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
import { Textarea } from "../primitives/textarea";
import { Copy, Check } from "lucide-react";
import { cn } from "../lib/utils";

// ---------------------------------------------------------------------------
// Composition-based FormField (matches form-design.mdx guidelines)
// ---------------------------------------------------------------------------

export type FormFieldStatus = "default" | "error" | "warning" | "success";

export interface FormFieldProps {
  /** Field label shown above the control. */
  label: string;
  /** HTML `id` / `name` for the underlying control and a11y wiring. */
  name?: string;
  /** Short description below the label (Odoo-style help text). */
  description?: string;
  /** Error message — sets status to "error". */
  error?: string;
  /** Warning message — sets status to "warning". */
  warning?: string;
  /** Success message — sets status to "success". */
  success?: string;
  /** Hint shown below the control when no message is active. */
  helpText?: string;
  /** Marks the field as required (shows asterisk). */
  required?: boolean;
  /** Renders the value as non-editable text instead of a control. */
  readonly?: boolean;
  /** In readonly mode, show a copy-to-clipboard button. */
  copyable?: boolean;
  /** The display value when `readonly` is true. Falls back to stringifying `children`. */
  readonlyValue?: React.ReactNode;
  /** Max character count — displayed when provided. */
  maxLength?: number;
  /** Current character count (only shown when `maxLength` is set). */
  charCount?: number;
  className?: string;
  children?: React.ReactNode;
}

export function FormField({
  label,
  name,
  description,
  error,
  warning,
  success,
  helpText,
  required,
  readonly,
  copyable,
  readonlyValue,
  maxLength,
  charCount,
  className,
  children,
}: FormFieldProps) {
  const status: FormFieldStatus = error
    ? "error"
    : warning
      ? "warning"
      : success
        ? "success"
        : "default";

  const message = error || warning || success;
  const messageColor =
    status === "error"
      ? "text-destructive"
      : status === "warning"
        ? "text-warning"
        : status === "success"
          ? "text-success"
          : "text-muted-foreground";

  const [copied, setCopied] = React.useState(false);
  const handleCopy = async () => {
    const text = typeof readonlyValue === "string" ? readonlyValue : String(readonlyValue ?? "");
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* clipboard unavailable */
    }
  };

  return (
    <div className={cn("space-y-1.5", className)}>
      <div className="flex items-center justify-between">
        <Label htmlFor={name} className="text-sm">
          {label}
          {required && (
            <span className="ml-0.5 text-destructive" aria-hidden="true">
              *
            </span>
          )}
        </Label>
        {charCount !== undefined && maxLength !== undefined && (
          <span
            className={cn(
              "text-[10px] tabular-nums",
              charCount > maxLength * 0.9 ? "text-warning" : "text-muted-foreground"
            )}
          >
            {charCount}/{maxLength}
          </span>
        )}
      </div>

      {description && <p className="text-xs text-muted-foreground">{description}</p>}

      {readonly ? (
        <div className="flex items-center gap-2">
          <span className="text-sm text-foreground">{readonlyValue ?? "—"}</span>
          {copyable && readonlyValue && (
            <button
              type="button"
              onClick={handleCopy}
              className="inline-flex h-6 w-6 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground"
              aria-label="Copy value"
            >
              {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
            </button>
          )}
        </div>
      ) : (
        children
      )}

      {message && (
        <p className={cn("text-xs", messageColor)} role={status === "error" ? "alert" : undefined}>
          {message}
        </p>
      )}
      {helpText && !message && <p className="text-xs text-muted-foreground">{helpText}</p>}
    </div>
  );
}

// ---------------------------------------------------------------------------
// All-in-one FormFieldControl (original monolithic API, kept for convenience)
// ---------------------------------------------------------------------------

export interface FormFieldControlProps {
  label: string;
  name: string;
  type?:
    | "text"
    | "email"
    | "password"
    | "number"
    | "select"
    | "checkbox"
    | "switch"
    | "date"
    | "textarea";
  value?: string | number | boolean;
  onChange?: (value: unknown) => void;
  error?: string;
  warning?: string;
  helpText?: string;
  required?: boolean;
  placeholder?: string;
  options?: Array<{ value: string; label: string }>;
  className?: string;
  disabled?: boolean;
  maxLength?: number;
  rows?: number;
}

const statusBorderClass: Record<FormFieldStatus, string> = {
  default: "",
  error: "border-destructive focus-visible:ring-destructive",
  warning: "border-warning focus-visible:ring-warning",
  success: "border-success focus-visible:ring-success",
};

export function FormFieldControl({
  label,
  name,
  type = "text",
  value,
  onChange,
  error,
  warning,
  helpText,
  required,
  placeholder,
  options,
  className,
  disabled,
  maxLength,
  rows = 3,
}: FormFieldControlProps) {
  const status: FormFieldStatus = error ? "error" : warning ? "warning" : "default";
  const message = error || warning;

  const charCount = maxLength && typeof value === "string" ? value.length : undefined;

  const renderInput = () => {
    switch (type) {
      case "select":
        return (
          <Select
            value={String(value || "")}
            onValueChange={(val) => onChange?.(val)}
            disabled={disabled}
          >
            <SelectTrigger className={cn(statusBorderClass[status])}>
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

      case "textarea":
        return (
          <Textarea
            id={name}
            name={name}
            value={String(value || "")}
            onChange={(e) => onChange?.(e.target.value)}
            placeholder={placeholder}
            disabled={disabled}
            maxLength={maxLength}
            rows={rows}
            className={cn(statusBorderClass[status])}
          />
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
            maxLength={maxLength}
            className={cn(statusBorderClass[status])}
          />
        );
    }
  };

  if (type === "checkbox" || type === "switch") {
    return (
      <div className={cn("space-y-1.5", className)}>
        {renderInput()}
        {message && (
          <p className={cn("text-xs", status === "error" ? "text-destructive" : "text-warning")}>
            {message}
          </p>
        )}
        {helpText && !message && <p className="text-xs text-muted-foreground">{helpText}</p>}
      </div>
    );
  }

  return (
    <div className={cn("space-y-1.5", className)}>
      <div className="flex items-center justify-between">
        <Label htmlFor={name} className="text-sm">
          {label}
          {required && (
            <span className="ml-0.5 text-destructive" aria-hidden="true">
              *
            </span>
          )}
        </Label>
        {charCount !== undefined && maxLength && (
          <span
            className={cn(
              "text-[10px] tabular-nums",
              charCount > maxLength * 0.9 ? "text-warning" : "text-muted-foreground"
            )}
          >
            {charCount}/{maxLength}
          </span>
        )}
      </div>
      {renderInput()}
      {message && (
        <p className={cn("text-xs", status === "error" ? "text-destructive" : "text-warning")}>
          {message}
        </p>
      )}
      {helpText && !message && <p className="text-xs text-muted-foreground">{helpText}</p>}
    </div>
  );
}
