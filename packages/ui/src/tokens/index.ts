export const moduleColors = {
  core: "#6366f1",
  security: "#8b5cf6",
  audit: "#64748b",
  hr: "#10b981",
  payroll: "#f59e0b",
  benefits: "#ec4899",
  talent: "#06b6d4",
  learning: "#14b8a6",
  recruitment: "#f97316",
} as const;

export type ModuleCode = keyof typeof moduleColors;

export const getModuleColor = (moduleCode: ModuleCode): string => {
  return moduleColors[moduleCode];
};
