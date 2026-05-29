import { create } from "zustand";
import type { z } from "zod";
import type {
  profileStep1Schema,
  profileStep2Schema,
  profileStep3Schema,
  profileStep4Schema,
  studentProfileStep2Schema,
  studentProfileStep3Schema,
} from "@/lib/validations";

type Step1 = z.infer<typeof profileStep1Schema>;
type PhysicianStep2 = z.infer<typeof profileStep2Schema>;
type PhysicianStep3 = z.infer<typeof profileStep3Schema>;
type StudentStep2 = z.infer<typeof studentProfileStep2Schema>;
type StudentStep3 = z.infer<typeof studentProfileStep3Schema>;
type Step4 = z.infer<typeof profileStep4Schema>;

interface ProfileWizardState {
  step: number;
  step1: Partial<Step1>;
  step2: Partial<PhysicianStep2 | StudentStep2>;
  step3: Partial<PhysicianStep3 | StudentStep3>;
  step4: Partial<Step4>;
  setStep: (step: number) => void;
  setStep1: (data: Partial<Step1>) => void;
  setStep2: (data: Partial<PhysicianStep2 | StudentStep2>) => void;
  setStep3: (data: Partial<PhysicianStep3 | StudentStep3>) => void;
  setStep4: (data: Partial<Step4>) => void;
  reset: () => void;
}

export const useProfileWizardStore = create<ProfileWizardState>((set) => ({
  step: 1,
  step1: {},
  step2: {},
  step3: {},
  step4: {},
  setStep: (step) => set({ step }),
  setStep1: (data) => set((s) => ({ step1: { ...s.step1, ...data } })),
  setStep2: (data) => set((s) => ({ step2: { ...s.step2, ...data } })),
  setStep3: (data) => set((s) => ({ step3: { ...s.step3, ...data } })),
  setStep4: (data) => set((s) => ({ step4: { ...s.step4, ...data } })),
  reset: () =>
    set({ step: 1, step1: {}, step2: {}, step3: {}, step4: {} }),
}));
