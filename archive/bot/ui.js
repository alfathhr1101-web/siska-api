export function findByText(xml, text) {
  const regex = new RegExp(
    `text="${text.replace(/[.*+?^${}()|[\]\\]/g, '\\\\$&')}"[^>]*bounds="\\[(\\d+),(\\d+)\\]\\[(\\d+),(\\d+)\\]"`
  );

  const m = xml.match(regex);
  if (!m) return null;

  const x = Math.floor((+m[1] + +m[3]) / 2);
  const y = Math.floor((+m[2] + +m[4]) / 2);

  return { x, y };
}