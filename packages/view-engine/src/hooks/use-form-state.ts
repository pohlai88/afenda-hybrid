/**
 * Form State Manager
 *
 * Lightweight form state hook for metadata-driven forms.
 * Provides values, errors, dirty tracking, and validation.
 *
 * @version 1.0.0
 */

import { useState, useCallback, useMemo, useRef, useEffect } from "react";
import type { ModelDef } from "../metadata/model-def";
import type { Condition, ConditionContext } from "../metadata/condition";
import { evaluateCondition } from "../metadata/condition";

export interface UseFormStateOptions {
  /** Model definition. */
  model: ModelDef;
  /** Initial form values. */
  initialData?: Record<string, unknown>;
  /** Merged into condition evaluation (e.g. uid, company_id); record values win on conflicts. */
  conditionContext?: ConditionContext;
  /** Called when form is submitted and valid. */
  onSubmit?: (values: Record<string, unknown>) => Promise<void>;
}

export interface FormState {
  /** Current form values. */
  values: Record<string, unknown>;
  /** Validation errors per field. */
  errors: Record<string, string>;
  /** True if any field has been modified. */
  dirty: boolean;
  /** True if form is currently submitting. */
  submitting: boolean;
  /** Per-field interaction tracking. */
  touched: Record<string, boolean>;
  /** Sets a single field value. */
  setFieldValue: (name: string, value: unknown) => void;
  /** Sets multiple field values at once. */
  setValues: (values: Record<string, unknown>) => void;
  /** Marks a field as touched (interacted with). */
  touchField: (name: string) => void;
  /** Validates all fields and returns true if valid. */
  validate: (validateAll?: boolean) => boolean;
  /** Resets form to initial values. */
  reset: () => void;
  /** Submits the form (validates, then calls onSubmit if valid). */
  submit: () => Promise<void>;
}

/**
 * Form state manager for metadata-driven forms.
 *
 * Usage:
 * ```typescript
 * const form = useFormState({
 *   model: employeeModel,
 *   initialData: { name: "Alice", status: "ACTIVE" },
 *   onSubmit: async (values) => {
 *     await saveEmployee(values);
 *   }
 * });
 *
 * <input value={form.values.name} onChange={(e) => form.setFieldValue("name", e.target.value)} />
 * <button onClick={form.submit}>Save</button>
 * ```
 */
export function useFormState(options: UseFormStateOptions): FormState {
  const { model, initialData = {}, conditionContext, onSubmit } = options;

  // Use ref to avoid stale closure in reset callback
  const initialDataRef = useRef(initialData);
  useEffect(() => {
    initialDataRef.current = initialData;
  }, [initialData]);

  const [values, setValues] = useState<Record<string, unknown>>(initialData);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [dirty, setDirty] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const setFieldValue = useCallback((name: string, value: unknown) => {
    setValues((prev) => ({ ...prev, [name]: value }));
    setDirty(true);
    // Clear error for this field
    setErrors((prev) => {
      const next = { ...prev };
      delete next[name];
      return next;
    });
  }, []);

  const touchField = useCallback((name: string) => {
    setTouched((prev) => ({ ...prev, [name]: true }));
  }, []);

  const setValuesCallback = useCallback((newValues: Record<string, unknown>) => {
    setValues(newValues);
    setDirty(true);
  }, []);

  const validate = useCallback(
    (validateAll = false): boolean => {
      const newErrors: Record<string, string> = {};

      for (const [fieldName, fieldDef] of Object.entries(model.fields)) {
        // Only validate touched fields unless validateAll is true
        if (!validateAll && !touched[fieldName]) {
          continue;
        }

        const value = values[fieldName];

        // Check required constraint
        const requiredCondition = fieldDef.required;
        let isRequired = false;

        if (typeof requiredCondition === "boolean") {
          isRequired = requiredCondition;
        } else if (requiredCondition !== undefined) {
          isRequired = evaluateCondition(
            requiredCondition as Condition,
            values,
            undefined,
            conditionContext
          );
        }

        if (isRequired && (value === null || value === undefined || value === "")) {
          newErrors[fieldName] = `${fieldDef.label} is required`;
          continue;
        }

        // Skip further validation if value is empty and not required
        if (value === null || value === undefined || value === "") {
          continue;
        }

        // maxLength constraint
        if (fieldDef.maxLength && typeof value === "string" && value.length > fieldDef.maxLength) {
          newErrors[fieldName] =
            `${fieldDef.label} must be at most ${fieldDef.maxLength} characters`;
          continue;
        }

        // pattern constraint (regex validation)
        if (fieldDef.pattern && typeof value === "string") {
          const regex = new RegExp(fieldDef.pattern);
          if (!regex.test(value)) {
            newErrors[fieldName] = `${fieldDef.label} format is invalid`;
            continue;
          }
        }

        // min/max constraints for numbers
        if (typeof value === "number") {
          if (fieldDef.min !== undefined && value < fieldDef.min) {
            newErrors[fieldName] = `${fieldDef.label} must be at least ${fieldDef.min}`;
            continue;
          }
          if (fieldDef.max !== undefined && value > fieldDef.max) {
            newErrors[fieldName] = `${fieldDef.label} must be at most ${fieldDef.max}`;
            continue;
          }
        }
      }

      setErrors(newErrors);
      return Object.keys(newErrors).length === 0;
    },
    [model, values, touched, conditionContext]
  );

  const reset = useCallback(() => {
    setValues(initialDataRef.current);
    setErrors({});
    setTouched({});
    setDirty(false);
  }, []);

  const submit = useCallback(async () => {
    // Validate all fields on submit (not just touched)
    if (!validate(true)) {
      return;
    }

    if (!onSubmit) {
      return;
    }

    setSubmitting(true);
    try {
      await onSubmit(values);
      setDirty(false);
      setTouched({});
    } catch (error) {
      if (error instanceof Error) {
        setErrors({ _form: error.message });
      }
    } finally {
      setSubmitting(false);
    }
  }, [validate, onSubmit, values]);

  return useMemo(
    () => ({
      values,
      errors,
      touched,
      dirty,
      submitting,
      setFieldValue,
      setValues: setValuesCallback,
      touchField,
      validate,
      reset,
      submit,
    }),
    [
      values,
      errors,
      touched,
      dirty,
      submitting,
      setFieldValue,
      setValuesCallback,
      touchField,
      validate,
      reset,
      submit,
    ]
  );
}
