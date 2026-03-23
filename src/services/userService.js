export const userService = {
  async getAll() {
    const res = await fetch("/api/users");
    const data = await res.json();
    if (data.error) throw new Error(data.error);
    return data;
  },

  async create(payload) {
    const res = await fetch("/api/users", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    if (data.error) throw new Error(data.error);
    return data;
  },
};