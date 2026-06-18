/* =========================================================
   ISOCHRONE — open infrastructure data (researched, static)
   Coordinates are [lon, lat]. Routes are realistic
   approximations from public sources (see Methodology):
   pipelines — OpenStreetMap / Global Energy Monitor trackers;
   submarine cables — TeleGeography-style indicative routes;
   ports — UNCTAD / Lloyd's List throughput rankings.
   ========================================================= */
window.INFRA = {
  pipelines: [
    { n: "Druzhba", t: "oil", s: "op", c: [[53.2,53.2],[48.4,54.9],[39.7,54.0],[34.4,53.25],[31.0,52.4],[29.24,52.05],[23.7,52.1],[19.7,52.55],[14.29,53.06]] },
    { n: "Nord Stream", t: "gas", s: "op", c: [[28.0,59.9],[22.0,57.5],[18.0,56.0],[15.0,55.0],[13.6,54.2]] },
    { n: "Yamal–Europe", t: "gas", s: "op", c: [[66.0,67.5],[55.0,62.0],[40.0,58.0],[34.96,57.05],[27.56,53.9],[21.0,52.23],[14.55,52.34]] },
    { n: "Power of Siberia", t: "gas", s: "op", c: [[112.0,63.0],[120.0,60.0],[124.0,54.0],[127.5,50.3],[126.6,45.3],[125.3,43.9]] },
    { n: "Trans-Alaska (TAPS)", t: "oil", s: "op", c: [[-148.46,70.25],[-148.0,66.9],[-147.7,64.84],[-145.5,63.0],[-146.35,61.13]] },
    { n: "Keystone", t: "oil", s: "op", c: [[-111.3,52.7],[-104.6,50.45],[-100.0,46.0],[-97.0,40.0],[-96.77,35.98]] },
    { n: "Enbridge Mainline", t: "oil", s: "op", c: [[-113.5,53.5],[-101.0,49.0],[-92.1,46.7],[-88.0,45.0],[-82.4,42.97]] },
    { n: "Colonial", t: "oil", s: "op", c: [[-95.37,29.76],[-90.0,31.0],[-84.39,33.75],[-79.0,36.0],[-74.24,40.62]] },
    { n: "Baku–Tbilisi–Ceyhan", t: "oil", s: "op", c: [[49.87,40.38],[46.0,41.2],[44.8,41.7],[41.0,40.5],[37.0,37.8],[35.8,36.87]] },
    { n: "Southern Gas Corridor (TANAP/TAP)", t: "gas", s: "op", c: [[49.87,40.38],[45.0,40.5],[41.27,39.9],[35.0,39.5],[30.5,39.8],[26.0,40.8],[22.0,40.9],[19.5,40.7],[18.17,40.35]] },
    { n: "TransMed", t: "gas", s: "op", c: [[3.0,32.9],[8.0,34.0],[10.5,33.9],[12.6,37.1],[15.0,38.2],[15.5,40.0],[12.5,43.0]] },
    { n: "Maghreb–Europe", t: "gas", s: "op", c: [[3.0,32.9],[-1.0,34.0],[-5.0,34.8],[-5.6,36.0],[-4.78,37.9]] },
    { n: "Medgaz", t: "gas", s: "op", c: [[-1.38,35.3],[-2.0,36.0],[-2.46,36.84]] },
    { n: "West–East Gas Pipeline", t: "gas", s: "op", c: [[84.0,41.0],[94.0,40.0],[103.8,36.06],[108.9,34.27],[114.3,33.0],[118.8,32.06],[121.47,31.23]] },
    { n: "ESPO", t: "oil", s: "op", c: [[98.0,55.9],[110.0,55.5],[124.0,54.0],[130.0,49.0],[132.7,42.8]] },
    { n: "Petroline (East–West)", t: "oil", s: "op", c: [[49.7,26.0],[45.0,25.5],[40.0,24.5],[38.06,24.09]] },
    { n: "GASBOL (Bolivia–Brazil)", t: "gas", s: "op", c: [[-63.18,-17.78],[-57.65,-19.0],[-51.0,-21.0],[-46.63,-23.55],[-49.0,-27.0],[-51.2,-30.0]] },
    { n: "Trans Mountain", t: "oil", s: "op", c: [[-113.5,53.5],[-118.08,52.87],[-120.34,50.68],[-122.95,49.25]] },
    { n: "TAPI", t: "gas", s: "planned", c: [[61.5,38.0],[62.2,34.35],[65.7,31.6],[67.0,30.2],[71.5,30.2],[74.0,30.4]] },
    { n: "Trans-Saharan", t: "gas", s: "planned", c: [[5.75,5.5],[8.5,12.0],[7.99,16.97],[5.0,25.0],[3.0,32.9]] },
  ],
  cables: [
    { n: "MAREA", c: [[-75.98,36.85],[-50,40],[-30,41],[-2.93,43.26]] },
    { n: "Transatlantic (TAT)", c: [[-74.0,40.5],[-50,48],[-25,51],[-6.0,50.4]] },
    { n: "FASTER (Trans-Pacific)", c: [[139.7,35.4],[160,40],[180,42],[-150,44],[-124.0,43.9]] },
    { n: "SEA-ME-WE", c: [[103.8,1.35],[88,8],[73,8],[60,14],[43,12],[33,28],[32.5,31.2],[14,37],[5.37,43.3]] },
    { n: "2Africa (indicative)", c: [[-5.0,50.0],[-9,38],[-6.5,36],[-17,15],[-5,5],[9,3],[12,-9],[16,-30],[20,-34.5],[34,-20],[40,-5],[43,5],[40,15],[34,23],[32.5,30.5]] },
    { n: "SAm-1 (Pacific)", c: [[-118.2,34.0],[-100,16],[-84,11],[-79.5,9],[-78,-6],[-77,-12],[-71,-30],[-70.6,-33.4]] },
  ],
  ports: [
    ["Shanghai",121.5,31.2],["Singapore",103.8,1.27],["Ningbo-Zhoushan",121.8,29.9],["Shenzhen",114.0,22.5],
    ["Guangzhou",113.4,23.1],["Busan",129.05,35.1],["Qingdao",120.3,36.07],["Hong Kong",114.16,22.3],
    ["Tianjin",117.7,38.98],["Rotterdam",4.4,51.95],["Antwerp",4.4,51.25],["Hamburg",9.97,53.54],
    ["Los Angeles",-118.26,33.74],["New York–NJ",-74.05,40.67],["Jebel Ali (Dubai)",55.06,25.0],
    ["Port Klang",101.39,3.0],["Tanjung Pelepas",103.55,1.36],["Kaohsiung",120.3,22.6],["Felixstowe",1.31,51.96],
    ["Santos",-46.3,-23.96],["Colombo",79.85,6.95],["Jeddah",39.15,21.5],["Tanger Med",-5.5,35.88],
    ["Durban",31.0,-29.87],["Houston",-95.3,29.73],["Vancouver",-123.1,49.29],["Valencia",-0.32,39.44],
    ["Piraeus",23.62,37.94],["Mundra",69.7,22.84],["Panama (Balboa)",-79.5,9.0],["Melbourne",144.9,-37.84],
  ].map(p => ({ n: p[0], x: p[1], y: p[2] })),
};

/* ---------------------------------------------------------
   POINT SITES — key energy, technology, science, defence and
   manufacturing infrastructure. Famous, publicly-documented
   locations at real coordinates (researched approximations).
   Sources: Wikipedia/OpenStreetMap, IAEA PRIS (nuclear),
   Global Energy Monitor, company disclosures, public registers.
   Military = widely-documented major bases (atlas reference only).
   --------------------------------------------------------- */
window.INFRA.sites = [
  { key:"nuclear", label:"Nuclear plants", icon:"☢", shape:"ring", color:"#ffe066", pts:[
    ["Kashiwazaki-Kariwa",138.60,37.43],["Bruce",-81.60,44.32],["Zaporizhzhia",34.59,47.51],
    ["Hanul",129.38,37.09],["Gravelines",2.13,51.01],["Palo Verde",-112.86,33.39],
    ["Cattenom",6.22,49.42],["Diablo Canyon",-120.85,35.21],["Sizewell",1.62,52.21],
    ["Olkiluoto",21.44,61.24],["Barakah",52.20,23.97],["Tianwan",119.46,34.69],
    ["Kudankulam",77.71,8.17],["Fukushima Daiichi",141.03,37.42]] },
  { key:"refinery", label:"Oil refineries", icon:"⛽", shape:"triangle", color:"#ff7a45", pts:[
    ["Jamnagar",69.95,22.34],["Ulsan",129.36,35.50],["Ruwais",52.73,24.11],["Port Arthur",-93.93,29.87],
    ["Baytown",-94.98,29.74],["Pernis (Rotterdam)",4.39,51.88],["Jubail",49.66,27.00],
    ["Jurong (Singapore)",103.69,1.27],["Mailiao",120.20,23.79],["Yeosu",127.76,34.76]] },
  { key:"lng", label:"LNG terminals", icon:"🔥", shape:"invtri", color:"#5ad1ff", pts:[
    ["Ras Laffan",51.60,25.90],["Sabine Pass",-93.87,29.73],["Gladstone",151.25,-23.84],
    ["Sabetta (Yamal)",72.10,71.27],["Bonny",7.17,4.43],["Gorgon",115.00,-20.60],
    ["Bintulu",113.05,3.18],["Cove Point",-76.39,38.40]] },
  { key:"dam", label:"Major dams", icon:"🌊", shape:"rect", color:"#4aa3ff", pts:[
    ["Three Gorges",111.00,30.82],["Itaipu",-54.59,-25.41],["Grand Coulee",-118.98,47.96],
    ["Hoover",-114.74,36.02],["Aswan High",32.88,23.97],["Tucuruí",-49.64,-3.83],
    ["Guri",-62.98,7.77],["Belo Monte",-51.95,-3.13],["Akosombo",0.06,6.30],["Robert-Bourassa",-77.50,53.79]] },
  { key:"datacenter", label:"Data-centre hubs", icon:"🖥", shape:"square", color:"#34e1d6", pts:[
    ["Ashburn (DC Alley)",-77.49,39.04],["The Dalles",-121.20,45.60],["Dublin",-6.27,53.35],
    ["Amsterdam",4.90,52.37],["Frankfurt",8.68,50.11],["Singapore",103.82,1.35],["Mumbai",72.88,19.08],
    ["Tokyo",139.69,35.68],["São Paulo",-46.63,-23.55],["Quincy WA",-119.85,47.23],["Council Bluffs",-95.87,41.26]] },
  { key:"fab", label:"Semiconductor fabs", icon:"🔲", shape:"hex", color:"#e056b6", pts:[
    ["Hsinchu (TSMC)",121.00,24.78],["Tainan (TSMC)",120.27,23.10],["Pyeongtaek (Samsung)",127.05,37.00],
    ["Hwaseong (Samsung)",127.00,37.20],["Hillsboro (Intel)",-122.97,45.54],["Chandler (Intel)",-111.84,33.30],
    ["Dresden",13.74,51.05],["Kiryat Gat (Intel)",34.77,31.61],["Kumamoto (JASM)",130.80,32.90],
    ["Malta NY (GF)",-73.79,43.00],["Wuxi",120.30,31.57]] },
  { key:"science", label:"Science & research", icon:"🔭", shape:"plus", color:"#eef2fb", pts:[
    ["CERN",6.05,46.23],["Fermilab",-88.27,41.84],["ITER",5.76,43.69],["ALMA / Paranal",-70.40,-24.63],
    ["Mauna Kea",-155.47,19.82],["FAST",106.86,25.65],["Green Bank",-79.84,38.43],
    ["LIGO Hanford",-119.41,46.45],["SKA-Mid (Karoo)",21.41,-30.72],["Vera Rubin",-70.74,-30.24],
    ["Gran Sasso",13.57,42.45]] },
  { key:"spaceport", label:"Spaceports", icon:"🚀", shape:"star", color:"#ffd166", pts:[
    ["Kennedy / Canaveral",-80.60,28.50],["Baikonur",63.34,45.96],["Kourou",-52.77,5.23],
    ["Vandenberg",-120.60,34.74],["Starbase (Boca Chica)",-97.18,25.99],["Wenchang",110.95,19.61],
    ["Jiuquan",100.29,40.96],["Sriharikota",80.23,13.72],["Tanegashima",130.97,30.40],
    ["Plesetsk",40.58,62.93],["Vostochny",128.33,51.88],["Māhia (Rocket Lab)",177.86,-39.26]] },
  { key:"military", label:"Military bases (public)", icon:"🛡", shape:"diamond", color:"#ff5a52", pts:[
    ["Norfolk Naval",-76.33,36.95],["Pearl Harbor",-157.95,21.36],["San Diego",-117.18,32.68],
    ["Diego Garcia",72.41,-7.31],["Andersen (Guam)",144.80,13.58],["Ramstein",7.60,49.44],
    ["Aviano",12.60,46.03],["Incirlik",35.42,37.00],["Yokosuka",139.67,35.29],["Kadena (Okinawa)",127.77,26.36],
    ["Camp Humphreys",127.03,36.96],["Al Udeid",51.32,25.12],["Camp Lemonnier",43.15,11.55],
    ["Faslane",-4.82,56.07],["Severomorsk",33.42,69.07],["Yulin (Hainan)",109.50,18.20]] },
  { key:"manufacturing", label:"Manufacturing hubs", icon:"🏭", shape:"gear", color:"#f4a83f", pts:[
    ["Wolfsburg (VW)",10.79,52.43],["Toyota City",137.16,35.08],["Ulsan (Hyundai)",129.36,35.54],
    ["Detroit",-83.05,42.33],["Shanghai (Giga)",121.80,30.90],["Stuttgart (Mercedes)",9.18,48.78],
    ["Zhengzhou (Foxconn)",113.68,34.72],["Giga Texas",-97.62,30.22],["Everett (Boeing)",-122.28,47.92],
    ["Toulouse (Airbus)",1.36,43.63],["Pohang (POSCO)",129.36,36.02],["Jamshedpur (Tata)",86.20,22.80],
    ["Geoje (shipyards)",128.62,34.88],["Chennai",80.27,13.08]] },
];
