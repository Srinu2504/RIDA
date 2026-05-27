import { DoctorProfileView } from "@/components/profile/doctor-profile-view";

export default function ProfilePage({
  params,
}: {
  params: { id: string };
}) {
  return (
    <div className="pb-6 pt-2">
      <DoctorProfileView userId={params.id} />
    </div>
  );
}
