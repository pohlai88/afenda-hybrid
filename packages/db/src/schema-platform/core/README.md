# Core schema (`core`)

Shared platform dimensions and workflow primitives. Every tenant-scoped row carries `tenantId` → `tenants`.

**Tables:** `announcement_audiences`, `announcement_posts`, `app_modules`, `attachments`, `cost_centers`, `currencies`, `dashboard_widgets`, `email_logs`, `email_templates`, `legal_entities`, `letter_instances`, `letter_templates`, `locations`, `menu_items`, `notification_channels`, `notification_deliveries`, `notification_subscriptions`, `notification_templates`, `notifications`, `organizations`, `regions`, `tenants`, `user_dashboard_widgets`, `workflow_action_logs`, `workflow_definitions`, `workflow_instances`, `workflow_states`, `workflow_transition_rules`, `workflow_transitions`.

**Conventions:** Timestamp/soft-delete/audit mixins from [`_shared`](../../_shared/README.md); relations in [`_relations.ts`](./_relations.ts). Platform entry: [parent `schema-platform` README](../README.md).

**Guidelines:** [DB-first guideline](../../../../docs/architecture/01-db-first-guideline.md).
