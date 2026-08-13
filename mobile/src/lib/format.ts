export function formatDate(ts: number) {
  try {
    return new Date(ts).toLocaleString("pt-AO", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return new Date(ts).toISOString();
  }
}

export function formatDateShort(ts: number) {
  try {
    return new Date(ts).toLocaleDateString("pt-AO");
  } catch {
    return new Date(ts).toISOString().slice(0, 10);
  }
}
