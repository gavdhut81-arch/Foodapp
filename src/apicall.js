const API = (process.env.REACT_APP_API_URL || "").replace(/\/$/, "");

export async function analyzeFood(file) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 90000); // 90s (Render cold start)

  try {
    const form = new FormData();
    form.append("image", file); // must match upload.single("image")

    const res = await fetch(`${API}/api/analyze-food`, {
      method: "POST",
      body: form,
      signal: controller.signal,
    });

    let data = {};
    try {
      data = await res.json();
    } catch {}

    if (!res.ok) throw new Error(data.error || `Server error (${res.status})`);
    return data;
  } catch (e) {
    if (e.name === "AbortError") {
      throw new Error("Server is waking up. Please try again in a minute.");
    }
    throw e;
  } finally {
    clearTimeout(timer);
  }
}
