const puppeteer = require('puppeteer-core'); const path = require('path');
const [html, out, footer] = process.argv.slice(2);
(async () => {
  const b = await puppeteer.launch({executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', headless: 'new', args: ['--no-sandbox','--allow-file-access-from-files']});
  const p = await b.newPage(); await p.goto('file://' + path.resolve(html), {waitUntil: 'networkidle0'});
  await p.pdf({path: out, format: 'A4', printBackground: true, displayHeaderFooter: true, headerTemplate: '<span></span>',
    footerTemplate: `<div style="font-size:7pt;color:#667;width:100%;padding:0 14mm;display:flex;justify-content:space-between"><span>${footer}</span><span>Page <span class="pageNumber"></span> / <span class="totalPages"></span></span></div>`,
    margin: {top: '16mm', bottom: '18mm', left: '14mm', right: '14mm'}});
  await b.close();
})();
