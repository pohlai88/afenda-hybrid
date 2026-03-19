import { defineRelations } from "drizzle-orm";
import { auditTrail } from "./auditTrail";
import { retentionPolicies } from "./retentionPolicy";
import { tenants } from "../core/tenants";
import { users } from "../security/users";
import { servicePrincipals } from "../security/servicePrincipals";

/**
 * Audit Schema Relations
 *
 * Defines relationships between audit tables and referenced entities.
 *
 * Note: actorId in audit_trail is polymorphic (can reference users OR servicePrincipals).
 * The relation to users is defined here for convenience, but application code should
 * check actorType to determine the correct entity.
 */
export const auditRelations = defineRelations(
  { auditTrail, retentionPolicies, tenants, users, servicePrincipals },
  (r) => ({
    // ═══════════════════════════════════════════════════════════════════════
    // Audit Trail Relations
    // ═══════════════════════════════════════════════════════════════════════
    auditTrail: {
      /** Tenant that owns this audit entry */
      tenant: r.one.tenants({
        from: r.auditTrail.tenantId,
        to: r.tenants.tenantId,
      }),

      /**
       * Actor who performed the action (when actorType = 'USER')
       * Note: Application code should check actorType to determine which relation to use.
       */
      actor: r.one.users({
        from: r.auditTrail.actorId,
        to: r.users.userId,
        optional: true,
        alias: "audit_trail_actor",
      }),

      /**
       * Actor who performed the action (when actorType = 'SERVICE_PRINCIPAL')
       * Note: Application code should check actorType to determine which relation to use.
       */
      actorServicePrincipal: r.one.servicePrincipals({
        from: r.auditTrail.actorId,
        to: r.servicePrincipals.servicePrincipalId,
        optional: true,
        alias: "audit_trail_actor_sp",
      }),

      /**
       * Target actor affected by the action (for user-affecting operations)
       * e.g., password reset target, permission grant recipient
       */
      targetActor: r.one.users({
        from: r.auditTrail.targetActorId,
        to: r.users.userId,
        optional: true,
        alias: "audit_trail_target",
      }),
    },

    // ═══════════════════════════════════════════════════════════════════════
    // Retention Policy Relations
    // ═══════════════════════════════════════════════════════════════════════
    retentionPolicies: {
      /**
       * Tenant this policy applies to (NULL = global default)
       */
      tenant: r.one.tenants({
        from: r.retentionPolicies.tenantId,
        to: r.tenants.tenantId,
        optional: true,
      }),
    },

    // ═══════════════════════════════════════════════════════════════════════
    // Reverse Relations (from referenced tables)
    // ═══════════════════════════════════════════════════════════════════════
    tenants: {
      /** All audit entries for this tenant */
      auditEntries: r.many.auditTrail({
        from: r.tenants.tenantId,
        to: r.auditTrail.tenantId,
      }),

      /** Retention policies for this tenant */
      retentionPolicies: r.many.retentionPolicies({
        from: r.tenants.tenantId,
        to: r.retentionPolicies.tenantId,
      }),
    },

    users: {
      /** Audit entries where this user was the actor */
      auditActionsPerformed: r.many.auditTrail({
        from: r.users.userId,
        to: r.auditTrail.actorId,
        alias: "user_audit_actions",
      }),

      /** Audit entries where this user was the target */
      auditActionsReceived: r.many.auditTrail({
        from: r.users.userId,
        to: r.auditTrail.targetActorId,
        alias: "user_audit_targets",
      }),
    },

    servicePrincipals: {
      /** Audit entries where this service principal was the actor */
      auditActionsPerformed: r.many.auditTrail({
        from: r.servicePrincipals.servicePrincipalId,
        to: r.auditTrail.actorId,
        alias: "sp_audit_actions",
      }),
    },
  })
);
