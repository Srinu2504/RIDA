export async function respondToConnection(
  connectionId: string,
  status: "ACCEPTED" | "REJECTED"
) {
  const res = await fetch(`/api/connections/${connectionId}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ status }),
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(json.error ?? "Action failed");
  }
  return json;
}
