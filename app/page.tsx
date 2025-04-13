export default async function Home() {
  const URI =
    "https://api.spectator.earth/acquisition-plan/?api_key=WpfYpxpckRfjpbU93JXRU9";

  const response = await fetch(URI);
  const data = await response.json();

  return <pre className="text-xs">{JSON.stringify(data, null, 2)}</pre>;
}
