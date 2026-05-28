import {
  pgTable,
  text,
  boolean,
  integer,
  timestamp,
  pgEnum,
  uuid,
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

export const postTagEnum = pgEnum("post_tag", [
  "Case Study",
  "Article",
  "Update",
  "Photo",
]);

export const posts = pgTable("posts", {
  id: uuid("id").defaultRandom().primaryKey(),
  authorId: text("author_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  tag: postTagEnum("tag").notNull(),
  body: text("body").notNull(),
  imageUrl: text("image_url"),
  likeCount: integer("like_count").default(0),
  commentCount: integer("comment_count").default(0),
  saveCount: integer("save_count").default(0),
  repostCount: integer("repost_count").default(0),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const likes = pgTable("likes", {
  id: uuid("id").defaultRandom().primaryKey(),
  postId: uuid("post_id")
    .notNull()
    .references(() => posts.id, { onDelete: "cascade" }),
  doctorId: text("doctor_id").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const comments = pgTable("comments", {
  id: uuid("id").defaultRandom().primaryKey(),
  postId: uuid("post_id")
    .notNull()
    .references(() => posts.id, { onDelete: "cascade" }),
  authorId: text("author_id").notNull(),
  content: text("content").notNull(),
  parentId: uuid("parent_id"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const saves = pgTable("saves", {
  id: uuid("id").defaultRandom().primaryKey(),
  postId: uuid("post_id")
    .notNull()
    .references(() => posts.id, { onDelete: "cascade" }),
  doctorId: text("doctor_id").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const reposts = pgTable("reposts", {
  id: uuid("id").defaultRandom().primaryKey(),
  originalPostId: uuid("original_post_id")
    .notNull()
    .references(() => posts.id, { onDelete: "cascade" }),
  doctorId: text("doctor_id").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const conversations = pgTable("conversations", {
  id: uuid("id").defaultRandom().primaryKey(),
  doctorOneId: text("doctor_one_id").notNull(),
  doctorTwoId: text("doctor_two_id").notNull(),
  lastMessageAt: timestamp("last_message_at").defaultNow(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const messages = pgTable("messages", {
  id: uuid("id").defaultRandom().primaryKey(),
  conversationId: uuid("conversation_id")
    .notNull()
    .references(() => conversations.id, { onDelete: "cascade" }),
  senderId: text("sender_id").notNull(),
  content: text("content").notNull(),
  isRead: boolean("is_read").default(false),
  readAt: timestamp("read_at"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const notifications = pgTable("notifications", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => createId()),
  recipientId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  actorId: text("related_user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  type: text("type").notNull(),
  message: text("message").notNull().default(""),
  postId: uuid("post_id").references(() => posts.id, { onDelete: "cascade" }),
  commentId: uuid("comment_id").references(() => comments.id, {
    onDelete: "cascade",
  }),
  conversationId: uuid("conversation_id").references(() => conversations.id, {
    onDelete: "cascade",
  }),
  connectionId: text("connection_id"),
  isRead: boolean("is_read").default(false),
  readAt: timestamp("read_at"),
  createdAt: timestamp("created_at").defaultNow(),
});
