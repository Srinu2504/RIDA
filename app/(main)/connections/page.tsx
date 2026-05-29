import { ConnectionList } from "@/components/connections/connection-list";
import { PageBackHeader } from "@/components/shared/page-back-header";

export default function ConnectionsPage() {
  return (
    <div className="mx-auto max-w-[1200px] px-4 py-5 md:px-6">
      <PageBackHeader
        title="My network"
        subtitle="Manage pending requests and connections"
      />
      <ConnectionList />
    </div>
  );
}
