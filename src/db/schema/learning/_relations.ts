import { defineRelations } from "drizzle-orm";
import { tenants } from "../core/tenants";
import { locations } from "../core/locations";
import { currencies } from "../core/currencies";
import { employees } from "../hr/fundamentals/employees";
import { certifications } from "../talent/fundamentals/certifications";
import { courses } from "./fundamentals/courses";
import { courseModules } from "./fundamentals/courseModules";
import { trainers } from "./fundamentals/trainers";
import { learningPaths } from "./fundamentals/learningPaths";
import { learningPathCourses } from "./fundamentals/learningPathCourses";
import { trainingSessions } from "./operations/trainingSessions";
import { trainingEnrollments } from "./operations/trainingEnrollments";
import { assessments } from "./operations/assessments";
import { certificationAwards } from "./operations/certificationAwards";
import { trainingFeedback } from "./operations/trainingFeedback";
import { trainingCostRecords } from "./operations/trainingCostRecords";

export const learningRelations = defineRelations(
  {
    tenants,
    locations,
    currencies,
    employees,
    certifications,
    courses,
    courseModules,
    trainers,
    learningPaths,
    learningPathCourses,
    trainingSessions,
    trainingEnrollments,
    assessments,
    certificationAwards,
    trainingFeedback,
    trainingCostRecords,
  },
  (r) => ({
    courses: {
      tenant: r.one.tenants({
        from: r.courses.tenantId,
        to: r.tenants.tenantId,
      }),
      currency: r.one.currencies({
        from: r.courses.currencyId,
        to: r.currencies.currencyId,
        optional: true,
      }),
      modules: r.many.courseModules({
        from: r.courses.courseId,
        to: r.courseModules.courseId,
      }),
      trainingSessions: r.many.trainingSessions({
        from: r.courses.courseId,
        to: r.trainingSessions.courseId,
      }),
      assessments: r.many.assessments({
        from: r.courses.courseId,
        to: r.assessments.courseId,
      }),
      pathLinks: r.many.learningPathCourses({
        from: r.courses.courseId,
        to: r.learningPathCourses.courseId,
      }),
    },
    courseModules: {
      course: r.one.courses({
        from: r.courseModules.courseId,
        to: r.courses.courseId,
      }),
    },
    trainers: {
      tenant: r.one.tenants({
        from: r.trainers.tenantId,
        to: r.tenants.tenantId,
      }),
      employee: r.one.employees({
        from: r.trainers.employeeId,
        to: r.employees.employeeId,
        optional: true,
      }),
      sessions: r.many.trainingSessions({
        from: r.trainers.trainerId,
        to: r.trainingSessions.trainerId,
      }),
    },
    learningPaths: {
      tenant: r.one.tenants({
        from: r.learningPaths.tenantId,
        to: r.tenants.tenantId,
      }),
      pathCourses: r.many.learningPathCourses({
        from: r.learningPaths.learningPathId,
        to: r.learningPathCourses.learningPathId,
      }),
    },
    learningPathCourses: {
      path: r.one.learningPaths({
        from: r.learningPathCourses.learningPathId,
        to: r.learningPaths.learningPathId,
      }),
      course: r.one.courses({
        from: r.learningPathCourses.courseId,
        to: r.courses.courseId,
      }),
    },
    trainingSessions: {
      tenant: r.one.tenants({
        from: r.trainingSessions.tenantId,
        to: r.tenants.tenantId,
      }),
      course: r.one.courses({
        from: r.trainingSessions.courseId,
        to: r.courses.courseId,
      }),
      trainer: r.one.trainers({
        from: r.trainingSessions.trainerId,
        to: r.trainers.trainerId,
        optional: true,
      }),
      location: r.one.locations({
        from: r.trainingSessions.locationId,
        to: r.locations.locationId,
        optional: true,
      }),
      enrollments: r.many.trainingEnrollments({
        from: r.trainingSessions.sessionId,
        to: r.trainingEnrollments.sessionId,
      }),
      feedback: r.many.trainingFeedback({
        from: r.trainingSessions.sessionId,
        to: r.trainingFeedback.sessionId,
      }),
      costRecords: r.many.trainingCostRecords({
        from: r.trainingSessions.sessionId,
        to: r.trainingCostRecords.sessionId,
      }),
    },
    trainingEnrollments: {
      tenant: r.one.tenants({
        from: r.trainingEnrollments.tenantId,
        to: r.tenants.tenantId,
      }),
      session: r.one.trainingSessions({
        from: r.trainingEnrollments.sessionId,
        to: r.trainingSessions.sessionId,
      }),
      employee: r.one.employees({
        from: r.trainingEnrollments.employeeId,
        to: r.employees.employeeId,
      }),
      approver: r.one.employees({
        from: r.trainingEnrollments.approvedBy,
        to: r.employees.employeeId,
        optional: true,
        alias: "training_enrollment_approver",
      }),
    },
    assessments: {
      tenant: r.one.tenants({
        from: r.assessments.tenantId,
        to: r.tenants.tenantId,
      }),
      course: r.one.courses({
        from: r.assessments.courseId,
        to: r.courses.courseId,
      }),
      employee: r.one.employees({
        from: r.assessments.employeeId,
        to: r.employees.employeeId,
      }),
    },
    certificationAwards: {
      tenant: r.one.tenants({
        from: r.certificationAwards.tenantId,
        to: r.tenants.tenantId,
      }),
      employee: r.one.employees({
        from: r.certificationAwards.employeeId,
        to: r.employees.employeeId,
      }),
      certification: r.one.certifications({
        from: r.certificationAwards.certificationId,
        to: r.certifications.certificationId,
      }),
    },
    trainingFeedback: {
      session: r.one.trainingSessions({
        from: r.trainingFeedback.sessionId,
        to: r.trainingSessions.sessionId,
      }),
      employee: r.one.employees({
        from: r.trainingFeedback.employeeId,
        to: r.employees.employeeId,
      }),
    },
    trainingCostRecords: {
      tenant: r.one.tenants({
        from: r.trainingCostRecords.tenantId,
        to: r.tenants.tenantId,
      }),
      session: r.one.trainingSessions({
        from: r.trainingCostRecords.sessionId,
        to: r.trainingSessions.sessionId,
      }),
      currency: r.one.currencies({
        from: r.trainingCostRecords.currencyId,
        to: r.currencies.currencyId,
      }),
    },
  })
);
