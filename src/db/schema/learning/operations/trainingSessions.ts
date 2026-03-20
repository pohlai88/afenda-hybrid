import { integer, text, date, timestamp, smallint, index, uniqueIndex, foreignKey, check } from "drizzle-orm/pg-core";
import { createSelectSchema, createInsertSchema, createUpdateSchema } from "drizzle-orm/zod";
import { z } from "zod";
import { sql } from "drizzle-orm";
import { learningSchema } from "../_schema";
import { timestampColumns, softDeleteColumns, auditColumns } from "../../_shared";
import { tenants } from "../../core/tenants";
import { locations } from "../../core/locations";
import { courses } from "../fundamentals/courses";
import { trainers } from "../fundamentals/trainers";

/**
 * Training Sessions - Scheduled course delivery instances.
 */
export const sessionStatuses = ["SCHEDULED", "IN_PROGRESS", "COMPLETED", "CANCELLED", "POSTPONED"] as const;

export const sessionStatusEnum = learningSchema.enum("session_status", [...sessionStatuses]);

export const sessionStatusZodEnum = createSelectSchema(sessionStatusEnum);

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

export const trainingSessionSelectSchema = createSelectSchema(trainingSessions);

export const trainingSessionInsertSchema = createInsertSchema(trainingSessions, {
  sessionCode: z.string().min(2).max(50).regex(/^[A-Z0-9_-]+$/i, "Only alphanumeric, underscore, and hyphen allowed"),
  maxParticipants: z.number().int().min(1).max(1000).optional(),
  enrolledCount: z.number().int().min(0).optional(),
  venue: z.string().max(500).optional(),
  meetingUrl: z.string().url().max(500).optional(),
});

export const trainingSessionUpdateSchema = createUpdateSchema(trainingSessions);

export type TrainingSession = typeof trainingSessions.$inferSelect;
export type NewTrainingSession = typeof trainingSessions.$inferInsert;
