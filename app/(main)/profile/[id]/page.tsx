import { DoctorProfileView } from "@/components/profile/doctor-profile-view";
import { ProfilePageHeader } from "@/components/profile/profile-page-header";

export default function ProfilePage({
  params,
}: {
  params: { id: string };
}) {
  return (
    <div className="pb-6 pt-2">
      <ProfilePageHeader />
      <DoctorProfileView userId={params.id} />
    </div>
  );
}
