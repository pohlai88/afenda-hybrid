import { defineRelations } from "drizzle-orm";
import { courseModules } from "./fundamentals/courseModules";
import { courses } from "./fundamentals/courses";
import { learningPathCourses } from "./fundamentals/learningPathCourses";
import { learningPaths } from "./fundamentals/learningPaths";
import { trainers } from "./fundamentals/trainers";
import { assessments } from "./operations/assessments";
import { certificationAwards } from "./operations/certificationAwards";
import { courseEnrollments } from "./operations/courseEnrollments";
import { learningPathAssignments } from "./operations/learningPathAssignments";
import { learningPathCourseProgress } from "./operations/learningPathCourseProgress";
import { trainingCostRecords } from "./operations/trainingCostRecords";
import { trainingEnrollments } from "./operations/trainingEnrollments";
import { trainingFeedback } from "./operations/trainingFeedback";
import { trainingSessions } from "./operations/trainingSessions";
import { currencies } from "../../schema-platform/core/currencies";
import { locations } from "../../schema-platform/core/locations";
import { tenants } from "../../schema-platform/core/tenants";
import { employees } from "../hr/fundamentals/employees";
import { certifications } from "../talent/fundamentals/certifications";

export const learningRelations = defineRelations(
  {
    assessments,
    certificationAwards,
    courseEnrollments,
    courseModules,
    courses,
    learningPathAssignments,
    learningPathCourseProgress,
    learningPathCourses,
    learningPaths,
    trainers,
    trainingCostRecords,
    trainingEnrollments,
    trainingFeedback,
    trainingSessions,
    certifications,
    currencies,
    employees,
    locations,
    tenants,
  },
  (r) => ({
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
      certification: r.one.certifications({
        from: r.certificationAwards.certificationId,
        to: r.certifications.certificationId,
      }),
      employee: r.one.employees({
        from: r.certificationAwards.employeeId,
        to: r.employees.employeeId,
      }),
    },

    courseEnrollments: {
      tenant: r.one.tenants({
        from: r.courseEnrollments.tenantId,
        to: r.tenants.tenantId,
      }),
      assigner: r.one.employees({
        from: r.courseEnrollments.assignedBy,
        to: r.employees.employeeId,
        optional: true,
        alias: "course_enrollments_assigner",
      }),
      course: r.one.courses({
        from: r.courseEnrollments.courseId,
        to: r.courses.courseId,
      }),
      employee: r.one.employees({
        from: r.courseEnrollments.employeeId,
        to: r.employees.employeeId,
      }),
      learningPathCourseProgress: r.many.learningPathCourseProgress({
        from: r.courseEnrollments.courseEnrollmentId,
        to: r.learningPathCourseProgress.courseEnrollmentId,
      }),
    },

    courseModules: {
      tenant: r.one.tenants({
        from: r.courseModules.tenantId,
        to: r.tenants.tenantId,
      }),
      course: r.one.courses({
        from: r.courseModules.courseId,
        to: r.courses.courseId,
      }),
    },

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
      assessments: r.many.assessments({
        from: r.courses.courseId,
        to: r.assessments.courseId,
      }),
      courseEnrollments: r.many.courseEnrollments({
        from: r.courses.courseId,
        to: r.courseEnrollments.courseId,
      }),
      courseModules: r.many.courseModules({
        from: r.courses.courseId,
        to: r.courseModules.courseId,
      }),
      learningPathCourses: r.many.learningPathCourses({
        from: r.courses.courseId,
        to: r.learningPathCourses.courseId,
      }),
      trainingSessions: r.many.trainingSessions({
        from: r.courses.courseId,
        to: r.trainingSessions.courseId,
      }),
    },

    learningPathAssignments: {
      tenant: r.one.tenants({
        from: r.learningPathAssignments.tenantId,
        to: r.tenants.tenantId,
      }),
      employee: r.one.employees({
        from: r.learningPathAssignments.employeeId,
        to: r.employees.employeeId,
      }),
      learningPath: r.one.learningPaths({
        from: r.learningPathAssignments.learningPathId,
        to: r.learningPaths.learningPathId,
      }),
      learningPathCourseProgress: r.many.learningPathCourseProgress({
        from: r.learningPathAssignments.pathAssignmentId,
        to: r.learningPathCourseProgress.pathAssignmentId,
      }),
    },

    learningPathCourseProgress: {
      tenant: r.one.tenants({
        from: r.learningPathCourseProgress.tenantId,
        to: r.tenants.tenantId,
      }),
      courseEnrollment: r.one.courseEnrollments({
        from: r.learningPathCourseProgress.courseEnrollmentId,
        to: r.courseEnrollments.courseEnrollmentId,
        optional: true,
      }),
      pathAssignment: r.one.learningPathAssignments({
        from: r.learningPathCourseProgress.pathAssignmentId,
        to: r.learningPathAssignments.pathAssignmentId,
      }),
      pathCourse: r.one.learningPathCourses({
        from: r.learningPathCourseProgress.pathCourseId,
        to: r.learningPathCourses.pathCourseId,
      }),
      trainingEnrollment: r.one.trainingEnrollments({
        from: r.learningPathCourseProgress.trainingEnrollmentId,
        to: r.trainingEnrollments.enrollmentId,
        optional: true,
      }),
    },

    learningPathCourses: {
      tenant: r.one.tenants({
        from: r.learningPathCourses.tenantId,
        to: r.tenants.tenantId,
      }),
      course: r.one.courses({
        from: r.learningPathCourses.courseId,
        to: r.courses.courseId,
      }),
      learningPath: r.one.learningPaths({
        from: r.learningPathCourses.learningPathId,
        to: r.learningPaths.learningPathId,
      }),
      learningPathCourseProgress: r.many.learningPathCourseProgress({
        from: r.learningPathCourses.pathCourseId,
        to: r.learningPathCourseProgress.pathCourseId,
      }),
    },

    learningPaths: {
      tenant: r.one.tenants({
        from: r.learningPaths.tenantId,
        to: r.tenants.tenantId,
      }),
      learningPathAssignments: r.many.learningPathAssignments({
        from: r.learningPaths.learningPathId,
        to: r.learningPathAssignments.learningPathId,
      }),
      learningPathCourses: r.many.learningPathCourses({
        from: r.learningPaths.learningPathId,
        to: r.learningPathCourses.learningPathId,
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
      trainingSessions: r.many.trainingSessions({
        from: r.trainers.trainerId,
        to: r.trainingSessions.trainerId,
      }),
    },

    trainingCostRecords: {
      tenant: r.one.tenants({
        from: r.trainingCostRecords.tenantId,
        to: r.tenants.tenantId,
      }),
      currency: r.one.currencies({
        from: r.trainingCostRecords.currencyId,
        to: r.currencies.currencyId,
      }),
      session: r.one.trainingSessions({
        from: r.trainingCostRecords.sessionId,
        to: r.trainingSessions.sessionId,
      }),
    },

    trainingEnrollments: {
      tenant: r.one.tenants({
        from: r.trainingEnrollments.tenantId,
        to: r.tenants.tenantId,
      }),
      approver: r.one.employees({
        from: r.trainingEnrollments.approvedBy,
        to: r.employees.employeeId,
        optional: true,
        alias: "training_enrollments_approver",
      }),
      employee: r.one.employees({
        from: r.trainingEnrollments.employeeId,
        to: r.employees.employeeId,
      }),
      session: r.one.trainingSessions({
        from: r.trainingEnrollments.sessionId,
        to: r.trainingSessions.sessionId,
      }),
      learningPathCourseProgress: r.many.learningPathCourseProgress({
        from: r.trainingEnrollments.enrollmentId,
        to: r.learningPathCourseProgress.trainingEnrollmentId,
      }),
    },

    trainingFeedback: {
      tenant: r.one.tenants({
        from: r.trainingFeedback.tenantId,
        to: r.tenants.tenantId,
      }),
      employee: r.one.employees({
        from: r.trainingFeedback.employeeId,
        to: r.employees.employeeId,
      }),
      session: r.one.trainingSessions({
        from: r.trainingFeedback.sessionId,
        to: r.trainingSessions.sessionId,
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
      location: r.one.locations({
        from: r.trainingSessions.locationId,
        to: r.locations.locationId,
        optional: true,
      }),
      trainer: r.one.trainers({
        from: r.trainingSessions.trainerId,
        to: r.trainers.trainerId,
        optional: true,
      }),
      trainingCostRecords: r.many.trainingCostRecords({
        from: r.trainingSessions.sessionId,
        to: r.trainingCostRecords.sessionId,
      }),
      trainingEnrollments: r.many.trainingEnrollments({
        from: r.trainingSessions.sessionId,
        to: r.trainingEnrollments.sessionId,
      }),
      trainingFeedback: r.many.trainingFeedback({
        from: r.trainingSessions.sessionId,
        to: r.trainingFeedback.sessionId,
      }),
    },
  })
);
