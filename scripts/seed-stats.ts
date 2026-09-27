import { StatsDaily } from "../models";

const log = (line: string) => console.log(`  ${line}`);

export async function seedStats() {
  const count = await StatsDaily.countDocuments();
  if (count > 0) {
    log(`stats      ${count} daily records exist — left unchanged`);
    return;
  }

  const now = new Date();
  const DAY_MS = 24 * 60 * 60 * 1000;
  const days = 90;

  const pages = [
    { path: "/", share: 0.35 },
    { path: "/blog/mobile-money-mogadishu", share: 0.19 },
    { path: "/projects", share: 0.15 },
    { path: "/projects/heelan-home-health-care", share: 0.11 },
    { path: "/about", share: 0.09 },
    { path: "/contact", share: 0.06 },
    { path: "/services", share: 0.03 },
    { path: "/membership", share: 0.02 },
  ];

  const referrersTemplate = [
    { host: "Direct", share: 0.42 },
    { host: "Google", share: 0.31 },
    { host: "WhatsApp", share: 0.14 },
    { host: "LinkedIn", share: 0.09 },
    { host: "Facebook", share: 0.04 },
  ];

  let totalRecords = 0;

  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(now.getTime() - i * DAY_MS);
    const dateStr = new Intl.DateTimeFormat("en-CA", {
      timeZone: "Africa/Mogadishu",
    }).format(d);

    // Baseline site views per day with organic wave
    const wave = Math.sin((days - i) / 5) * 25 + Math.cos((days - i) / 2) * 15;
    const baseDailyViews = Math.max(30, Math.round(110 + wave + (days - i) * 0.4));
    const baseDailySessions = Math.round(baseDailyViews * 0.35);

    const dailyPhone = Math.round(baseDailyViews * 0.74);
    const dailyComputer = Math.round(baseDailyViews * 0.22);
    const dailyTablet = Math.max(0, baseDailyViews - dailyPhone - dailyComputer);

    const siteRefs = referrersTemplate.map((r) => ({
      host: r.host,
      views: Math.max(1, Math.round(baseDailyViews * r.share)),
    }));

    // Site-wide record
    await StatsDaily.create({
      date: dateStr,
      path: "*",
      views: baseDailyViews,
      sessions: baseDailySessions,
      referrers: siteRefs,
      devices: {
        phone: dailyPhone,
        computer: dailyComputer,
        tablet: dailyTablet,
      },
    });
    totalRecords++;

    // Page-specific records
    for (const page of pages) {
      const pageViews = Math.max(1, Math.round(baseDailyViews * page.share));
      const pageSessions = Math.max(1, Math.round(baseDailySessions * page.share));
      const pagePhone = Math.round(pageViews * 0.74);
      const pageComputer = Math.round(pageViews * 0.22);
      const pageTablet = Math.max(0, pageViews - pagePhone - pageComputer);

      const pageRefs = referrersTemplate.map((r) => ({
        host: r.host,
        views: Math.max(1, Math.round(pageViews * r.share)),
      }));

      await StatsDaily.create({
        date: dateStr,
        path: page.path,
        views: pageViews,
        sessions: pageSessions,
        referrers: pageRefs,
        devices: {
          phone: pagePhone,
          computer: pageComputer,
          tablet: pageTablet,
        },
      });
      totalRecords++;
    }
  }

  log(`stats      seeded ${totalRecords} historical records across 90 days`);
}
