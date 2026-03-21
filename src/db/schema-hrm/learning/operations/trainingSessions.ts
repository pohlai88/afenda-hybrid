import { integer, text, date, timestamp, smallint, index, uniqueIndex, foreignKey, check } from "drizzle-orm/pg-core";
import { createSelectSchema, createInsertSchema, createUpdateSchema } from "drizzle-orm/zod";
import { z } from "zod/v4";
import { sql } from "drizzle-orm";
import { learningSchema } from "../_schema";
import {
  catalogCodeInputSchema,
  contentUrlSchema,
  courseMaxParticipantsSchema,
  dateStringSchema,
  nonNegativeIntSchema,
  nullableOptional,
  refineEndDateOnOrAfterStartDate,
  shortLabel500Schema,
  timestamptzNullableOptionalSchema,
  timestamptzOptionalSchema,
} from "../_zodShared";
import { timestampColumns, softDeleteColumns, auditColumns } from "../../../_shared";
import { tenants } from "../../../schema-platform/core/tenants";
import { locations } from "../../../schema-platform/core/locations";
import { courses } from "../fundamentals/courses";
import { trainers } from "../fundamentals/trainers";

/**
 * Training Sessions - Scheduled course delivery instances.
 */
export const sessionStatuses = ["SCHEDULED", "IN_PROGRESS", "COMPLETED", "CANCELLED", "POSTPONED"] as const;

export const sessionStatusEnum = learningSchema.enum("session_status", [...sessionStatuses]);

export const sessionStatusZodEnum = z.enum(sessionStatuses);

export const trainingSessions = learningSchema.table(
  "training_sessions",
  {
    sessionId: integer().primaryKey().generatedAlwaysAsIdentity(),
    tenantId: integer().notNull(),
    courseId: integer().notNull(),
    sessionCode: text().notNull(),
    trainerId: integer(),
    locationId: integer(),
    startDate: date().notNull(),
    endDate: date().notNull(),
    startTime: timestamp({ withTimezone: true }),
    endTime: timestamp({ withTimezone: true }),
    maxParticipants: smallint(),
    enrolledCount: smallint().default(0),
    venue: text(),
    meetingUrl: text(),
    status: sessionStatusEnum().notNull().default("SCHEDULED"),
    ...timestampColumns,
    ...softDeleteColumns,
    ...auditColumns,
  },
  (t) => [
    index("idx_training_sessions_tenant").on(t.tenantId),
    index("idx_training_sessions_course").on(t.tenantId, t.courseId),
    index("idx_training_sessions_trainer").on(t.tenantId, t.trainerId),
    index("idx_training_sessions_location").on(t.tenantId, t.locationId),
    index("idx_training_sessions_dates").on(t.tenantId, t.startDate, t.endDate),
    index("idx_training_sessions_status").on(t.tenantId, t.status),
    uniqueIndex("uq_training_sessions_code")
      .on(t.tenantId, sql`lower(${t.sessionCode})`)
      .where(sql`${t.deletedAt} IS NULL`),
    foreignKey({
      columns: [t.tenantId],
      foreignColumns: [tenants.tenantId],
      name: "fk_training_sessions_tenant",
    })
      .onDelete("restrict")
      .onUpdate("cascade"),
    foreignKey({
      columns: [t.courseId],
      foreignColumns: [courses.courseId],
      name: "fk_training_sessions_course",
    })
      .onDelete("restrict")
      .onUpdate("cascade"),
    foreignKey({
      columns: [t.trainerId],
      foreignColumns: [trainers.trainerId],
      name: "fk_training_sessions_trainer",
    })
      .onDelete("restrict")
      .onUpdate("cascade"),
    foreignKey({
      columns: [t.locationId],
      foreignColumns: [locations.locationId],
      name: "fk_training_sessions_location",
    })
      .onDelete("restrict")
      .onUpdate("cascade"),
    check(
      "chk_training_sessions_dates",
      sql`${t.endDate} >= ${t.startDate}`
    ),
    check(
      "chk_training_sessions_max_participants",
      sql`${t.maxParticipants} IS NULL OR ${t.maxParticipants} > 0`
    ),
    check(
      "chk_training_sessions_enrolled",
      sql`${t.enrolledCount} IS NULL OR ${t.enrolledCount} >= 0`
    ),
  ]
);

export const TrainingSessionIdSchema = z.number().int().brand<"TrainingSessionId">();
export type TrainingSessionId = z.infer<typeof TrainingSessionIdSchema>;

/** Read model: trust DB + date/participant `CHECK`s; use insert/update for write rules. */
export const trainingSessionSelectSchema = createSelectSchema(trainingSessions);

export const trainingSessionInsertSchema = createInsertSchema(trainingSessions, {
  sessionCode: catalogCodeInputSchema,
  startDate: dateStringSchema,
  endDate: dateStringSchema,
  startTime: timestamptzOptionalSchema,
  endTime: timestamptzOptionalSchema,
  maxParticipants: courseMaxParticipantsSchema.optional(),
  enrolledCount: nonNegativeIntSchema.optional(),
  venue: shortLabel500Schema.optional(),
  meetingUrl: contentUrlSchema.optional(),
  status: sessionStatusZodEnum.optional(),
}).superRefine(refineEndDateOnOrAfterStartDate);

/**
 * Patch semantics: `.optional()` = omit or set. `nullableOptional`, `dateNullableOptionalSchema`, and
 * `timestamptzNullableOptionalSchema` additionally allow explicitly clearing nullable columns to SQL NULL.
 */
export const trainingSessionUpdateSchema = createUpdateSchema(trainingSessions, {
  sessionCode: catalogCodeInputSchema.optional(),
  trainerId: nullableOptional(z.number().int()),
  locationId: nullableOptional(z.number().int()),
  startDate: dateStringSchema.optional(),
  endDate: dateStringSchema.optional(),
  startTime: timestamptzNullableOptionalSchema,
  endTime: timestamptzNullableOptionalSchema,
  maxParticipants: nullableOptional(courseMaxParticipantsSchema),
  enrolledCount: nullableOptional(nonNegativeIntSchema),
  venue: nullableOptional(shortLabel500Schema),
  meetingUrl: nullableOptional(contentUrlSchema),
  status: sessionStatusZodEnum.optional(),
}).superRefine(refineEndDateOnOrAfterStartDate);

export type TrainingSession = typeof trainingSessions.$inferSelect;
export type NewTrainingSession = typeof trainingSessions.$inferInsert;
