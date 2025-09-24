import type { NextApiRequest, NextApiResponse } from "next";

function cors(res: NextApiResponse) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
}

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  cors(res);
  if (req.method === "OPTIONS") return res.status(200).end();

  const phases = [
    { code: "schetsontwerp", name: "Schetsontwerp", sort_order: 1 },
    { code: "voorlopig-ontwerp", name: "Voorlopig ontwerp", sort_order: 2 },
    { code: "vo-tekeningen", name: "VO tekeningen", sort_order: 3 },
    { code: "definitief-ontwerp", name: "Definitief ontwerp", sort_order: 4 },
    { code: "do-tekeningen", name: "DO tekeningen", sort_order: 5 },
    { code: "bouwvoorbereiding", name: "Bouwvoorbereiding", sort_order: 6 },
    { code: "bv-tekeningen", name: "BV tekeningen", sort_order: 7 },
    { code: "uitvoering", name: "Uitvoering", sort_order: 8 },
    { code: "uitvoering-tekeningen", name: "Uitvoering tekeningen", sort_order: 9 },
    { code: "oplevering-nazorg", name: "Oplevering/nazorg", sort_order: 10 },
  ];
  return res.status(200).json(phases);
}
