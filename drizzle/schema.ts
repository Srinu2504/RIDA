import {
  pgTable,
  text,
  boolean,
  integer,
  timestamp,
  pgEnum,
} from "drizzle-orm/pg-core";
import { createId } from "@paralleldrive/cuid2";

export const roleEnum = pgEnum("role", ["DOCTOR", "PATIENT"]);
export const connectionStatusEnum = pgEnum("connection_status", [
  "PENDING",
  "ACCEPTED",
  "REJECTED",
  "BLOCKED",
]);
export const profileVisibilityEnum = pgEnum("profile_visibility", [
  "PUBLIC",
  "CONNECTIONS_ONLY",
]);

export const users = pgTable("users", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => createId()),
  email: text("email").notNull().unique(),
  password: text("password").notNull(),
  fullName: text("full_name").notNull(),
  role: roleEnum("role").default("DOCTOR").notNull(),
  isEmailVerified: boolean("is_email_verified").default(false).notNull(),
  isProfileComplete: boolean("is_profile_complete").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const otpTokens = pgTable("otp_tokens", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => createId()),
  email: text("email").notNull(),
  otpHash: text("otp_hash").notNull(),
  passwordHash: text("password_hash").notNull(),
  fullName: text("full_name").notNull(),
  role: roleEnum("role").notNull(),
  attempts: integer("attempts").default(0).notNull(),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const doctorProfiles = pgTable("doctor_profiles", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => createId()),
  userId: text("user_id")
    .notNull()
    .references(() => users.id),
  firstName: text("first_name").notNull(),
  lastName: text("last_name").notNull(),
  profilePhoto: text("profile_photo"),
  bio: text("bio"),
  gender: text("gender"),
  medicalLicenseNo: text("medical_license_no").notNull().unique(),
  specialty: text("specialty").notNull(),
  subSpecialty: text("sub_specialty"),
  yearsOfExperience: integer("years_of_experience").notNull(),
  qualification: text("qualification").notNull(),
  additionalDegrees: text("additional_degrees"),
  hospitalName: text("hospital_name"),
  clinicName: text("clinic_name"),
  city: text("city").notNull(),
  state: text("state").notNull(),
  country: text("country").notNull(),
  consultationFee: integer("consultation_fee"),
  phone: text("phone"),
  website: text("website"),
  profileVisibility: profileVisibilityEnum("profile_visibility")
    .default("PUBLIC")
    .notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const connections = pgTable("connections", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => createId()),
  senderId: text("sender_id")
    .notNull()
    .references(() => users.id),
  receiverId: text("receiver_id")
    .notNull()
    .references(() => users.id),
  status: connectionStatusEnum("status").default("PENDING").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const notifications = pgTable("notifications", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => createId()),
  userId: text("user_id")
    .notNull()
    .references(() => users.id),
  type: text("type").notNull(),
  message: text("message").notNull(),
  relatedUserId: text("related_user_id"),
  connectionId: text("connection_id"),
  isRead: boolean("is_read").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});
