import type { doctorProfiles } from "@/drizzle/schema";
import type { z } from "zod";
import type {
  profileStep1Schema,
  profileStep2Schema,
  profileStep3Schema,
  profileStep4Schema,
  studentProfileStep2Schema,
  studentProfileStep3Schema,
} from "@/lib/validations";

type DoctorProfileRow = typeof doctorProfiles.$inferSelect;
type Step1 = z.infer<typeof profileStep1Schema>;
type PhysicianStep2 = z.infer<typeof profileStep2Schema>;
type PhysicianStep3 = z.infer<typeof profileStep3Schema>;
type StudentStep2 = z.infer<typeof studentProfileStep2Schema>;
type StudentStep3 = z.infer<typeof studentProfileStep3Schema>;
type Step4 = z.infer<typeof profileStep4Schema>;

const GENDERS = ["Male", "Female", "Prefer not to say"] as const;
const QUALIFICATIONS = ["MBBS", "MD", "MS", "DM", "MCh", "Other"] as const;

function asGender(value: string | null): Step1["gender"] {
  if (value && (GENDERS as readonly string[]).includes(value)) {
    return value as Step1["gender"];
  }
  return "Prefer not to say";
}

function asQualification(value: string): PhysicianStep2["qualification"] {
  if ((QUALIFICATIONS as readonly string[]).includes(value)) {
    return value as PhysicianStep2["qualification"];
  }
  return "Other";
}

export function profileToWizardSteps(
  profile: DoctorProfileRow,
  isStudent: boolean
):
  | {
      step1: Partial<Step1>;
      step2: Partial<PhysicianStep2>;
      step3: Partial<PhysicianStep3>;
      step4: Partial<Step4>;
    }
  | {
      step1: Partial<Step1>;
      step2: Partial<StudentStep2>;
      step3: Partial<StudentStep3>;
      step4: Partial<Step4>;
    } {
  const step1: Partial<Step1> = {
    firstName: profile.firstName,
    lastName: profile.lastName,
    gender: asGender(profile.gender),
    bio: profile.bio ?? undefined,
    profilePhoto: profile.profilePhoto ?? undefined,
  };

  const step4: Partial<Step4> = {
    phone: profile.phone ?? undefined,
    website: profile.website ?? "",
    profileVisibility: profile.profileVisibility,
  };

  if (isStudent) {
    return {
      step1,
      step2: {
        fieldOfStudy: profile.fieldOfStudy ?? profile.specialty,
        studyYearStarted: profile.studyYearStarted ?? undefined,
        studyYearEnding: profile.studyYearEnding ?? undefined,
      },
      step3: {
        university: profile.university ?? "",
        college: profile.college ?? "",
        city: profile.city,
        state: profile.state,
        country: profile.country,
      },
      step4,
    };
  }

  return {
    step1,
    step2: {
      medicalLicenseNo: profile.medicalLicenseNo,
      specialty: profile.specialty,
      subSpecialty: profile.subSpecialty ?? undefined,
      qualification: asQualification(profile.qualification),
      additionalDegrees: profile.additionalDegrees ?? undefined,
      yearsOfExperience: profile.yearsOfExperience,
    },
    step3: {
      hospitalName: profile.hospitalName ?? undefined,
      clinicName: profile.clinicName ?? undefined,
      city: profile.city,
      state: profile.state,
      country: profile.country,
      consultationFee: profile.consultationFee ?? undefined,
    },
    step4,
  };
}
