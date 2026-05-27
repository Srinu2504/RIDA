import { z } from "zod";

export const signupSchema = z
  .object({
    fullName: z.string().min(2, "Name must be at least 2 characters"),
    email: z.string().email("Invalid email address"),
    password: z
      .string()
      .min(8, "Password must be at least 8 characters")
      .regex(/[A-Z]/, "Must contain an uppercase letter")
      .regex(/[0-9]/, "Must contain a number"),
    confirmPassword: z.string(),
    role: z.enum(["DOCTOR", "PATIENT"]),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

export const verifyOtpSchema = z.object({
  email: z.string().email(),
  otp: z.string().length(6, "OTP must be 6 digits"),
});

export const signinSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1, "Password is required"),
});

const optionalPhoto = z
  .string()
  .optional()
  .or(z.literal(""))
  .refine(
    (val) =>
      !val ||
      val.startsWith("http") ||
      val.startsWith("https") ||
      val.startsWith("data:image"),
    { message: "Invalid profile photo" }
  );

export const profileStep1Schema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  gender: z.enum(["Male", "Female", "Prefer not to say"]),
  bio: z.string().max(300).optional(),
  profilePhoto: optionalPhoto,
});

export const profileStep2Schema = z.object({
  medicalLicenseNo: z.string().min(1, "License number is required"),
  specialty: z.string().min(1, "Specialty is required"),
  subSpecialty: z.string().optional(),
  qualification: z.enum(["MBBS", "MD", "MS", "DM", "MCh", "Other"]),
  additionalDegrees: z.string().optional(),
  yearsOfExperience: z.coerce.number().min(0).max(60),
});

export const profileStep3Schema = z.object({
  hospitalName: z.string().optional(),
  clinicName: z.string().optional(),
  city: z.string().min(1, "City is required"),
  state: z.string().min(1, "State is required"),
  country: z.string().min(1, "Country is required"),
  consultationFee: z.preprocess(
    (val) => (val === "" || val === undefined || val === null ? undefined : val),
    z.coerce.number().min(0).optional()
  ),
});

export const profileStep4Schema = z.object({
  phone: z.string().optional(),
  website: z
    .string()
    .optional()
    .or(z.literal(""))
    .refine(
      (val) => !val || val.startsWith("http://") || val.startsWith("https://"),
      { message: "Website must start with http:// or https://" }
    ),
  profileVisibility: z.enum(["PUBLIC", "CONNECTIONS_ONLY"]),
});

export const doctorProfileSchema = profileStep1Schema
  .merge(profileStep2Schema)
  .merge(profileStep3Schema)
  .merge(profileStep4Schema);

export const connectionActionSchema = z.object({
  status: z.enum(["ACCEPTED", "REJECTED"]),
});

export const SPECIALTIES = [
  "Cardiology",
  "Dermatology",
  "Emergency Medicine",
  "Family Medicine",
  "Gastroenterology",
  "General Surgery",
  "Internal Medicine",
  "Neurology",
  "Obstetrics & Gynecology",
  "Oncology",
  "Orthopedics",
  "Pediatrics",
  "Psychiatry",
  "Pulmonology",
  "Radiology",
  "Urology",
  "Other",
] as const;

export function formatZodErrors(error: z.ZodError): string {
  return error.issues.map((i) => i.message).join(". ");
}
