const endpoint =
  "https://api.spectator.earth/acquisition-plan/?api_key=WpfYpxpckRfjpbU93JXRU9";

async function getData<T>(url: string): Promise<T> {
  try {
    const response = await fetch(url);
    const data: T = await response.json();

    return data;
  } catch (error) {
    console.error("GET request failed:", error);
    throw error;
  }
}
