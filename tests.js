'use strict';
const fs = require('fs');
const path = require('path');
const root = __dirname;
const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const css = fs.readFileSync(path.join(root, 'styles.css'), 'utf8');
const js = fs.readFileSync(path.join(root, 'app.js'), 'utf8');
const checks = [
  ['three chain cards', (html.match(/class="dev-card/g) || []).length === 3],
  ['three independent amount inputs', ['bnbAmount','rhAmount','solAmount'].every(id => html.includes(`id="${id}"`))],
  ['three independent toggles', ['bnbToggle','rhToggle','solToggle'].every(id => html.includes(`id="${id}"`))],
  ['real network brand assets', ['assets/bnb-chain.svg','assets/robinhood.svg','assets/solana.svg'].every(asset => html.includes(asset) && fs.existsSync(path.join(root, asset)))],
  ['no fabricated recent-launch feed', !html.includes('RECENT MULTICHAIN LAUNCHES') && !html.includes('$NOVA')],
  ['required token fields', ['tokenName','ticker','supply'].every(id => html.includes(`id="${id}"`))],
  ['review and confirmation', html.includes('id="confirmCheck"') && html.includes('id="reviewBuys"')],
  ['frontend simulation disclosure', js.includes('FRONTEND SIMULATION COMPLETE') && js.includes('next development phase')],
  ['no blockchain write methods', !/(eth_sendTransaction|signAndSendTransaction|writeContract|sendTransaction)/.test(js)],
  ['responsive mobile layout', css.includes('@media(max-width:600px)')],
  ['modal keyboard close', js.includes("e.key === 'Escape'")],
  ['local draft persistence', js.includes('localStorage.setItem') && js.includes('localStorage.getItem')],
  ['hero packet reflects form state', js.includes("$$('.token-packet strong')")],
  ['create controls open launcher', (html.match(/data-open-launcher/g) || []).length === 3 && js.includes("launcher.classList.add('open')")],
  ['launcher starts closed and labelled', html.includes('id="create" aria-hidden="true"') && css.includes('.launch-shell.open')],
  ['condensed hero lettering', css.includes('Barlow+Condensed') && css.includes('font-family:"Barlow Condensed"')],
  ['launchpad route mapping', ['BNB CHAIN → FLAP','ROBINHOOD CHAIN → PONS','SOLANA → PUMP.FUN'].every(route => html.includes(route))],
  ['Launch Grid identity', html.includes('<title>Launch Grid</title>') && html.includes('$LG') && js.includes('launch-grid-draft-v1')],
  ['empty launched-token registry', html.includes('id="tokens"') && html.includes('NO TOKENS LAUNCHED YET') && html.includes('0 RESULTS')],
  ['real BNB wallet request', js.includes("method: 'eth_requestAccounts'") && js.includes("chainId: '0x38'")],
  ['BNB switch and add network', js.includes("method: 'wallet_switchEthereumChain'") && js.includes("method: 'wallet_addEthereumChain'")],
  ['no fake demo wallet address', !js.includes('0x71A4') && !js.includes('DEMO WALLET CONNECTED')]
];
let failed = 0;
for (const [name, ok] of checks) { console.log(`${ok ? 'PASS' : 'FAIL'} ${name}`); if (!ok) failed++; }
if (failed) process.exit(1);
console.log(`\n${checks.length}/${checks.length} checks passed`);
