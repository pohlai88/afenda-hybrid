"use client";

import * as React from "react";
import { Toaster as Sonner, toast } from "sonner";

type ToasterProps = React.ComponentProps<typeof Sonner>;

function Toaster({ ...props }: ToasterProps) {
  return (
    <Sonner
      className="toaster group"
      toastOptions={{
        classNames: {
          toast:
            "group toast group-[.toaster]:bg-background group-[.toaster]:text-foreground group-[.toaster]:border-border group-[.toaster]:shadow-lg group-[.toaster]:rounded-lg",
          description: "group-[.toast]:text-muted-foreground",
          actionButton: "group-[.toast]:bg-primary group-[.toast]:text-primary-foreground",
          cancelButton: "group-[.toast]:bg-muted group-[.toast]:text-muted-foreground",
          success: "group-[.toaster]:border-success/50 group-[.toaster]:text-success",
          error: "group-[.toaster]:border-destructive/50 group-[.toaster]:text-destructive",
          warning: "group-[.toaster]:border-warning/50 group-[.toaster]:text-warning",
          info: "group-[.toaster]:border-info/50 group-[.toaster]:text-info",
        },
      }}
      {...props}
    />
  );
}

export { Toaster, toast };
