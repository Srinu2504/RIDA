import { NotificationList } from "@/components/connections/notification-list";

export default function NotificationsPage() {
  return (
    <div className="px-4 py-5 md:px-6">
      <div className="mb-5 text-center md:text-left">
        <h1 className="text-[17px] font-extrabold text-text-dark">Alerts</h1>
        <p className="text-[11px] text-text-muted">
          Connection requests and updates
        </p>
      </div>
      <NotificationList />
    </div>
  );
}
