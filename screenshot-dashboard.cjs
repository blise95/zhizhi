const puppeteer = require('puppeteer-core');

function generateSeedData() {
  const machines = ['2#', '4#', '9#', '10#'];
  const brands = ['modern-eu', 'normal-red-djibouti', 'slim', 'ultra-silver'];
  const shifts = ['早班', '中班', '晚班'];
  const groups = ['甲班', '乙班', '丙班'];
  const points = ['杭州总部'];

  const defects = [
    { location: '箱装', defectName: '纸箱缺条多条', category: 'A', scoreCategory: 'box' },
    { location: '箱装', defectName: '纸箱印刷缺陷', category: 'D', scoreCategory: 'box' },
    { location: '条装', defectName: '条盒轧皱', category: 'C', scoreCategory: 'carton' },
    { location: '条装', defectName: '拉线撕拉不畅', category: 'C', scoreCategory: 'carton' },
    { location: '盒装', defectName: '小盒轧破', category: 'B', scoreCategory: 'pack' },
    { location: '盒装', defectName: '透明纸皱', category: 'C', scoreCategory: 'pack' },
    { location: '烟支', defectName: '重量异常', category: 'C', scoreCategory: 'physical' },
    { location: '烟支', defectName: '圆周异常', category: 'C', scoreCategory: 'physical' },
    { location: '烟支', defectName: '切口不齐', category: 'D', scoreCategory: 'appearance' },
    { location: '烟支', defectName: '卷烟表面污', category: 'C', scoreCategory: 'appearance' },
  ];

  const records = [];
  const today = new Date();
  const start = new Date(today);
  start.setDate(today.getDate() - 6);

  for (let d = 0; d < 7; d++) {
    const date = new Date(start);
    date.setDate(start.getDate() + d);
    const dateStr = date.toISOString().split('T')[0];
    const baseCount = 12 + Math.floor(Math.random() * 8);

    for (let i = 0; i < baseCount; i++) {
      const machine = machines[i % machines.length];
      const brand = brands[i % brands.length];
      const shift = shifts[i % shifts.length];
      const group = groups[i % groups.length];
      const point = points[0];

      const recordDefects = [];
      const defectCount = Math.random() > 0.6 ? Math.floor(Math.random() * 3) + 1 : 0;
      for (let j = 0; j < defectCount; j++) {
        const def = defects[Math.floor(Math.random() * defects.length)];
        recordDefects.push({
          location: def.location,
          defectName: def.defectName,
          category: def.category,
          quantity: Math.floor(Math.random() * 3) + 1,
          scoreCategory: def.scoreCategory,
        });
      }

      // 按部位分组
      const boxDefects = recordDefects.filter(d => d.scoreCategory === 'box');
      const cartonDefects = recordDefects.filter(d => d.scoreCategory === 'carton');
      const packDefects = recordDefects.filter(d => d.scoreCategory === 'pack');
      const cigaretteDefects = recordDefects.filter(d => ['physical', 'appearance', 'misc'].includes(d.scoreCategory));

      records.push({
        id: `seed-${dateStr}-${i}`,
        date: dateStr,
        inspectionDate: dateStr,
        productionPoint: point,
        brand,
        machine,
        shiftType: group,
        shiftGroup: group,
        shift,
        inspector: 'system',
        recorder: 'system',
        batchNumber: `B-${dateStr.replace(/-/g, '')}-${i}`,
        tobaccoBatch: `B-${dateStr.replace(/-/g, '')}-${i}`,
        boxDefects,
        cartonDefects,
        packDefects,
        cigaretteDefects,
        createdAt: new Date(date.getTime() + i * 60000).toISOString(),
        updatedAt: new Date(date.getTime() + i * 60000).toISOString(),
        uploader: 'system',
      });
    }
  }

  return records;
}

(async () => {
  const browser = await puppeteer.launch({
    executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-gpu'],
  });

  try {
    const page = await browser.newPage();
    await page.setViewport({ width: 1920, height: 1080 });

    page.on('console', msg => console.log('PAGE CONSOLE:', msg.type(), msg.text()));
    page.on('pageerror', err => console.log('PAGE ERROR:', err.message));

    await page.goto('http://localhost:5173/', { waitUntil: 'domcontentloaded' });
    const seedData = generateSeedData();
    await page.evaluate(data => {
      localStorage.setItem('zhiquality_auth', JSON.stringify({
        username: 'chenyu',
        role: '管理员',
        loginTime: new Date().toISOString()
      }));
      const existing = localStorage.getItem('processQualityData');
      if (!existing) {
        localStorage.setItem('processQualityData', JSON.stringify(data));
      }
    }, seedData);
    await page.goto('http://localhost:5173/', { waitUntil: 'networkidle0' });
    await new Promise(resolve => setTimeout(resolve, 4000));

    const outDir = 'C:\\Users\\lenovo\\WorkBuddy\\2026-08-10-08-50-11\\zhi-quality-platform';

    await page.screenshot({ path: `${outDir}\\dashboard-v2-top.png`, fullPage: false });

    await page.evaluate(() => window.scrollTo(0, 900));
    await new Promise(resolve => setTimeout(resolve, 800));
    await page.screenshot({ path: `${outDir}\\dashboard-v2-mid.png`, fullPage: false });

    await page.evaluate(() => window.scrollTo(0, 1900));
    await new Promise(resolve => setTimeout(resolve, 800));
    await page.screenshot({ path: `${outDir}\\dashboard-v2-bottom.png`, fullPage: false });

    console.log('Dashboard screenshots saved, seed count:', seedData.length);
  } finally {
    await browser.close();
  }
})();
