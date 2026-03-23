/**
 * useFormState Hook Tests
 *
 * Tests for the form state management hook.
 */

import { describe, it, expect, vi } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useFormState } from "../hooks/use-form-state";
import type { ModelDef } from "../metadata/model-def";

describe("useFormState", () => {
  const model: ModelDef = {
    version: 1,
    name: "employee",
    label: "Employee",
    fields: {
      name: { name: "name", label: "Name", type: "char", required: true, maxLength: 50 },
      email: { name: "email", label: "Email", type: "char", pattern: "^[^@]+@[^@]+\\.[^@]+$" },
      age: { name: "age", label: "Age", type: "integer", min: 18, max: 100 },
      salary: { name: "salary", label: "Salary", type: "float", min: 0 },
      status: {
        name: "status",
        label: "Status",
        type: "selection",
        options: [
          { value: "ACTIVE", label: "Active" },
          { value: "INACTIVE", label: "Inactive" },
        ],
      },
    },
  };

  describe("initialization", () => {
    it("initializes with provided data", () => {
      const initialData = { name: "Alice", age: 30 };
      const { result } = renderHook(() => useFormState({ model, initialData }));

      expect(result.current.values).toEqual(initialData);
      expect(result.current.errors).toEqual({});
      expect(result.current.touched).toEqual({});
      expect(result.current.dirty).toBe(false);
      expect(result.current.submitting).toBe(false);
    });

    it("initializes with empty data", () => {
      const { result } = renderHook(() => useFormState({ model }));

      expect(result.current.values).toEqual({});
      expect(result.current.dirty).toBe(false);
    });
  });

  describe("setFieldValue", () => {
    it("updates a single field value", () => {
      const { result } = renderHook(() => useFormState({ model, initialData: { name: "Alice" } }));

      act(() => {
        result.current.setFieldValue("name", "Bob");
      });

      expect(result.current.values.name).toBe("Bob");
      expect(result.current.dirty).toBe(true);
    });

    it("clears error for the updated field", () => {
      const { result } = renderHook(() => useFormState({ model, initialData: {} }));

      act(() => {
        result.current.validate(true);
      });

      expect(result.current.errors.name).toBeDefined();

      act(() => {
        result.current.setFieldValue("name", "Alice");
      });

      expect(result.current.errors.name).toBeUndefined();
    });
  });

  describe("touchField", () => {
    it("marks a field as touched", () => {
      const { result } = renderHook(() => useFormState({ model }));

      act(() => {
        result.current.touchField("name");
      });

      expect(result.current.touched.name).toBe(true);
    });

    it("tracks multiple touched fields", () => {
      const { result } = renderHook(() => useFormState({ model }));

      act(() => {
        result.current.touchField("name");
        result.current.touchField("email");
      });

      expect(result.current.touched.name).toBe(true);
      expect(result.current.touched.email).toBe(true);
      expect(result.current.touched.age).toBeUndefined();
    });
  });

  describe("validation", () => {
    it("validates required fields", () => {
      const { result } = renderHook(() => useFormState({ model, initialData: {} }));

      act(() => {
        result.current.touchField("name");
      });

      let isValid: boolean;
      act(() => {
        isValid = result.current.validate();
      });

      expect(isValid!).toBe(false);
      expect(result.current.errors.name).toBe("Name is required");
    });

    it("validates maxLength constraint", () => {
      const { result } = renderHook(() =>
        useFormState({ model, initialData: { name: "A".repeat(51) } })
      );

      act(() => {
        result.current.touchField("name");
      });

      let isValid: boolean;
      act(() => {
        isValid = result.current.validate();
      });

      expect(isValid!).toBe(false);
      expect(result.current.errors.name).toContain("must be at most 50 characters");
    });

    it("validates pattern constraint", () => {
      const { result } = renderHook(() =>
        useFormState({ model, initialData: { email: "invalid-email" } })
      );

      act(() => {
        result.current.touchField("email");
      });

      let isValid: boolean;
      act(() => {
        isValid = result.current.validate();
      });

      expect(isValid!).toBe(false);
      expect(result.current.errors.email).toContain("format is invalid");
    });

    it("validates min constraint for numbers", () => {
      const { result } = renderHook(() => useFormState({ model, initialData: { age: 15 } }));

      act(() => {
        result.current.touchField("age");
      });

      let isValid: boolean;
      act(() => {
        isValid = result.current.validate();
      });

      expect(isValid!).toBe(false);
      expect(result.current.errors.age).toContain("must be at least 18");
    });

    it("validates max constraint for numbers", () => {
      const { result } = renderHook(() => useFormState({ model, initialData: { age: 150 } }));

      act(() => {
        result.current.touchField("age");
      });

      let isValid: boolean;
      act(() => {
        isValid = result.current.validate();
      });

      expect(isValid!).toBe(false);
      expect(result.current.errors.age).toContain("must be at most 100");
    });

    it("only validates touched fields by default", () => {
      const { result } = renderHook(() => useFormState({ model, initialData: {} }));

      const isValid = result.current.validate();

      expect(isValid).toBe(true);
      expect(result.current.errors).toEqual({});
    });

    it("validates all fields when validateAll is true", () => {
      const { result } = renderHook(() => useFormState({ model, initialData: {} }));

      let isValid: boolean;
      act(() => {
        isValid = result.current.validate(true);
      });

      expect(isValid!).toBe(false);
      expect(result.current.errors.name).toBeDefined();
    });

    it("passes validation with valid data", () => {
      const { result } = renderHook(() =>
        useFormState({
          model,
          initialData: {
            name: "Alice",
            email: "alice@example.com",
            age: 30,
            salary: 50000,
          },
        })
      );

      act(() => {
        result.current.touchField("name");
        result.current.touchField("email");
        result.current.touchField("age");
        result.current.touchField("salary");
      });

      const isValid = result.current.validate();

      expect(isValid).toBe(true);
      expect(result.current.errors).toEqual({});
    });
  });

  describe("reset", () => {
    it("resets values to initial data", () => {
      const initialData = { name: "Alice", age: 30 };
      const { result } = renderHook(() => useFormState({ model, initialData }));

      act(() => {
        result.current.setFieldValue("name", "Bob");
        result.current.setFieldValue("age", 35);
      });

      expect(result.current.values.name).toBe("Bob");
      expect(result.current.dirty).toBe(true);

      act(() => {
        result.current.reset();
      });

      expect(result.current.values).toEqual(initialData);
      expect(result.current.dirty).toBe(false);
      expect(result.current.errors).toEqual({});
      expect(result.current.touched).toEqual({});
    });

    it("resets to updated initial data", () => {
      const { result, rerender } = renderHook(
        ({ data }) => useFormState({ model, initialData: data }),
        { initialProps: { data: { name: "Alice" } } }
      );

      act(() => {
        result.current.setFieldValue("name", "Bob");
      });

      rerender({ data: { name: "Charlie" } });

      act(() => {
        result.current.reset();
      });

      expect(result.current.values.name).toBe("Charlie");
    });
  });

  describe("submit", () => {
    it("validates before submitting", async () => {
      const onSubmit = vi.fn();
      const { result } = renderHook(() => useFormState({ model, initialData: {}, onSubmit }));

      await act(async () => {
        await result.current.submit();
      });

      expect(onSubmit).not.toHaveBeenCalled();
      expect(result.current.errors.name).toBeDefined();
    });

    it("calls onSubmit with valid data", async () => {
      const onSubmit = vi.fn().mockResolvedValue(undefined);
      const initialData = { name: "Alice", age: 30 };
      const { result } = renderHook(() => useFormState({ model, initialData, onSubmit }));

      await act(async () => {
        await result.current.submit();
      });

      expect(onSubmit).toHaveBeenCalledWith(initialData);
      expect(result.current.dirty).toBe(false);
      expect(result.current.touched).toEqual({});
    });

    it("sets submitting state during submission", async () => {
      let resolveSubmit: () => void;
      const submitPromise = new Promise<void>((resolve) => {
        resolveSubmit = resolve;
      });
      const onSubmit = vi.fn().mockReturnValue(submitPromise);

      const { result } = renderHook(() =>
        useFormState({ model, initialData: { name: "Alice" }, onSubmit })
      );

      let submitPromiseResult: Promise<void>;
      await act(async () => {
        submitPromiseResult = result.current.submit();
      });

      // After the act, submitting should be true
      expect(result.current.submitting).toBe(true);

      await act(async () => {
        resolveSubmit!();
        await submitPromiseResult!;
      });

      expect(result.current.submitting).toBe(false);
    });

    it("handles submission errors", async () => {
      const onSubmit = vi.fn().mockRejectedValue(new Error("Network error"));
      const { result } = renderHook(() =>
        useFormState({ model, initialData: { name: "Alice" }, onSubmit })
      );

      await act(async () => {
        await result.current.submit();
      });

      expect(result.current.errors._form).toBe("Network error");
      expect(result.current.submitting).toBe(false);
    });

    it("validates all fields on submit regardless of touched state", async () => {
      const onSubmit = vi.fn();
      const { result } = renderHook(() => useFormState({ model, initialData: {}, onSubmit }));

      await act(async () => {
        await result.current.submit();
      });

      expect(onSubmit).not.toHaveBeenCalled();
      expect(result.current.errors.name).toBeDefined();
    });
  });

  describe("setValues", () => {
    it("updates multiple values at once", () => {
      const { result } = renderHook(() => useFormState({ model, initialData: { name: "Alice" } }));

      act(() => {
        result.current.setValues({ name: "Bob", age: 35 });
      });

      expect(result.current.values.name).toBe("Bob");
      expect(result.current.values.age).toBe(35);
      expect(result.current.dirty).toBe(true);
    });
  });

  describe("conditional required fields", () => {
    it("evaluates required condition", () => {
      const conditionalModel: ModelDef = {
        ...model,
        fields: {
          ...model.fields,
          conditional_field: {
            name: "conditional_field",
            label: "Conditional",
            type: "char",
            required: { field: "status", op: "eq", value: "ACTIVE" },
          },
        },
      };

      const { result } = renderHook(() =>
        useFormState({
          model: conditionalModel,
          initialData: { status: "ACTIVE" },
        })
      );

      act(() => {
        result.current.touchField("conditional_field");
      });

      let isValid: boolean;
      act(() => {
        isValid = result.current.validate();
      });

      expect(isValid!).toBe(false);
      expect(result.current.errors.conditional_field).toBe("Conditional is required");
    });

    it("uses conditionContext for required when field is not on the record", () => {
      const conditionalModel: ModelDef = {
        ...model,
        fields: {
          ...model.fields,
          ctx_field: {
            name: "ctx_field",
            label: "Context gated",
            type: "char",
            required: { field: "company_id", op: "eq", value: 99 },
          },
        },
      };

      const { result } = renderHook(() =>
        useFormState({
          model: conditionalModel,
          initialData: {},
          conditionContext: { company_id: 99 },
        })
      );

      act(() => {
        result.current.touchField("ctx_field");
      });

      let isValid: boolean;
      act(() => {
        isValid = result.current.validate();
      });

      expect(isValid!).toBe(false);
      expect(result.current.errors.ctx_field).toBe("Context gated is required");
    });

    it("record values override conditionContext for required evaluation", () => {
      const conditionalModel: ModelDef = {
        ...model,
        fields: {
          ...model.fields,
          ctx_field: {
            name: "ctx_field",
            label: "Context gated",
            type: "char",
            required: { field: "company_id", op: "eq", value: 99 },
          },
        },
      };

      const { result } = renderHook(() =>
        useFormState({
          model: conditionalModel,
          initialData: { company_id: 1 },
          conditionContext: { company_id: 99 },
        })
      );

      act(() => {
        result.current.touchField("ctx_field");
      });

      let isValid: boolean;
      act(() => {
        isValid = result.current.validate();
      });

      expect(isValid!).toBe(true);
    });
  });
});
