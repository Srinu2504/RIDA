"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import toast from "react-hot-toast";
import {
  doctorProfileSchema,
  profileStep1Schema,
  profileStep2Schema,
  profileStep3Schema,
  profileStep4Schema,
  SPECIALTIES,
  formatZodErrors,
} from "@/lib/validations";
import { useProfileWizardStore } from "@/lib/stores/profile-wizard-store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

const STEP_LABELS = ["Personal", "Credentials", "Practice", "Contact"];

type Step1 = z.infer<typeof profileStep1Schema>;
type Step2 = z.infer<typeof profileStep2Schema>;
type Step3 = z.infer<typeof profileStep3Schema>;
type Step4 = z.infer<typeof profileStep4Schema>;
type FullProfile = z.infer<typeof doctorProfileSchema>;

export function ProfileWizard() {
  const router = useRouter();
  const { update } = useSession();
  const {
    step,
    setStep,
    step1,
    step2,
    step3,
    step4,
    setStep1,
    setStep2,
    setStep3,
    setStep4,
    reset,
  } = useProfileWizardStore();
  const [loading, setLoading] = useState(false);
  const [photoPreview, setPhotoPreview] = useState(
    (step1.profilePhoto as string) ?? ""
  );

  const handlePhoto = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = async () => {
      const base64 = reader.result as string;
      setPhotoPreview(base64);
      try {
        const res = await fetch("/api/upload/photo", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ image: base64 }),
        });
        const json = await res.json();
        const url = json.url ?? base64;
        setStep1({ profilePhoto: url });
        setPhotoPreview(url);
      } catch {
        setStep1({ profilePhoto: base64 });
      }
    };
    reader.readAsDataURL(file);
  };

  const submitAll = async (payload: FullProfile) => {
    const parsed = doctorProfileSchema.safeParse(payload);

    if (!parsed.success) {
      toast.error(formatZodErrors(parsed.error));
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/users/profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(parsed.data),
      });
      const json = await res.json();

      if (!res.ok) {
        if (typeof json.error === "string") {
          toast.error(json.error);
        } else if (json.error && typeof json.error === "object") {
          const messages = Object.values(json.error)
            .flat()
            .filter(Boolean)
            .join(". ");
          toast.error(messages || "Failed to save profile");
        } else {
          toast.error("Failed to save profile");
        }
        return;
      }

      await update({ isProfileComplete: true });
      reset();
      toast.success("Profile complete!");
      router.push("/feed");
      router.refresh();
    } catch {
      toast.error("Failed to save profile");
    } finally {
      setLoading(false);
    }
  };

  const goNext = async (
    stepNum: number,
    data: Step1 | Step2 | Step3 | Step4
  ) => {
    if (stepNum === 1) {
      const merged: Step1 = {
        ...(data as Step1),
        profilePhoto:
          (step1 as Partial<Step1>).profilePhoto ??
          (data as Step1).profilePhoto,
      };
      setStep1(merged);
    }
    if (stepNum === 2) setStep2(data as Step2);
    if (stepNum === 3) setStep3(data as Step3);
    if (stepNum === 4) setStep4(data as Step4);

    if (stepNum < 4) {
      setStep(stepNum + 1);
      return;
    }

    const fullPayload: FullProfile = {
      ...(stepNum === 1 ? (data as Step1) : (step1 as Step1)),
      ...(stepNum === 2 ? (data as Step2) : (step2 as Step2)),
      ...(stepNum === 3 ? (data as Step3) : (step3 as Step3)),
      ...(data as Step4),
    };

    await submitAll(fullPayload);
  };

  return (
    <div className="mx-auto w-full max-w-[560px]">
      <div className="mb-6">
        <div className="mb-3 flex justify-between gap-1">
          {STEP_LABELS.map((label, i) => {
            const stepNum = i + 1;
            const active = step >= stepNum;
            return (
              <div key={label} className="flex flex-1 flex-col items-center gap-1">
                <div
                  className={cn(
                    "h-1.5 w-full rounded-full transition-colors",
                    active ? "bg-green-primary" : "border border-green-primary bg-cream-input"
                  )}
                />
                <span
                  className={cn(
                    "text-[10px] font-semibold",
                    step === stepNum
                      ? "text-green-primary"
                      : "text-text-muted"
                  )}
                >
                  {label}
                </span>
              </div>
            );
          })}
        </div>
        <div className="flex justify-center gap-2">
          {[1, 2, 3, 4].map((n) => (
            <span
              key={n}
              className={cn(
                "h-2 w-2 rounded-full",
                step === n ? "bg-green-primary" : "border border-green-primary bg-cream-input"
              )}
            />
          ))}
        </div>
      </div>

      <div className="rida-card p-6">
        {step === 1 && (
          <Step1Form
            defaults={step1 as Partial<Step1>}
            photoPreview={photoPreview}
            onPhoto={handlePhoto}
            onNext={(data) => goNext(1, data)}
          />
        )}
        {step === 2 && (
          <Step2Form
            defaults={step2 as Partial<Step2>}
            onNext={(data) => goNext(2, data)}
            onBack={() => setStep(1)}
          />
        )}
        {step === 3 && (
          <Step3Form
            defaults={step3 as Partial<Step3>}
            onNext={(data) => goNext(3, data)}
            onBack={() => setStep(2)}
          />
        )}
        {step === 4 && (
          <Step4Form
            defaults={step4 as Partial<Step4>}
            onNext={(data) => goNext(4, data)}
            onBack={() => setStep(3)}
            loading={loading}
          />
        )}
      </div>
    </div>
  );
}

function Step1Form({
  defaults,
  photoPreview,
  onPhoto,
  onNext,
}: {
  defaults: Partial<Step1>;
  photoPreview: string;
  onPhoto: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onNext: (data: Step1) => void;
}) {
  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm<Step1>({
    resolver: zodResolver(profileStep1Schema),
    defaultValues: {
      gender: "Prefer not to say",
      ...defaults,
    },
  });

  return (
    <form onSubmit={handleSubmit(onNext)} className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <Label>First name</Label>
          <Input {...register("firstName")} />
            {errors.firstName && (
              <p className="mt-1 text-[10px] text-[#c0392b]">{errors.firstName.message}</p>
            )}
        </div>
        <div>
          <Label>Last name</Label>
          <Input {...register("lastName")} />
            {errors.lastName && (
              <p className="mt-1 text-[10px] text-[#c0392b]">{errors.lastName.message}</p>
            )}
        </div>
      </div>
      <div>
        <Label>Gender</Label>
        <Controller
          name="gender"
          control={control}
          render={({ field }) => (
            <Select value={field.value} onValueChange={field.onChange}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Male">Male</SelectItem>
                <SelectItem value="Female">Female</SelectItem>
                <SelectItem value="Prefer not to say">
                  Prefer not to say
                </SelectItem>
              </SelectContent>
            </Select>
          )}
        />
      </div>
      <div>
        <Label>Profile photo</Label>
        <Input type="file" accept="image/*" onChange={onPhoto} />
        {photoPreview && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={photoPreview}
            alt="Preview"
            className="mt-2 h-24 w-24 rounded-full object-cover"
          />
        )}
      </div>
      <div>
        <Label>Bio (max 300 chars)</Label>
        <Textarea {...register("bio")} maxLength={300} />
      </div>
      <Button type="submit" className="w-full">
        Continue
      </Button>
    </form>
  );
}

function Step2Form({
  defaults,
  onNext,
  onBack,
}: {
  defaults: Partial<Step2>;
  onNext: (data: Step2) => void;
  onBack: () => void;
}) {
  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm<Step2>({
    resolver: zodResolver(profileStep2Schema),
    defaultValues: {
      qualification: "MBBS",
      yearsOfExperience: 0,
      ...defaults,
    },
  });

  return (
    <form onSubmit={handleSubmit(onNext)} className="space-y-4">
      <div>
        <Label>Medical license number</Label>
        <Input {...register("medicalLicenseNo")} />
        {errors.medicalLicenseNo && (
          <p className="mt-1 text-sm text-error">
            {errors.medicalLicenseNo.message}
          </p>
        )}
      </div>
      <div>
        <Label>Primary specialty</Label>
        <Controller
          name="specialty"
          control={control}
          rules={{ required: true }}
          render={({ field }) => (
            <Select value={field.value ?? ""} onValueChange={field.onChange}>
              <SelectTrigger>
                <SelectValue placeholder="Select specialty" />
              </SelectTrigger>
              <SelectContent>
                {SPECIALTIES.map((s) => (
                  <SelectItem key={s} value={s}>
                    {s}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        />
        {errors.specialty && (
          <p className="mt-1 text-sm text-error">{errors.specialty.message}</p>
        )}
      </div>
      <div>
        <Label>Sub-specialty (optional)</Label>
        <Input {...register("subSpecialty")} />
      </div>
      <div>
        <Label>Qualification</Label>
        <Controller
          name="qualification"
          control={control}
          render={({ field }) => (
            <Select value={field.value} onValueChange={field.onChange}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {["MBBS", "MD", "MS", "DM", "MCh", "Other"].map((q) => (
                  <SelectItem key={q} value={q}>
                    {q}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        />
      </div>
      <div>
        <Label>Additional degrees (optional)</Label>
        <Input {...register("additionalDegrees")} />
      </div>
      <div>
        <Label>Years of experience</Label>
        <Input type="number" min={0} {...register("yearsOfExperience")} />
        {errors.yearsOfExperience && (
          <p className="mt-1 text-sm text-error">
            {errors.yearsOfExperience.message}
          </p>
        )}
      </div>
      <div className="flex gap-2">
        <Button type="button" variant="outline" onClick={onBack}>
          Back
        </Button>
        <Button type="submit" className="flex-1">
          Continue
        </Button>
      </div>
    </form>
  );
}

function Step3Form({
  defaults,
  onNext,
  onBack,
}: {
  defaults: Partial<Step3>;
  onNext: (data: Step3) => void;
  onBack: () => void;
}) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<Step3>({
    resolver: zodResolver(profileStep3Schema),
    defaultValues: defaults,
  });

  return (
    <form onSubmit={handleSubmit(onNext)} className="space-y-4">
      <div>
        <Label>Hospital / institution</Label>
        <Input {...register("hospitalName")} />
      </div>
      <div>
        <Label>Clinic name (optional)</Label>
        <Input {...register("clinicName")} />
      </div>
      <div className="grid gap-4 sm:grid-cols-3">
        <div>
          <Label>City</Label>
          <Input {...register("city")} />
          {errors.city && (
            <p className="mt-1 text-sm text-error">{errors.city.message}</p>
          )}
        </div>
        <div>
          <Label>State</Label>
          <Input {...register("state")} />
          {errors.state && (
            <p className="mt-1 text-sm text-error">{errors.state.message}</p>
          )}
        </div>
        <div>
          <Label>Country</Label>
          <Input {...register("country")} />
          {errors.country && (
            <p className="mt-1 text-sm text-error">{errors.country.message}</p>
          )}
        </div>
      </div>
      <div>
        <Label>Consultation fee (optional)</Label>
        <Input type="number" min={0} {...register("consultationFee")} />
      </div>
      <div className="flex gap-2">
        <Button type="button" variant="outline" onClick={onBack}>
          Back
        </Button>
        <Button type="submit" className="flex-1">
          Continue
        </Button>
      </div>
    </form>
  );
}

function Step4Form({
  defaults,
  onNext,
  onBack,
  loading,
}: {
  defaults: Partial<Step4>;
  onNext: (data: Step4) => void;
  onBack: () => void;
  loading: boolean;
}) {
  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm<Step4>({
    resolver: zodResolver(profileStep4Schema),
    defaultValues: {
      profileVisibility: "PUBLIC",
      phone: "",
      website: "",
      ...defaults,
    },
  });

  return (
    <form onSubmit={handleSubmit(onNext)} className="space-y-4">
      <div>
        <Label>Phone (optional)</Label>
        <Input {...register("phone")} />
      </div>
      <div>
        <Label>Website / LinkedIn (optional)</Label>
        <Input {...register("website")} placeholder="https://" />
        {errors.website && (
          <p className="mt-1 text-sm text-error">{errors.website.message}</p>
        )}
      </div>
      <div>
        <Label>Profile visibility</Label>
        <Controller
          name="profileVisibility"
          control={control}
          render={({ field }) => (
            <Select value={field.value} onValueChange={field.onChange}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="PUBLIC">Public</SelectItem>
                <SelectItem value="CONNECTIONS_ONLY">
                  Connections only
                </SelectItem>
              </SelectContent>
            </Select>
          )}
        />
      </div>
      <div className="flex gap-2">
        <Button type="button" variant="outline" onClick={onBack} disabled={loading}>
          Back
        </Button>
        <Button type="submit" className="flex-1" disabled={loading}>
          {loading ? "Saving…" : "Complete profile"}
        </Button>
      </div>
    </form>
  );
}
