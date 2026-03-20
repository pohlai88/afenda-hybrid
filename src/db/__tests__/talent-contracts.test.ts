import {
  registerPgTableContractSuite,
  type PgTableContract,
} from "./lib/pg-table-contract-suite";

/** Standard tenant + audit footprint for most `talent.*` contract tables. */
const DEFAULT_TALENT_AUDIT_COLUMNS = [
  "tenantId",
  "createdAt",
  "updatedAt",
  "deletedAt",
  "createdBy",
  "updatedBy",
] as const satisfies readonly string[];

/**
 * Single source of truth for talent.* DB shape vs migrations.
 * Matched by `pnpm test:db:contracts` (Vitest --testNamePattern=contract).
 */
const talentContracts: Record<string, PgTableContract> = {
  case_links: {
    columns: [
      "caseLinkId",
      "tenantId",
      "sourceType",
      "sourceId",
      "targetType",
      "targetId",
      "linkType",
      "reason",
      "createdAt",
      "updatedAt",
      "deletedAt",
      "createdBy",
      "updatedBy",
    ],
    indexes: [
      "idx_case_links_tenant",
      "idx_case_links_source",
      "idx_case_links_target",
      "idx_case_links_link_type",
      "uq_case_links_tuple",
    ],
    checkConstraints: ["chk_case_links_no_self_loop"],
    foreignKeys: ["fk_case_links_tenant"],
    checkConstraintDefinitions: {
      chk_case_links_no_self_loop:
        /NOT\s*\([\s\S]*"sourceType"\s*=\s*"targetType"[\s\S]*"sourceId"\s*=\s*"targetId"/i,
    },
    foreignKeyDefinitions: {
      fk_case_links_tenant:
        /FOREIGN\s+KEY\s*\(\s*"tenantId"\s*\)[\s\S]*REFERENCES[\s\S]*tenants\s*\(\s*"tenantId"\s*\)[\s\S]*ON\s+DELETE\s+RESTRICT/i,
    },
    columnUdts: {
      sourceType: { udtSchema: "talent", udtName: "case_entity_type" },
      targetType: { udtSchema: "talent", udtName: "case_entity_type" },
      linkType: { udtSchema: "talent", udtName: "case_link_type" },
    },
    columnDefaults: {
      createdAt: /now\s*\(/i,
      updatedAt: /now\s*\(/i,
    },
    auditColumns: [...DEFAULT_TALENT_AUDIT_COLUMNS],
    enumTypeLabels: {
      case_entity_type: ["GRIEVANCE", "DISCIPLINARY"],
      case_link_type: ["ESCALATES_TO", "RELATED_TO", "DERIVED_FROM"],
    },
  },
  certifications: {
    columns: [
      "certificationId",
      "tenantId",
      "certificationCode",
      "name",
      "issuingOrganization",
      "description",
      "validityMonths",
      "url",
      "status",
      "createdAt",
      "updatedAt",
      "deletedAt",
      "createdBy",
      "updatedBy",
    ],
    indexes: [
      "idx_certifications_tenant",
      "idx_certifications_issuer",
      "idx_certifications_status",
      "uq_certifications_code",
    ],
    foreignKeys: ["fk_certifications_tenant"],
    foreignKeyDefinitions: {
      fk_certifications_tenant:
        /FOREIGN\s+KEY\s*\(\s*"tenantId"\s*\)[\s\S]*REFERENCES[\s\S]*tenants\s*\(\s*"tenantId"\s*\)[\s\S]*ON\s+DELETE\s+RESTRICT/i,
    },
    checkConstraints: ["chk_certifications_validity"],
    checkConstraintDefinitions: {
      chk_certifications_validity: /"validityMonths"\s+IS\s+NULL[\s\S]*"validityMonths"\s*>\s*0/is,
    },
    columnUdts: {
      status: { udtSchema: "talent", udtName: "certification_status" },
    },
    columnDefaults: {
      status: /ACTIVE/i,
      createdAt: /now\s*\(/i,
      updatedAt: /now\s*\(/i,
    },
    auditColumns: [...DEFAULT_TALENT_AUDIT_COLUMNS],
    enumTypeLabels: {
      certification_status: ["ACTIVE", "INACTIVE", "DEPRECATED"],
    },
  },
  competency_frameworks: {
    columns: [
      "frameworkId",
      "tenantId",
      "frameworkCode",
      "name",
      "description",
      "positionId",
      "jobRoleId",
      "status",
      "createdAt",
      "updatedAt",
      "deletedAt",
      "createdBy",
      "updatedBy",
    ],
    indexes: [
      "idx_competency_frameworks_tenant",
      "idx_competency_frameworks_position",
      "idx_competency_frameworks_role",
      "idx_competency_frameworks_status",
      "uq_competency_frameworks_code",
    ],
    foreignKeys: ["fk_competency_frameworks_tenant"],
    foreignKeyDefinitions: {
      fk_competency_frameworks_tenant:
        /FOREIGN\s+KEY\s*\(\s*"tenantId"\s*\)[\s\S]*REFERENCES[\s\S]*tenants\s*\(\s*"tenantId"\s*\)[\s\S]*ON\s+DELETE\s+RESTRICT/i,
    },
    columnUdts: {
      status: { udtSchema: "talent", udtName: "framework_status" },
    },
    columnDefaults: {
      status: /DRAFT/i,
      createdAt: /now\s*\(/i,
      updatedAt: /now\s*\(/i,
    },
    auditColumns: [...DEFAULT_TALENT_AUDIT_COLUMNS],
    enumTypeLabels: {
      framework_status: ["DRAFT", "ACTIVE", "ARCHIVED"],
    },
  },
  competency_skills: {
    columns: [
      "competencySkillId",
      "tenantId",
      "frameworkId",
      "skillId",
      "requiredLevel",
      "weight",
      "createdAt",
      "updatedAt",
      "deletedAt",
      "createdBy",
      "updatedBy",
    ],
    indexes: [
      "idx_competency_skills_framework",
      "idx_competency_skills_skill",
      "uq_competency_skills_framework_skill",
    ],
    legacyColumns: ["isRequired"],
    checkConstraints: ["chk_competency_skills_level", "chk_competency_skills_weight"],
    foreignKeys: ["fk_competency_skills_tenant", "fk_competency_skills_framework", "fk_competency_skills_skill"],
    checkConstraintDefinitions: {
      chk_competency_skills_level: /"requiredLevel"\s*>=\s*1[\s\S]*"requiredLevel"\s*<=\s*5/,
      chk_competency_skills_weight: /(?:"weight"|weight)\s+IS\s+NULL[\s\S]*(?:"weight"|weight)\s*>=\s*1/i,
    },
    foreignKeyDefinitions: {
      fk_competency_skills_tenant:
        /FOREIGN\s+KEY\s*\(\s*"tenantId"\s*\)[\s\S]*REFERENCES[\s\S]*tenants\s*\(\s*"tenantId"\s*\)[\s\S]*ON\s+DELETE\s+RESTRICT/i,
      fk_competency_skills_framework:
        /FOREIGN\s+KEY\s*\(\s*"frameworkId"\s*\)[\s\S]*REFERENCES[\s\S]*competency_frameworks\s*\(\s*"frameworkId"\s*\)[\s\S]*ON\s+DELETE\s+CASCADE/i,
      fk_competency_skills_skill:
        /FOREIGN\s+KEY\s*\(\s*"skillId"\s*\)[\s\S]*REFERENCES[\s\S]*skills\s*\(\s*"skillId"\s*\)[\s\S]*ON\s+DELETE\s+RESTRICT/i,
    },
    columnDefaults: {
      weight: /\b1\b/,
      createdAt: /now\s*\(/i,
      updatedAt: /now\s*\(/i,
    },
    auditColumns: [...DEFAULT_TALENT_AUDIT_COLUMNS],
  },
  disciplinary_actions: {
    columns: [
      "disciplinaryActionId",
      "tenantId",
      "employeeId",
      "actionType",
      "incidentDate",
      "issueDate",
      "description",
      "policyViolated",
      "correctiveAction",
      "issuedBy",
      "witnessId",
      "employeeResponse",
      "acknowledgedDate",
      "expiryDate",
      "status",
      "createdAt",
      "updatedAt",
      "deletedAt",
      "createdBy",
      "updatedBy",
    ],
    indexes: [
      "idx_disciplinary_actions_tenant",
      "idx_disciplinary_actions_employee",
      "idx_disciplinary_actions_type",
      "idx_disciplinary_actions_status",
      "idx_disciplinary_actions_date",
    ],
    foreignKeys: ["fk_disciplinary_actions_tenant"],
    foreignKeyDefinitions: {
      fk_disciplinary_actions_tenant:
        /FOREIGN\s+KEY\s*\(\s*"tenantId"\s*\)[\s\S]*REFERENCES[\s\S]*tenants\s*\(\s*"tenantId"\s*\)[\s\S]*ON\s+DELETE\s+RESTRICT/i,
    },
    checkConstraints: [
      "chk_disciplinary_actions_issue_after_incident",
      "chk_disciplinary_actions_expiry_after_issue",
    ],
    checkConstraintDefinitions: {
      chk_disciplinary_actions_issue_after_incident:
        /"issueDate"\s*>=\s*"incidentDate"/i,
      chk_disciplinary_actions_expiry_after_issue:
        /"expiryDate"\s+IS\s+NULL[\s\S]*"expiryDate"\s*>=\s*"issueDate"/i,
    },
    columnUdts: {
      actionType: { udtSchema: "talent", udtName: "disciplinary_type" },
      status: { udtSchema: "talent", udtName: "disciplinary_status" },
    },
    columnDefaults: {
      status: /DRAFT/i,
      createdAt: /now\s*\(/i,
      updatedAt: /now\s*\(/i,
    },
    auditColumns: [...DEFAULT_TALENT_AUDIT_COLUMNS],
    enumTypeLabels: {
      disciplinary_type: [
        "VERBAL_WARNING",
        "WRITTEN_WARNING",
        "FINAL_WARNING",
        "SUSPENSION",
        "DEMOTION",
        "TERMINATION",
        "OTHER",
      ],
      disciplinary_status: [
        "DRAFT",
        "ISSUED",
        "ACKNOWLEDGED",
        "APPEALED",
        "RESOLVED",
        "EXPIRED",
      ],
    },
  },
  employee_certifications: {
    columns: [
      "employeeCertificationId",
      "tenantId",
      "employeeId",
      "certificationId",
      "certificationCodeSnapshot",
      "certificationNameSnapshot",
      "issuingOrganizationSnapshot",
      "certificationNumber",
      "issuedDate",
      "expiryDate",
      "verifiedBy",
      "verificationDate",
      "status",
      "notes",
      "createdAt",
      "updatedAt",
      "deletedAt",
      "createdBy",
      "updatedBy",
    ],
    indexes: [
      "idx_employee_certifications_tenant",
      "idx_employee_certifications_employee",
      "idx_employee_certifications_certification",
      "idx_employee_certifications_status",
      "idx_employee_certifications_verified_reporting",
      "uq_employee_certifications_active",
    ],
    foreignKeys: ["fk_employee_certifications_tenant", "fk_employee_certifications_certification"],
    foreignKeyDefinitions: {
      fk_employee_certifications_tenant:
        /FOREIGN\s+KEY\s*\(\s*"tenantId"\s*\)[\s\S]*REFERENCES[\s\S]*tenants\s*\(\s*"tenantId"\s*\)/i,
      fk_employee_certifications_certification:
        /FOREIGN\s+KEY\s*\(\s*"certificationId"\s*\)[\s\S]*REFERENCES[\s\S]*certifications\s*\(\s*"certificationId"\s*\)/i,
    },
    checkConstraints: [
      "chk_employee_certifications_dates",
      "chk_employee_certifications_verification_consistency",
    ],
    checkConstraintDefinitions: {
      chk_employee_certifications_dates:
        /"expiryDate"\s+IS\s+NULL[\s\S]*"issuedDate"[\s\S]*"expiryDate"\s*>=\s*"issuedDate"/is,
      chk_employee_certifications_verification_consistency:
        /"verifiedBy"[\s\S]*"verificationDate"[\s\S]*PENDING_VERIFICATION/is,
    },
    columnUdts: {
      status: { udtSchema: "talent", udtName: "employee_certification_status" },
    },
    columnDefaults: {
      status: /ACTIVE/i,
      createdAt: /now\s*\(/i,
      updatedAt: /now\s*\(/i,
    },
    auditColumns: [...DEFAULT_TALENT_AUDIT_COLUMNS],
    enumTypeLabels: {
      employee_certification_status: ["ACTIVE", "EXPIRED", "REVOKED", "PENDING_VERIFICATION"],
    },
  },
  performance_review_goals: {
    columns: [
      "reviewGoalId",
      "tenantId",
      "reviewId",
      "goalId",
      "goalTitleSnapshot",
      "goalWeightSnapshot",
      "goalTargetSnapshot",
      "goalDueDateSnapshot",
      "managerScore",
      "employeeScore",
      "finalScore",
      "comment",
      "createdAt",
      "updatedAt",
      "deletedAt",
      "createdBy",
      "updatedBy",
    ],
    indexes: [
      "idx_performance_review_goals_tenant",
      "idx_performance_review_goals_review",
      "idx_performance_review_goals_goal",
      "idx_performance_review_goals_final",
      "uq_performance_review_goals_review_goal",
    ],
    checkConstraints: [
      "chk_performance_review_goals_scores",
      "chk_performance_review_goals_final_between",
    ],
    foreignKeys: [
      "fk_performance_review_goals_tenant",
      "fk_performance_review_goals_review",
      "fk_performance_review_goals_goal",
    ],
    checkConstraintDefinitions: {
      chk_performance_review_goals_scores:
        /"managerScore"[\s\S]*0[\s\S]*5[\s\S]*"employeeScore"[\s\S]*0[\s\S]*5[\s\S]*"finalScore"[\s\S]*0[\s\S]*5/is,
      chk_performance_review_goals_final_between:
        /"finalScore"[\s\S]*>=[\s\S]*LEAST[\s\S]*"managerScore"[\s\S]*"employeeScore"[\s\S]*GREATEST/is,
    },
    foreignKeyDefinitions: {
      fk_performance_review_goals_tenant:
        /FOREIGN\s+KEY\s*\(\s*"tenantId"\s*\)[\s\S]*REFERENCES[\s\S]*tenants\s*\(\s*"tenantId"\s*\)/i,
      fk_performance_review_goals_review:
        /FOREIGN\s+KEY\s*\(\s*"reviewId"\s*\)[\s\S]*REFERENCES[\s\S]*performance_reviews\s*\(\s*"reviewId"\s*\)/i,
      fk_performance_review_goals_goal:
        /FOREIGN\s+KEY\s*\(\s*"goalId"\s*\)[\s\S]*REFERENCES[\s\S]*performance_goals\s*\(\s*"goalId"\s*\)/i,
    },
    columnDefaults: {
      createdAt: /now\s*\(/i,
      updatedAt: /now\s*\(/i,
    },
    auditColumns: [...DEFAULT_TALENT_AUDIT_COLUMNS],
    triggers: {
      trg_review_goals_final_vs_parent_status:
        /trg_review_goals_final_vs_parent_status[\s\S]*enforce_review_goal_final_score_vs_parent_status/i,
    },
    triggerFunctions: {
      "talent.enforce_review_goal_final_score_vs_parent_status": /finalScore[\s\S]*reviewId|reviewId[\s\S]*finalScore/is,
    },
    triggerFunctionIdentityArgs: {
      "talent.enforce_review_goal_final_score_vs_parent_status": "",
    },
    triggerFunctionReturnTypes: {
      "talent.enforce_review_goal_final_score_vs_parent_status": "trigger",
    },
    triggerFunctionVolatile: {
      "talent.enforce_review_goal_final_score_vs_parent_status": "v",
    },
  },
  performance_goals: {
    columns: [
      "goalId",
      "tenantId",
      "employeeId",
      "title",
      "description",
      "goalType",
      "startDate",
      "targetDate",
      "completedDate",
      "weight",
      "targetValue",
      "actualValue",
      "progressPercent",
      "status",
      "createdAt",
      "updatedAt",
      "deletedAt",
      "createdBy",
      "updatedBy",
    ],
    indexes: [
      "idx_performance_goals_tenant",
      "idx_performance_goals_employee",
      "idx_performance_goals_type",
      "idx_performance_goals_status",
      "idx_performance_goals_dates",
      "idx_performance_goals_target",
      "uq_performance_goals_employee_title_start",
      "idx_performance_goals_active",
    ],
    foreignKeys: ["fk_performance_goals_tenant"],
    foreignKeyDefinitions: {
      fk_performance_goals_tenant:
        /FOREIGN\s+KEY\s*\(\s*"tenantId"\s*\)[\s\S]*REFERENCES[\s\S]*tenants\s*\(\s*"tenantId"\s*\)/i,
    },
    checkConstraints: [
      "chk_performance_goals_dates",
      "chk_performance_goals_progress",
      "chk_performance_goals_weight",
      "chk_performance_goals_completed_window",
    ],
    checkConstraintDefinitions: {
      chk_performance_goals_dates: /"targetDate"\s*>=\s*"startDate"/i,
      chk_performance_goals_progress:
        /"progressPercent"\s+IS\s+NULL[\s\S]*"progressPercent"\s*>=\s*0[\s\S]*"progressPercent"\s*<=\s*100/is,
      chk_performance_goals_weight: /weight[\s\S]*IS\s+NULL[\s\S]*weight[\s\S]*>=\s*1[\s\S]*weight[\s\S]*<=\s*10/is,
      chk_performance_goals_completed_window:
        /"completedDate"\s+IS\s+NULL[\s\S]*"completedDate"\s*>=\s*"startDate"/is,
    },
    columnUdts: {
      goalType: { udtSchema: "talent", udtName: "goal_type" },
      status: { udtSchema: "talent", udtName: "goal_status" },
    },
    columnDefaults: {
      goalType: /INDIVIDUAL/i,
      weight: /\b1\b/,
      progressPercent: /\b0\b/,
      status: /DRAFT/i,
      createdAt: /now\s*\(/i,
      updatedAt: /now\s*\(/i,
    },
    auditColumns: [...DEFAULT_TALENT_AUDIT_COLUMNS],
    enumTypeLabels: {
      goal_type: ["INDIVIDUAL", "TEAM", "DEPARTMENT", "COMPANY", "DEVELOPMENT"],
      goal_status: ["DRAFT", "ACTIVE", "ON_TRACK", "AT_RISK", "BEHIND", "COMPLETED", "CANCELLED"],
    },
  },
  performance_reviews: {
    columns: [
      "reviewId",
      "tenantId",
      "employeeId",
      "reviewerId",
      "reviewType",
      "reviewPeriodStart",
      "reviewPeriodEnd",
      "selfRating",
      "managerRating",
      "finalRating",
      "overallScore",
      "strengths",
      "areasForImprovement",
      "managerComments",
      "employeeComments",
      "status",
      "completedDate",
      "acknowledgedDate",
      "createdAt",
      "updatedAt",
      "deletedAt",
      "createdBy",
      "updatedBy",
    ],
    indexes: [
      "idx_performance_reviews_tenant",
      "idx_performance_reviews_employee",
      "idx_performance_reviews_reviewer",
      "idx_performance_reviews_type",
      "idx_performance_reviews_status",
      "idx_performance_reviews_period",
      "idx_performance_reviews_period_end_active",
      "idx_performance_reviews_completed_reporting",
      "uq_performance_reviews_employee_period",
    ],
    foreignKeys: ["fk_performance_reviews_tenant"],
    foreignKeyDefinitions: {
      fk_performance_reviews_tenant:
        /FOREIGN\s+KEY\s*\(\s*"tenantId"\s*\)[\s\S]*REFERENCES[\s\S]*tenants\s*\(\s*"tenantId"\s*\)/i,
    },
    checkConstraints: [
      "chk_performance_reviews_period",
      "chk_performance_reviews_ratings",
      "chk_performance_reviews_score",
      "chk_performance_reviews_completed_date_vs_status",
      "chk_performance_reviews_acknowledged_date_vs_status",
      "chk_performance_reviews_terminal_outcomes_vs_status",
    ],
    checkConstraintDefinitions: {
      chk_performance_reviews_period: /"reviewPeriodEnd"\s*>=\s*"reviewPeriodStart"/i,
      chk_performance_reviews_ratings: /"selfRating"/i,
      chk_performance_reviews_score: /"overallScore"/i,
      chk_performance_reviews_completed_date_vs_status: /"completedDate"/i,
      chk_performance_reviews_acknowledged_date_vs_status: /"acknowledgedDate"/i,
      chk_performance_reviews_terminal_outcomes_vs_status: /"finalRating"/i,
    },
    columnUdts: {
      reviewType: { udtSchema: "talent", udtName: "review_type" },
      status: { udtSchema: "talent", udtName: "review_status" },
    },
    columnDefaults: {
      status: /DRAFT/i,
      createdAt: /now\s*\(/i,
      updatedAt: /now\s*\(/i,
    },
    auditColumns: [...DEFAULT_TALENT_AUDIT_COLUMNS],
    enumTypeLabels: {
      review_type: ["ANNUAL", "SEMI_ANNUAL", "QUARTERLY", "PROBATION", "PROJECT", "AD_HOC"],
      review_status: [
        "DRAFT",
        "SELF_ASSESSMENT",
        "MANAGER_REVIEW",
        "CALIBRATION",
        "COMPLETED",
        "ACKNOWLEDGED",
      ],
    },
    triggers: {
      trg_reviews_status_vs_goal_finals:
        /trg_reviews_status_vs_goal_finals[\s\S]*enforce_review_status_vs_goal_final_scores/i,
    },
    triggerFunctions: {
      "talent.enforce_review_status_vs_goal_final_scores": /performance_review_goals|finalScore|reviewId/is,
    },
    triggerFunctionIdentityArgs: {
      "talent.enforce_review_status_vs_goal_final_scores": "",
    },
    triggerFunctionReturnTypes: {
      "talent.enforce_review_status_vs_goal_final_scores": "trigger",
    },
    triggerFunctionVolatile: {
      "talent.enforce_review_status_vs_goal_final_scores": "v",
    },
  },
  employee_skills: {
    columns: [
      "employeeSkillId",
      "tenantId",
      "employeeId",
      "skillId",
      "proficiency",
      "yearsOfExperience",
      "lastAssessedDate",
      "assessedBy",
      "notes",
      "createdAt",
      "updatedAt",
      "deletedAt",
      "createdBy",
      "updatedBy",
    ],
    indexes: [
      "idx_employee_skills_tenant",
      "idx_employee_skills_employee",
      "idx_employee_skills_employee_proficiency",
      "idx_employee_skills_skill",
      "idx_employee_skills_proficiency",
      "uq_employee_skills_employee_skill",
    ],
    legacyColumns: ["proficiencyLevel"],
    columnUdts: {
      proficiency: { udtSchema: "talent", udtName: "proficiency_level" },
    },
    checkConstraints: ["chk_employee_skills_experience"],
    foreignKeys: ["fk_employee_skills_tenant", "fk_employee_skills_skill"],
    checkConstraintDefinitions: {
      chk_employee_skills_experience:
        /yearsOfExperience[\s\S]*IS\s+NULL[\s\S]*yearsOfExperience[\s\S]*>=\s*0[\s\S]*yearsOfExperience[\s\S]*<=\s*50/i,
    },
    foreignKeyDefinitions: {
      fk_employee_skills_tenant:
        /FOREIGN\s+KEY\s*\(\s*"tenantId"\s*\)[\s\S]*REFERENCES[\s\S]*tenants\s*\(\s*"tenantId"\s*\)/i,
      fk_employee_skills_skill:
        /FOREIGN\s+KEY\s*\(\s*"skillId"\s*\)[\s\S]*REFERENCES[\s\S]*skills\s*\(\s*"skillId"\s*\)/i,
    },
    columnDefaults: {
      proficiency: /BEGINNER/i,
      createdAt: /now\s*\(/i,
      updatedAt: /now\s*\(/i,
    },
    auditColumns: [...DEFAULT_TALENT_AUDIT_COLUMNS],
    enumTypeLabels: {
      proficiency_level: ["BEGINNER", "INTERMEDIATE", "ADVANCED", "EXPERT", "MASTER"],
    },
    legacyTriggers: ["trg_sync_employee_skill_proficiency"],
    legacyTriggerFunctions: ["talent.sync_employee_skill_proficiency"],
  },
  skills: {
    columns: [
      "skillId",
      "tenantId",
      "skillCode",
      "name",
      "category",
      "description",
      "parentSkillId",
      "status",
      "createdAt",
      "updatedAt",
      "deletedAt",
      "createdBy",
      "updatedBy",
    ],
    indexes: [
      "idx_skills_tenant",
      "idx_skills_category",
      "idx_skills_parent",
      "idx_skills_status",
      "uq_skills_code",
    ],
    checkConstraints: [
      "chk_skills_skill_code",
      "chk_skills_name_length",
      "chk_skills_description_length",
    ],
    foreignKeys: ["fk_skills_tenant", "fk_skills_parent"],
    checkConstraintDefinitions: {
      chk_skills_skill_code:
        /(?:"skillCode"|skillCode)[\s\S]*~[\s\S]*A-Za-z0-9[\s\S]*char_length[\s\S]*>=\s*2[\s\S]*<=\s*50/is,
      chk_skills_name_length: /char_length[\s\S]*>=\s*1[\s\S]*<=\s*200/is,
      chk_skills_description_length:
        /(?:"description"|description)\s+IS\s+NULL[\s\S]*char_length[\s\S]*<=\s*1000/is,
    },
    foreignKeyDefinitions: {
      fk_skills_tenant:
        /FOREIGN\s+KEY\s*\(\s*"tenantId"\s*\)[\s\S]*REFERENCES[\s\S]*tenants\s*\(\s*"tenantId"\s*\)[\s\S]*ON\s+DELETE\s+RESTRICT/i,
      fk_skills_parent:
        /FOREIGN\s+KEY\s*\(\s*"parentSkillId"\s*\)[\s\S]*REFERENCES[\s\S]*skills\s*\(\s*"skillId"\s*\)[\s\S]*ON\s+DELETE\s+RESTRICT/i,
    },
    columnUdts: {
      category: { udtSchema: "talent", udtName: "skill_category" },
      status: { udtSchema: "talent", udtName: "skill_status" },
    },
    columnDefaults: {
      status: /ACTIVE/i,
      createdAt: /now\s*\(/i,
      updatedAt: /now\s*\(/i,
    },
    auditColumns: [...DEFAULT_TALENT_AUDIT_COLUMNS],
    enumTypeLabels: {
      skill_category: [
        "TECHNICAL",
        "SOFT",
        "LANGUAGE",
        "CERTIFICATION",
        "TOOL",
        "DOMAIN",
        "OTHER",
      ],
      skill_status: ["ACTIVE", "INACTIVE", "DEPRECATED"],
    },
  },
  goal_tracking: {
    columns: [
      "trackingId",
      "goalId",
      "trackingDate",
      "progressPercent",
      "actualValue",
      "notes",
      "updatedBy",
      "createdAt",
    ],
    indexes: [
      "idx_goal_tracking_goal",
      "idx_goal_tracking_date",
      "idx_goal_tracking_tracking_date",
      "uq_goal_tracking_goal_date",
    ],
    foreignKeys: ["fk_goal_tracking_goal"],
    foreignKeyDefinitions: {
      fk_goal_tracking_goal:
        /FOREIGN\s+KEY\s*\(\s*"goalId"\s*\)[\s\S]*REFERENCES[\s\S]*performance_goals\s*\(\s*"goalId"\s*\)/i,
    },
    checkConstraints: ["chk_goal_tracking_progress"],
    checkConstraintDefinitions: {
      chk_goal_tracking_progress: /"progressPercent"\s*>=\s*0[\s\S]*"progressPercent"\s*<=\s*100/is,
    },
    columnDefaults: {
      createdAt: /now\s*\(/i,
    },
  },
  grievance_records: {
    columns: [
      "grievanceRecordId",
      "tenantId",
      "employeeId",
      "grievanceType",
      "submissionDate",
      "incidentDate",
      "description",
      "againstEmployeeId",
      "assignedTo",
      "investigationNotes",
      "resolution",
      "resolvedBy",
      "resolvedDate",
      "status",
      "createdAt",
      "updatedAt",
      "deletedAt",
      "createdBy",
      "updatedBy",
    ],
    indexes: [
      "idx_grievance_records_tenant",
      "idx_grievance_records_employee",
      "idx_grievance_records_type",
      "idx_grievance_records_status",
      "idx_grievance_records_date",
      "idx_grievance_records_incident",
      "idx_grievance_records_assigned",
      "idx_grievance_records_resolved_reporting",
      "idx_grievance_records_under_investigation",
    ],
    foreignKeys: ["fk_grievance_records_tenant"],
    foreignKeyDefinitions: {
      fk_grievance_records_tenant:
        /FOREIGN\s+KEY\s*\(\s*"tenantId"\s*\)[\s\S]*REFERENCES[\s\S]*tenants\s*\(\s*"tenantId"\s*\)/i,
    },
    checkConstraints: ["chk_grievance_records_resolution_consistency"],
    checkConstraintDefinitions: {
      chk_grievance_records_resolution_consistency: /"resolvedBy"[\s\S]*"resolvedDate"[\s\S]*RESOLVED/is,
    },
    columnUdts: {
      grievanceType: { udtSchema: "talent", udtName: "grievance_type" },
      status: { udtSchema: "talent", udtName: "grievance_status" },
    },
    columnDefaults: {
      status: /SUBMITTED/i,
      createdAt: /now\s*\(/i,
      updatedAt: /now\s*\(/i,
    },
    auditColumns: [...DEFAULT_TALENT_AUDIT_COLUMNS],
    enumTypeLabels: {
      grievance_type: [
        "HARASSMENT",
        "DISCRIMINATION",
        "WORKPLACE_SAFETY",
        "POLICY_VIOLATION",
        "MANAGEMENT",
        "COMPENSATION",
        "WORKING_CONDITIONS",
        "OTHER",
      ],
      grievance_status: [
        "SUBMITTED",
        "UNDER_INVESTIGATION",
        "PENDING_RESOLUTION",
        "RESOLVED",
        "ESCALATED",
        "CLOSED",
        "WITHDRAWN",
      ],
    },
  },
  promotion_records: {
    columns: [
      "promotionRecordId",
      "tenantId",
      "employeeId",
      "fromPositionId",
      "toPositionId",
      "fromGradeId",
      "toGradeId",
      "effectiveDate",
      "salaryIncrease",
      "salaryIncreasePercent",
      "currencyId",
      "reason",
      "status",
      "approvedBy",
      "approvedAt",
      "createdAt",
      "updatedAt",
      "deletedAt",
      "createdBy",
      "updatedBy",
    ],
    indexes: [
      "idx_promotion_records_tenant",
      "idx_promotion_records_employee",
      "idx_promotion_records_status",
      "idx_promotion_records_date",
      "idx_promotion_records_approved_at",
      "idx_promotion_records_approved_reporting",
      "idx_promotion_records_completed_reporting",
      "uq_promotion_records_employee_effective",
    ],
    foreignKeys: ["fk_promotion_records_tenant", "fk_promotion_records_currency"],
    foreignKeyDefinitions: {
      fk_promotion_records_tenant:
        /FOREIGN\s+KEY\s*\(\s*"tenantId"\s*\)[\s\S]*REFERENCES[\s\S]*tenants\s*\(\s*"tenantId"\s*\)/i,
      fk_promotion_records_currency:
        /FOREIGN\s+KEY\s*\(\s*"currencyId"\s*\)[\s\S]*REFERENCES[\s\S]*currencies\s*\(\s*"currencyId"\s*\)/i,
    },
    checkConstraints: [
      "chk_promotion_records_salary_increase",
      "chk_promotion_records_salary_percent",
      "chk_promotion_records_approval_consistency",
    ],
    checkConstraintDefinitions: {
      chk_promotion_records_salary_increase: /"salaryIncrease"/i,
      chk_promotion_records_salary_percent: /"salaryIncreasePercent"/i,
      chk_promotion_records_approval_consistency: /"approvedBy"[\s\S]*"approvedAt"[\s\S]*APPROVED|COMPLETED/is,
    },
    columnUdts: {
      status: { udtSchema: "talent", udtName: "promotion_status" },
    },
    columnDefaults: {
      status: /PENDING/i,
      createdAt: /now\s*\(/i,
      updatedAt: /now\s*\(/i,
    },
    auditColumns: [...DEFAULT_TALENT_AUDIT_COLUMNS],
    enumTypeLabels: {
      promotion_status: ["PENDING", "APPROVED", "REJECTED", "COMPLETED", "CANCELLED"],
    },
  },
  succession_plans: {
    columns: [
      "successionPlanId",
      "tenantId",
      "positionId",
      "incumbentId",
      "successorId",
      "readinessLevel",
      "priority",
      "developmentPlan",
      "targetDate",
      "status",
      "createdAt",
      "updatedAt",
      "deletedAt",
      "createdBy",
      "updatedBy",
    ],
    indexes: [
      "idx_succession_plans_tenant",
      "idx_succession_plans_position",
      "idx_succession_plans_incumbent",
      "idx_succession_plans_successor",
      "idx_succession_plans_readiness",
      "idx_succession_plans_status",
      "idx_succession_plans_active_target",
      "idx_succession_plans_archived_reporting",
      "uq_succession_plans_position_successor",
    ],
    foreignKeys: ["fk_succession_plans_tenant"],
    foreignKeyDefinitions: {
      fk_succession_plans_tenant:
        /FOREIGN\s+KEY\s*\(\s*"tenantId"\s*\)[\s\S]*REFERENCES[\s\S]*tenants\s*\(\s*"tenantId"\s*\)/i,
    },
    checkConstraints: [
      "chk_succession_plans_priority",
      "chk_succession_plans_different",
      "chk_succession_plans_target_when_live",
    ],
    checkConstraintDefinitions: {
      chk_succession_plans_priority: /priority\s*>=\s*1[\s\S]*priority\s*<=\s*10/is,
      chk_succession_plans_different: /incumbentId[\s\S]*successorId/is,
      chk_succession_plans_target_when_live: /"targetDate"[\s\S]*ACTIVE|UNDER_REVIEW/is,
    },
    columnUdts: {
      readinessLevel: { udtSchema: "talent", udtName: "readiness_level" },
      status: { udtSchema: "talent", udtName: "succession_plan_status" },
    },
    columnDefaults: {
      priority: /\b1\b/,
      status: /DRAFT/i,
      createdAt: /now\s*\(/i,
      updatedAt: /now\s*\(/i,
    },
    auditColumns: [...DEFAULT_TALENT_AUDIT_COLUMNS],
    enumTypeLabels: {
      readiness_level: [
        "READY_NOW",
        "READY_1_YEAR",
        "READY_2_YEARS",
        "DEVELOPMENT_NEEDED",
        "NOT_READY",
      ],
      succession_plan_status: ["DRAFT", "ACTIVE", "UNDER_REVIEW", "ARCHIVED"],
    },
  },
  talent_pool_memberships: {
    columns: [
      "talentPoolMembershipId",
      "tenantId",
      "talentPoolId",
      "employeeId",
      "nominatedBy",
      "joinedDate",
      "exitedDate",
      "status",
      "rationale",
      "createdAt",
      "updatedAt",
      "deletedAt",
      "createdBy",
      "updatedBy",
    ],
    indexes: [
      "idx_talent_pool_memberships_tenant",
      "idx_talent_pool_memberships_pool",
      "idx_talent_pool_memberships_employee",
      "idx_talent_pool_memberships_status",
      "uq_talent_pool_memberships_active",
    ],
    foreignKeys: ["fk_talent_pool_memberships_tenant", "fk_talent_pool_memberships_pool"],
    foreignKeyDefinitions: {
      fk_talent_pool_memberships_tenant:
        /FOREIGN\s+KEY\s*\(\s*"tenantId"\s*\)[\s\S]*REFERENCES[\s\S]*tenants\s*\(\s*"tenantId"\s*\)/i,
      fk_talent_pool_memberships_pool:
        /FOREIGN\s+KEY\s*\(\s*"talentPoolId"\s*\)[\s\S]*REFERENCES[\s\S]*talent_pools\s*\(\s*"talentPoolId"\s*\)/i,
    },
    checkConstraints: ["chk_talent_pool_memberships_dates"],
    checkConstraintDefinitions: {
      chk_talent_pool_memberships_dates: /"exitedDate"\s+IS\s+NULL[\s\S]*"joinedDate"/is,
    },
    columnUdts: {
      status: { udtSchema: "talent", udtName: "pool_membership_status" },
    },
    columnDefaults: {
      status: /ACTIVE/i,
      createdAt: /now\s*\(/i,
      updatedAt: /now\s*\(/i,
    },
    auditColumns: [...DEFAULT_TALENT_AUDIT_COLUMNS],
    enumTypeLabels: {
      pool_membership_status: ["ACTIVE", "EXITED", "SUSPENDED"],
    },
  },
  talent_pools: {
    columns: [
      "talentPoolId",
      "tenantId",
      "poolCode",
      "name",
      "description",
      "criteria",
      "status",
      "createdAt",
      "updatedAt",
      "deletedAt",
      "createdBy",
      "updatedBy",
    ],
    indexes: ["idx_talent_pools_tenant", "idx_talent_pools_status", "uq_talent_pools_code"],
    foreignKeys: ["fk_talent_pools_tenant"],
    foreignKeyDefinitions: {
      fk_talent_pools_tenant:
        /FOREIGN\s+KEY\s*\(\s*"tenantId"\s*\)[\s\S]*REFERENCES[\s\S]*tenants\s*\(\s*"tenantId"\s*\)[\s\S]*ON\s+DELETE\s+RESTRICT/i,
    },
    columnUdts: {
      status: { udtSchema: "talent", udtName: "pool_status" },
    },
    columnDefaults: {
      status: /ACTIVE/i,
      createdAt: /now\s*\(/i,
      updatedAt: /now\s*\(/i,
    },
    auditColumns: [...DEFAULT_TALENT_AUDIT_COLUMNS],
    enumTypeLabels: {
      pool_status: ["ACTIVE", "INACTIVE", "ARCHIVED"],
    },
  },
};

registerPgTableContractSuite({
  tableSchema: "talent",
  describeTitle: "Database contract tests (talent schema)",
  contracts: talentContracts,
  contractsManifestKey: "talentContracts",
});
