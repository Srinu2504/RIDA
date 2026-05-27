import { ConnectionList } from "@/components/connections/connection-list";

export default function ConnectionsPage() {
  return (
    <div className="mx-auto max-w-[1200px] px-4 py-5 md:px-6">
      <div className="mb-5">
        <h1 className="text-[17px] font-extrabold text-text-dark">
          My network
        </h1>
        <p className="text-[11px] text-text-muted">
          Manage pending requests and connections
        </p>
      </div>
      <ConnectionList />
    </div>
  );
}
