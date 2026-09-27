const fs = require('fs');
const read = (file) => fs.readFileSync(file, 'utf8');
const home = read('index.html');
const create = read('create.html');
const tokens = read('tokens.html');
const css = read('styles.css');
const app = read('app.js');
const wallet = read('wallet.js');

const checks = [
  ['three real HTML pages', [home, create, tokens].every(Boolean)],
  ['landing excludes launcher form', !home.includes('id="create"') && !home.includes('id="launchForm"')],
  ['landing excludes token registry', !home.includes('id="tokens"')],
  ['create page contains launcher only', create.includes('id="create"') && create.includes('id="launchForm"') && !create.includes('id="tokens"') && !create.includes('class="hero')],
  ['tokens page contains registry only', tokens.includes('id="tokens"') && tokens.includes('NO TOKENS LAUNCHED YET') && !tokens.includes('id="launchForm"') && !tokens.includes('class="hero')],
  ['normal page links', [home,create,tokens].every(doc => doc.includes('href="index.html"') && doc.includes('href="create.html"') && doc.includes('href="tokens.html"'))],
  ['official X link on all pages', [home,create,tokens].every(doc => doc.includes('https://x.com/getlaunchgrid') && doc.includes('target="_blank"'))],
  ['mobile page navigation', [home,create,tokens].every(doc => doc.includes('class="page-nav"')) && css.includes('.page-nav')],
  ['three independent dev buys', ['bnbAmount','rhAmount','solAmount'].every(id => create.includes(`id="${id}"`))],
  ['token image picker and remove control', create.includes('id="logoInput"') && create.includes('id="logoDrop"') && create.includes('id="logoRemove"')],
  ['token image drag drop, validation and draft persistence', app.includes("addEventListener('drop'") && app.includes('normalizeTokenImage') && app.includes('logo: logoData') && app.includes('renderLogo()')],
  ['launchpad route mapping', ['BNB CHAIN → FLAP','ROBINHOOD CHAIN → PONS','SOLANA → PUMP.FUN'].every(route => home.includes(route))],
  ['zero fabricated launches', tokens.includes('0 RESULTS') && tokens.includes('NO TOKENS LAUNCHED YET')],
  ['real BNB wallet request on launcher', app.includes("method: 'eth_requestAccounts'") && app.includes("chainId: '0x38'")] ,
  ['real BNB wallet request on public pages', wallet.includes("method: 'eth_requestAccounts'") && wallet.includes("chainId: '0x38'")] ,
  ['BNB switch and add network', [app,wallet].every(js => js.includes("wallet_switchEthereumChain") && js.includes("wallet_addEthereumChain"))],
  ['no fake wallet address', !app.includes('0x71A4') && !wallet.includes('0x71A4')],
  ['official logo and favicon', [home,create,tokens].every(doc => doc.includes('assets/launch-grid-logo.png') && doc.includes('favicon.png?v=1'))],
  ['responsive header override', css.includes('grid-template-columns:1fr auto auto!important') && css.includes('.wallet-btn{padding:0 9px!important')],
  ['launcher close returns home', app.includes("window.location.href = 'index.html'")]
];
let failed = 0;
for (const [name, ok] of checks) { console.log(`${ok ? 'PASS' : 'FAIL'} ${name}`); if (!ok) failed++; }
console.log(`\n${checks.length - failed}/${checks.length} checks passed`);
if (failed) process.exit(1);
