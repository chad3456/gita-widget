/* =========================================================
   SHASN — digital adaptation · game data
   A fan-made tribute to Shasn by Memesys/Zubin Pastakia.
   Card text here is original, written in the spirit of the
   game — not the official deck.
   Conviction keys: idealist · capitalist · supremo · showman
   Resource keys:    trust    · funds      · muscle  · buzz
   (each ideology is fuelled by its own resource)
   ========================================================= */
window.SHASN = {
  IDEOLOGIES: [
    { id: "idealist",   name: "Idealist",   color: "#f2b705", res: "trust",  resName: "Trust",  blurb: "Principle over power. Welfare, rights, transparency." },
    { id: "capitalist", name: "Capitalist", color: "#2d9cdb", res: "funds",  resName: "Funds",  blurb: "Markets and growth. Efficiency, business, deals." },
    { id: "supremo",    name: "Supremo",    color: "#eb5757", res: "muscle", resName: "Muscle", blurb: "Order and strength. Security, control, the nation." },
    { id: "showman",    name: "Showman",    color: "#27ae60", res: "buzz",   resName: "Buzz",   blurb: "Spectacle and image. Charisma, media, the crowd." },
  ],
  RES_OF: { idealist: "trust", capitalist: "funds", supremo: "muscle", showman: "buzz" },
  POOL_EACH: 30,            // 4 × 30 = 120 resources
  VOTER_TARGET: 30,         // first to 30 voters wins the election

  // 36 dilemmas × 3 = 108 ideology cards
  IDEOLOGY: [
    { q: "A profitable factory is poisoning the river that feeds a poor town.", a: { t: "Shut it down to protect families", c: { idealist: 2 }, r: { trust: 2 } }, b: { t: "Issue a small fine — jobs matter", c: { capitalist: 2 }, r: { funds: 2 } } },
    { q: "A rumour smearing your rival is going viral.", a: { t: "Amplify it — all is fair in elections", c: { showman: 2 }, r: { buzz: 2 } }, b: { t: "Debunk it publicly to keep your honour", c: { idealist: 2 }, r: { trust: 1, buzz: 1 } } },
    { q: "Migrants are surging across the border.", a: { t: "Seal the border, deploy the army", c: { supremo: 2 }, r: { muscle: 2 } }, b: { t: "Open shelters and grant due process", c: { idealist: 2 }, r: { trust: 2 } } },
    { q: "A tycoon offers to fund your campaign — for favours later.", a: { t: "Take the money, smile for cameras", c: { capitalist: 1, showman: 1 }, r: { funds: 2 } }, b: { t: "Refuse; run a clean campaign", c: { idealist: 2 }, r: { trust: 2 } } },
    { q: "A failing state bank needs rescuing.", a: { t: "Privatise it — let the market decide", c: { capitalist: 2 }, r: { funds: 2 } }, b: { t: "Bail it out to save depositors", c: { idealist: 1, supremo: 1 }, r: { trust: 1, muscle: 1 } } },
    { q: "Protesters fill the capital's streets.", a: { t: "Crack down hard to restore order", c: { supremo: 2 }, r: { muscle: 2 } }, b: { t: "Meet the leaders on live TV", c: { showman: 2 }, r: { buzz: 2 } } },
    { q: "A neighbouring nation rattles its sabre.", a: { t: "Mobilise troops and rally the flag", c: { supremo: 2 }, r: { muscle: 1, buzz: 1 } }, b: { t: "Open quiet back-channel talks", c: { idealist: 2 }, r: { trust: 2 } } },
    { q: "A megastar offers to endorse you.", a: { t: "Stage a stadium spectacle", c: { showman: 2 }, r: { buzz: 2 } }, b: { t: "Decline; let policy speak", c: { idealist: 1, capitalist: 1 }, r: { trust: 1, funds: 1 } } },
    { q: "Unemployment is climbing fast.", a: { t: "Slash taxes to spur business", c: { capitalist: 2 }, r: { funds: 2 } }, b: { t: "Launch a public jobs programme", c: { idealist: 1, supremo: 1 }, r: { trust: 1, muscle: 1 } } },
    { q: "A whistleblower exposes graft in your party.", a: { t: "Bury the story, lean on editors", c: { supremo: 1, showman: 1 }, r: { muscle: 1, buzz: 1 } }, b: { t: "Own it and promise reform", c: { idealist: 2 }, r: { trust: 2 } } },
    { q: "A drought devastates the farm belt.", a: { t: "Write off loans and fund relief", c: { idealist: 2 }, r: { trust: 2 } }, b: { t: "Subsidise agribusiness to scale up", c: { capitalist: 2 }, r: { funds: 2 } } },
    { q: "One bold lie could make your speech go viral.", a: { t: "Say it — the clip will trend", c: { showman: 2 }, r: { buzz: 2 } }, b: { t: "Stick to the inconvenient truth", c: { idealist: 2 }, r: { trust: 2 } } },
    { q: "Crime spikes across the big cities.", a: { t: "Flood the streets with police", c: { supremo: 2 }, r: { muscle: 2 } }, b: { t: "Invest in schools and jobs", c: { idealist: 1, capitalist: 1 }, r: { trust: 1, funds: 1 } } },
    { q: "A foreign firm wants to buy the national airline.", a: { t: "Sell — pocket the windfall", c: { capitalist: 2 }, r: { funds: 2 } }, b: { t: "Keep it public, a point of pride", c: { supremo: 1, idealist: 1 }, r: { muscle: 1, trust: 1 } } },
    { q: "State media wants a flattering film about you.", a: { t: "Greenlight the personality cult", c: { showman: 1, supremo: 1 }, r: { buzz: 1, muscle: 1 } }, b: { t: "Fund independent journalism instead", c: { idealist: 2 }, r: { trust: 2 } } },
    { q: "A pandemic looms on the horizon.", a: { t: "Lock down hard and fast", c: { supremo: 1, idealist: 1 }, r: { muscle: 1, trust: 1 } }, b: { t: "Keep the economy open", c: { capitalist: 2 }, r: { funds: 2 } } },
    { q: "Big tech is hoarding citizens' data.", a: { t: "Regulate and protect privacy", c: { idealist: 2 }, r: { trust: 2 } }, b: { t: "Strike a data deal for the state", c: { supremo: 1, capitalist: 1 }, r: { muscle: 1, funds: 1 } } },
    { q: "A historic monument blocks a new highway.", a: { t: "Bulldoze it — progress first", c: { capitalist: 1, supremo: 1 }, r: { funds: 1, muscle: 1 } }, b: { t: "Reroute to preserve heritage", c: { idealist: 2 }, r: { trust: 2 } } },
    { q: "Your rival challenges you to a televised debate.", a: { t: "Dominate the stage with charisma", c: { showman: 2 }, r: { buzz: 2 } }, b: { t: "Win on facts and figures", c: { idealist: 1, capitalist: 1 }, r: { trust: 1, funds: 1 } } },
    { q: "A militant group offers a ceasefire — for amnesty.", a: { t: "Crush them; no deals with terror", c: { supremo: 2 }, r: { muscle: 2 } }, b: { t: "Negotiate peace and reintegration", c: { idealist: 2 }, r: { trust: 2 } } },
    { q: "Inflation is biting every household.", a: { t: "Cap prices on essentials", c: { idealist: 1, supremo: 1 }, r: { trust: 1, muscle: 1 } }, b: { t: "Let the market correct itself", c: { capitalist: 2 }, r: { funds: 2 } } },
    { q: "A glitzy festival could lift your image.", a: { t: "Throw the biggest show in history", c: { showman: 2 }, r: { buzz: 2 } }, b: { t: "Spend the budget on clinics", c: { idealist: 2 }, r: { trust: 2 } } },
    { q: "The generals want a bigger defence budget.", a: { t: "Approve it — strength deters", c: { supremo: 2 }, r: { muscle: 2 } }, b: { t: "Redirect the funds to industry", c: { capitalist: 2 }, r: { funds: 2 } } },
    { q: "A minority neighbourhood faces a mob.", a: { t: "Deploy force to protect them", c: { idealist: 1, supremo: 1 }, r: { trust: 1, muscle: 1 } }, b: { t: "Stay out of a 'local matter'", c: { capitalist: 1, showman: 1 }, r: { funds: 1, buzz: 1 } } },
    { q: "Influencers will post for the right price.", a: { t: "Buy an army of online voices", c: { showman: 1, capitalist: 1 }, r: { buzz: 1, funds: 1 } }, b: { t: "Build a real grassroots network", c: { idealist: 2 }, r: { trust: 2 } } },
    { q: "A polluting coal plant powers a swing district.", a: { t: "Keep it — votes over emissions", c: { capitalist: 1, showman: 1 }, r: { funds: 1, buzz: 1 } }, b: { t: "Close it; pivot to clean energy", c: { idealist: 2 }, r: { trust: 2 } } },
    { q: "Your security chief wants surveillance powers.", a: { t: "Grant sweeping powers", c: { supremo: 2 }, r: { muscle: 2 } }, b: { t: "Insist on courts and limits", c: { idealist: 2 }, r: { trust: 2 } } },
    { q: "A startup hub could transform the economy.", a: { t: "Pour in tax breaks and capital", c: { capitalist: 2 }, r: { funds: 2 } }, b: { t: "Tie aid to fair wages", c: { idealist: 1, capitalist: 1 }, r: { trust: 1, funds: 1 } } },
    { q: "A scandal breaks on election eve.", a: { t: "Flood the feeds to drown it out", c: { showman: 2 }, r: { buzz: 2 } }, b: { t: "Face the press and take questions", c: { idealist: 1, supremo: 1 }, r: { trust: 1, muscle: 1 } } },
    { q: "The unions call a national strike.", a: { t: "Break it with emergency powers", c: { supremo: 2 }, r: { muscle: 2 } }, b: { t: "Sit down and bargain", c: { idealist: 2 }, r: { trust: 2 } } },
    { q: "A dam will power millions but drown a village.", a: { t: "Build it — the many over the few", c: { capitalist: 1, supremo: 1 }, r: { funds: 1, muscle: 1 } }, b: { t: "Halt it; rehouse and consult", c: { idealist: 2 }, r: { trust: 2 } } },
    { q: "A charismatic outsider wants on your ticket.", a: { t: "Make them the face of the campaign", c: { showman: 2 }, r: { buzz: 2 } }, b: { t: "Promote a steady policy wonk", c: { idealist: 1, capitalist: 1 }, r: { trust: 1, funds: 1 } } },
    { q: "A region demands more autonomy.", a: { t: "Refuse — hold the union firm", c: { supremo: 2 }, r: { muscle: 2 } }, b: { t: "Devolve power and trust them", c: { idealist: 2 }, r: { trust: 2 } } },
    { q: "Casinos want to open on the coast.", a: { t: "Licence them for the revenue", c: { capitalist: 1, showman: 1 }, r: { funds: 1, buzz: 1 } }, b: { t: "Ban them to protect families", c: { idealist: 1, supremo: 1 }, r: { trust: 1, muscle: 1 } } },
    { q: "A heatwave exposes a power crisis.", a: { t: "Fast-track private power plants", c: { capitalist: 2 }, r: { funds: 2 } }, b: { t: "Ration fairly and invest public", c: { idealist: 1, supremo: 1 }, r: { trust: 1, muscle: 1 } } },
    { q: "You could rewrite the term limits.", a: { t: "Extend them — the nation needs you", c: { supremo: 1, showman: 1 }, r: { muscle: 1, buzz: 1 } }, b: { t: "Uphold the limits and step back", c: { idealist: 2 }, r: { trust: 2 } } },
  ],

  // 20 voter archetypes × 3 = 60 voter cards
  VOTERS: [
    { n: "Farmers",            cost: { trust: 2, muscle: 1 }, v: 4 },
    { n: "Students",           cost: { buzz: 2, trust: 1 },   v: 3 },
    { n: "Industrialists",     cost: { funds: 3 },            v: 5 },
    { n: "Urban Middle Class", cost: { funds: 2, buzz: 1 },   v: 4 },
    { n: "Religious Bloc",     cost: { muscle: 2, trust: 1 }, v: 4 },
    { n: "Tech Workers",       cost: { funds: 1, buzz: 2 },   v: 3 },
    { n: "Slum Dwellers",      cost: { trust: 2, buzz: 1 },   v: 5 },
    { n: "Veterans",           cost: { muscle: 3 },           v: 4 },
    { n: "Celebrities",        cost: { buzz: 3 },             v: 2 },
    { n: "Bureaucrats",        cost: { funds: 1, muscle: 1, trust: 1 }, v: 4 },
    { n: "The Youth",          cost: { buzz: 2, muscle: 1 },  v: 4 },
    { n: "Pensioners",         cost: { trust: 1, funds: 2 },  v: 4 },
    { n: "Traders",            cost: { funds: 2, muscle: 1 }, v: 4 },
    { n: "Activists",          cost: { trust: 3 },            v: 3 },
    { n: "Media Houses",       cost: { funds: 2, buzz: 2 },   v: 5 },
    { n: "Rural Poor",         cost: { trust: 1, muscle: 1 }, v: 3 },
    { n: "Diaspora",           cost: { funds: 2, buzz: 1 },   v: 3 },
    { n: "Labour Unions",      cost: { muscle: 2, trust: 1 }, v: 5 },
    { n: "Minorities",         cost: { trust: 2, buzz: 1 },   v: 4 },
    { n: "Nationalists",       cost: { muscle: 2, buzz: 1 },  v: 4 },
  ],

  // 20 conspiracy cards
  CONSPIRACIES: [
    { n: "Rigged Poll",          d: "Inflate the count — gain 3 voters.",                   fx: { k: "voters", n: 3 } },
    { n: "Midnight Raid",        d: "Seize 3 resources from the richest rival.",            fx: { k: "steal", n: 3 } },
    { n: "Vote Bank",            d: "Lock in a captive bloc — gain 2 voters.",              fx: { k: "voters", n: 2 } },
    { n: "Fake News Blitz",      d: "Flood the feeds — gain 3 Buzz.",                       fx: { k: "res", res: "buzz", n: 3 } },
    { n: "Backroom Deal",        d: "Quiet money changes hands — gain 3 Funds.",            fx: { k: "res", res: "funds", n: 3 } },
    { n: "Defection",            d: "Poach 2 resources from the richest rival.",            fx: { k: "steal", n: 2 } },
    { n: "Smear Campaign",       d: "Every rival loses 1 resource.",                        fx: { k: "drain", n: 1 } },
    { n: "October Surprise",     d: "A timely bombshell — gain 3 voters.",                  fx: { k: "voters", n: 3 } },
    { n: "Astroturf",            d: "Manufacture a movement — gain 3 Buzz.",                fx: { k: "res", res: "buzz", n: 3 } },
    { n: "Shell Company",        d: "Hide the funding — gain 3 Funds.",                     fx: { k: "res", res: "funds", n: 3 } },
    { n: "Whisper Network",      d: "Steal 2 resources from the richest rival.",            fx: { k: "steal", n: 2 } },
    { n: "Land Grab",            d: "Muscle in on territory — gain 3 Muscle.",              fx: { k: "res", res: "muscle", n: 3 } },
    { n: "Bot Army",             d: "Drown the discourse — gain 3 Buzz.",                   fx: { k: "res", res: "buzz", n: 3 } },
    { n: "Pork Barrel",          d: "Buy a district — gain 2 voters.",                      fx: { k: "voters", n: 2 } },
    { n: "Gerrymander",          d: "Redraw the map — gain 3 voters.",                      fx: { k: "voters", n: 3 } },
    { n: "Cult of Personality",  d: "+3 conviction to your strongest ideology.",            fx: { k: "conv", n: 3 } },
    { n: "Black Money",          d: "Untraceable cash — gain 3 Funds.",                     fx: { k: "res", res: "funds", n: 3 } },
    { n: "Strongarm",            d: "Every rival loses 1 resource.",                        fx: { k: "drain", n: 1 } },
    { n: "Viral Moment",         d: "The internet loves you — gain 2 voters.",              fx: { k: "voters", n: 2 } },
    { n: "Coalition Pact",       d: "Capture up to 2 voters this turn.",                    fx: { k: "double" } },
  ],

  COLORS: [
    { id: "crimson", name: "Crimson", hex: "#e63946" },
    { id: "azure",   name: "Azure",   hex: "#2d9cdb" },
    { id: "amber",   name: "Amber",   hex: "#f2b705" },
    { id: "emerald", name: "Emerald", hex: "#27ae60" },
    { id: "violet",  name: "Violet",  hex: "#9b5de5" },
  ],
};
