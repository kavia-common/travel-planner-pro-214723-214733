/**
 * Simple mock dataset to keep the UI functional before backend endpoints exist.
 */

export const mockTrips = [
  {
    id: "t1",
    name: "Tokyo + Kyoto",
    dateRange: "Apr 12–20, 2026",
    destinations: ["Tokyo", "Kyoto"],
  },
  {
    id: "t2",
    name: "Lisbon Weekend",
    dateRange: "May 2–5, 2026",
    destinations: ["Lisbon", "Sintra"],
  },
  {
    id: "t3",
    name: "Iceland Roadtrip",
    dateRange: "Jun 10–18, 2026",
    destinations: ["Reykjavík", "Vík", "Akureyri"],
  },
];

export const mockItineraryItems = {
  t1: [
    { id: "i1", day: "Day 1", title: "Arrive + Shinjuku night walk", time: "19:30" },
    { id: "i2", day: "Day 2", title: "Tsukiji + Asakusa", time: "10:00" },
  ],
  t2: [
    { id: "i3", day: "Day 1", title: "Alfama + Miradouros", time: "15:00" },
  ],
  t3: [
    { id: "i4", day: "Day 1", title: "Blue Lagoon", time: "11:00" },
  ],
};

export const mockNotes = {
  t1: ["Buy Suica card", "Book Gion evening tour"],
  t2: ["Try pastel de nata at Manteigaria"],
  t3: ["Pack waterproof layers", "Rent a 4x4 if possible"],
};

export const mockReminders = {
  t1: ["Check passport expiration", "Download offline maps"],
  t2: ["Confirm hotel check-in time"],
  t3: ["Watch aurora forecast", "Charge camera batteries"],
};

export const mockDestinationResults = [
  { id: "d1", name: "Kyoto", country: "Japan", summary: "Temples, gardens, and old-town streets." },
  { id: "d2", name: "Reykjavík", country: "Iceland", summary: "Basecamp for geothermal + day trips." },
  { id: "d3", name: "Lisbon", country: "Portugal", summary: "Hillside views, trams, and ocean air." },
];
