"use client";

import * as React from "react";
import { Check } from "lucide-react";
import { cn } from "../lib/utils";

export type StepStatus = "upcoming" | "active" | "completed";

export interface Step {
  label: string;
  description?: string;
}

export interface StepperProps {
  steps: Step[];
  currentStep: number;
  className?: string;
  orientation?: "horizontal" | "vertical";
}

export function Stepper({
  steps,
  currentStep,
  className,
  orientation = "horizontal",
}: StepperProps) {
  const getStatus = (index: number): StepStatus => {
    if (index < currentStep) return "completed";
    if (index === currentStep) return "active";
    return "upcoming";
  };

  if (orientation === "vertical") {
    return (
      <div className={cn("flex flex-col", className)}>
        {steps.map((step, idx) => {
          const status = getStatus(idx);
          return (
            <div key={idx} className="flex gap-3">
              <div className="flex flex-col items-center">
                <StepIndicator step={idx + 1} status={status} />
                {idx < steps.length - 1 && (
                  <div
                    className={cn(
                      "mt-1 w-px flex-1 min-h-[24px]",
                      status === "completed" ? "bg-primary" : "bg-border"
                    )}
                  />
                )}
              </div>
              <div className="pb-6">
                <p
                  className={cn(
                    "text-sm font-medium",
                    status === "upcoming" && "text-muted-foreground"
                  )}
                >
                  {step.label}
                </p>
                {step.description && (
                  <p className="mt-0.5 text-xs text-muted-foreground">{step.description}</p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    );
  }

  return (
    <div className={cn("flex items-center", className)}>
      {steps.map((step, idx) => {
        const status = getStatus(idx);
        return (
          <React.Fragment key={idx}>
            <div className="flex flex-col items-center gap-1.5">
              <StepIndicator step={idx + 1} status={status} />
              <span
                className={cn(
                  "text-xs font-medium",
                  status === "upcoming" ? "text-muted-foreground" : "text-foreground"
                )}
              >
                {step.label}
              </span>
            </div>
            {idx < steps.length - 1 && (
              <div
                className={cn(
                  "mx-2 h-px flex-1",
                  status === "completed" ? "bg-primary" : "bg-border"
                )}
              />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
}

function StepIndicator({ step, status }: { step: number; status: StepStatus }) {
  return (
    <div
      className={cn(
        "flex h-7 w-7 items-center justify-center rounded-full text-xs font-semibold transition-colors",
        status === "completed" && "bg-primary text-primary-foreground",
        status === "active" && "border-2 border-primary bg-background text-primary",
        status === "upcoming" && "border border-border bg-muted text-muted-foreground"
      )}
    >
      {status === "completed" ? <Check className="h-3.5 w-3.5" /> : step}
    </div>
  );
}
