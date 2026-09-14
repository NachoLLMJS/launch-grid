(() => {
  'use strict';
  const $ = (s) => document.querySelector(s);
  const $$ = (s) => [...document.querySelectorAll(s)];
  const storageKey = 'launch-grid-draft-v1';
  let step = 1;
  let logoData = '';
  let walletConnected = false;
  let walletListenersBound = false;

  const BNB_CHAIN = {
    chainId: '0x38',
    chainName: 'BNB Smart Chain Mainnet',
    nativeCurrency: { name: 'BNB', symbol: 'BNB', decimals: 18 },
    rpcUrls: ['https://bsc-dataseed.bnbchain.org'],
    blockExplorerUrls: ['https://bscscan.com/']
  };

  const prices = { bnb: 620, rh: 3200, sol: 145 };
  const controls = {
    bnb: { toggle: $('#bnbToggle'), amount: $('#bnbAmount'), usd: $('#bnbUsd'), review: $('#reviewBnb'), unit: 'BNB' },
    rh: { toggle: $('#rhToggle'), amount: $('#rhAmount'), usd: $('#rhUsd'), review: $('#reviewRh'), unit: 'ETH' },
    sol: { toggle: $('#solToggle'), amount: $('#solAmount'), usd: $('#solUsd'), review: $('#reviewSol'), unit: 'SOL' }
  };

  function showToast(message) {
    const toast = $('#toast');
    toast.textContent = message;
    toast.classList.add('show');
    clearTimeout(showToast.timer);
    showToast.timer = setTimeout(() => toast.classList.remove('show'), 2400);
  }

  function openLauncher(event) {
    if (event) event.preventDefault();
    const launcher = $('#create');
    launcher.classList.add('open');
    launcher.setAttribute('aria-hidden', 'false');
    requestAnimationFrame(() => launcher.scrollIntoView({ behavior: 'smooth', block: 'start' }));
  }

  function closeLauncher() {
    window.location.href = 'index.html';
  }

  function setStep(next) {
    step = Math.max(1, Math.min(3, next));
    $$('.form-step').forEach((el) => el.classList.toggle('active', Number(el.dataset.step) === step));
    $$('.step').forEach((el) => {
      const n = Number(el.dataset.stepNav);
      el.classList.toggle('active', n === step);
      el.classList.toggle('done', n < step);
    });
    $('#stepProgress').style.height = `${(step - 1) * 50}%`;
    $('#backBtn').hidden = step === 1;
    $('#nextBtn').innerHTML = step === 1 ? 'CONTINUE TO DEV BUYS <span>→</span>' : step === 2 ? 'REVIEW LAUNCH <span>→</span>' : 'LAUNCH ON 3 CHAINS <span>///</span>';
    $('#formErrors').textContent = '';
    if (step === 3) updateReview();
    document.querySelector('.launch-shell').scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  function cleanNumber(value) {
    return value.replace(/[^0-9.]/g, '').replace(/(\..*)\./g, '$1');
  }

  function validateDetails() {
    const errors = [];
    const name = $('#tokenName').value.trim();
    const ticker = $('#ticker').value.trim();
    const supply = Number($('#supply').value.replace(/,/g, ''));
    if (name.length < 2) errors.push('ENTER A TOKEN NAME');
    if (!/^[A-Za-z0-9]{2,10}$/.test(ticker)) errors.push('TICKER MUST BE 2–10 LETTERS OR NUMBERS');
    if (!Number.isSafeInteger(supply) || supply < 1 || supply > 1e15) errors.push('SUPPLY MUST BE A WHOLE NUMBER BETWEEN 1 AND 1 QUADRILLION');
    const website = $('#website').value.trim();
    if (website && !/^https?:\/\//i.test(website)) errors.push('WEBSITE MUST START WITH HTTP:// OR HTTPS://');
    $('#formErrors').textContent = errors.join(' · ');
    return errors.length === 0;
  }

  function updateReview() {
    const name = $('#tokenName').value.trim() || 'YOUR TOKEN';
    const ticker = ($('#ticker').value.trim() || 'TOKEN').toUpperCase();
    const rawSupply = Number($('#supply').value.replace(/,/g, '')) || 0;
    $('#reviewName').textContent = name.toUpperCase();
    $('#reviewTicker').textContent = `$${ticker} · ${rawSupply.toLocaleString('en-US')} SUPPLY`;
    const logo = $('#reviewLogo');
    logo.textContent = logoData ? '' : ticker.charAt(0);
    logo.style.backgroundImage = logoData ? `url(${logoData})` : '';
    const buys = [];
    Object.values(controls).forEach((c) => {
      const value = c.toggle.checked ? Number(c.amount.value) : 0;
      c.review.textContent = value > 0 ? `${value} ${c.unit} DEV BUY` : 'NO DEV BUY';
      if (value > 0) buys.push(`${value} ${c.unit}`);
    });
    $('#reviewBuys').textContent = buys.length ? buys.join(' + ') : 'NONE';
  }

  function saveDraft() {
    const draft = {
      name: $('#tokenName').value,
      ticker: $('#ticker').value,
      description: $('#description').value,
      supply: $('#supply').value,
      website: $('#website').value,
      twitter: $('#twitter').value,
      telegram: $('#telegram').value,
      buys: Object.fromEntries(Object.entries(controls).map(([key, c]) => [key, { enabled: c.toggle.checked, amount: c.amount.value }]))
    };
    localStorage.setItem(storageKey, JSON.stringify(draft));
    $('#draftStatus').textContent = 'DRAFT SAVED LOCALLY';
  }

  function loadDraft() {
    try {
      const draft = JSON.parse(localStorage.getItem(storageKey));
      if (!draft) return;
      const fieldMap = { tokenName: 'name', ticker: 'ticker', description: 'description', supply: 'supply', website: 'website', twitter: 'twitter', telegram: 'telegram' };
      Object.entries(fieldMap).forEach(([id, key]) => { if (typeof draft[key] === 'string') $(`#${id}`).value = draft[key]; });
      Object.entries(controls).forEach(([key, c]) => {
        const saved = draft.buys?.[key];
        if (saved) { c.toggle.checked = Boolean(saved.enabled); c.amount.disabled = !c.toggle.checked; c.amount.value = saved.amount || '0'; c.toggle.closest('.dev-card').classList.toggle('enabled', c.toggle.checked); updateUsd(key); }
      });
      updateCounts();
      showToast('DRAFT RESTORED');
    } catch { localStorage.removeItem(storageKey); }
  }

  function updateCounts() {
    $('#nameCount').textContent = $('#tokenName').value.length;
    $('#tickerCount').textContent = $('#ticker').value.length;
    $('#descCount').textContent = $('#description').value.length;
    const packet = $$('.token-packet strong');
    if (packet.length === 3) {
      packet[0].textContent = ($('#tokenName').value.trim() || 'YOUR TOKEN').toUpperCase();
      packet[1].textContent = `$${($('#ticker').value.trim() || 'TICKER').toUpperCase()}`;
      packet[2].textContent = (Number($('#supply').value) || 1000000000).toLocaleString('en-US');
    }
  }

  function updateUsd(key) {
    const c = controls[key];
    const value = Number(c.amount.value) || 0;
    c.usd.textContent = `≈ $${(value * prices[key]).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  }

  function beginLaunch() {
    if (!$('#confirmCheck').checked) { $('#formErrors').textContent = 'CONFIRM THE MULTICHAIN DEPLOYMENT BEFORE LAUNCHING'; return; }
    if (!walletConnected) { showToast('CONNECT A BNB CHAIN WALLET FIRST'); return; }
    const modal = $('#launchModal');
    modal.classList.add('open'); modal.setAttribute('aria-hidden', 'false');
    $('#modalClose').hidden = true; $('#doneBtn').hidden = true;
    $('#modalKicker').textContent = 'PREPARING MULTICHAIN LAUNCH';
    $('#modalTitle').innerHTML = 'DEPLOYING ACROSS<br>3 NETWORKS';
    $('#modalNote').textContent = 'Keep this window open while deployments are prepared.';
    const rows = $$('#deployList > div');
    rows.forEach((r) => { r.className = ''; r.querySelector('i').textContent = 'QUEUED'; });
    rows.forEach((row, index) => {
      setTimeout(() => { row.classList.add('working'); row.querySelector('i').textContent = 'DEPLOYING…'; }, 550 + index * 700);
      setTimeout(() => { row.classList.remove('working'); row.classList.add('success'); row.querySelector('i').textContent = 'PREPARED ✓'; }, 1150 + index * 700);
    });
    setTimeout(() => {
      $('#modalKicker').textContent = 'FRONTEND SIMULATION COMPLETE';
      $('#modalTitle').innerHTML = '3 DEPLOYMENTS<br>PREPARED';
      $('#modalNote').textContent = 'Contract execution will be connected in the next development phase.';
      $('#modalClose').hidden = false; $('#doneBtn').hidden = false;
      localStorage.removeItem(storageKey);
    }, 3400);
  }

  $('#nextBtn').addEventListener('click', () => {
    if (step === 1 && !validateDetails()) return;
    if (step < 3) { saveDraft(); setStep(step + 1); } else beginLaunch();
  });
  $$('[data-open-launcher]').forEach((trigger) => trigger.addEventListener('click', openLauncher));
  $('#launcherClose').addEventListener('click', closeLauncher);
  $('#backBtn').addEventListener('click', () => setStep(step - 1));
  $$('.step').forEach((el) => el.addEventListener('click', () => {
    const target = Number(el.dataset.stepNav);
    if (target < step || (target > step && validateDetails())) setStep(target);
  }));

  ['tokenName', 'ticker', 'description'].forEach((id) => $(`#${id}`).addEventListener('input', () => { if (id === 'ticker') $(`#${id}`).value = $(`#${id}`).value.toUpperCase().replace(/[^A-Z0-9]/g, ''); updateCounts(); saveDraft(); }));
  ['website', 'twitter', 'telegram'].forEach((id) => $(`#${id}`).addEventListener('change', saveDraft));
  $('#supply').addEventListener('input', (e) => { e.target.value = e.target.value.replace(/[^0-9]/g, ''); updateCounts(); saveDraft(); });

  Object.entries(controls).forEach(([key, c]) => {
    c.toggle.addEventListener('change', () => {
      c.amount.disabled = !c.toggle.checked;
      c.toggle.closest('.dev-card').classList.toggle('enabled', c.toggle.checked);
      if (c.toggle.checked && Number(c.amount.value) === 0) c.amount.value = key === 'sol' ? '1' : '0.01';
      updateUsd(key); saveDraft();
    });
    c.amount.addEventListener('input', () => { c.amount.value = cleanNumber(c.amount.value); updateUsd(key); saveDraft(); });
  });

  $('#logoInput').addEventListener('change', (event) => {
    const file = event.target.files[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { showToast('IMAGE MUST BE UNDER 5MB'); return; }
    const reader = new FileReader();
    reader.onload = () => { logoData = String(reader.result); $('#logoPreview').style.backgroundImage = `url(${logoData})`; $('#logoPreview').innerHTML = ''; };
    reader.readAsDataURL(file);
  });

  function resetWallet(label = 'CONNECT BNB WALLET') {
    walletConnected = false;
    $('#walletLabel').textContent = label;
    $('#walletBtn').classList.remove('connected');
  }

  async function ensureBnbChain(provider) {
    const currentChain = await provider.request({ method: 'eth_chainId' });
    if (String(currentChain).toLowerCase() === BNB_CHAIN.chainId) return;
    try {
      await provider.request({ method: 'wallet_switchEthereumChain', params: [{ chainId: BNB_CHAIN.chainId }] });
    } catch (error) {
      const code = Number(error?.code ?? error?.data?.originalError?.code);
      if (code !== 4902) throw error;
      await provider.request({ method: 'wallet_addEthereumChain', params: [BNB_CHAIN] });
    }
  }

  function bindWalletListeners(provider) {
    if (walletListenersBound || typeof provider.on !== 'function') return;
    walletListenersBound = true;
    provider.on('accountsChanged', (accounts) => {
      const account = Array.isArray(accounts) ? accounts[0] : '';
      if (!/^0x[a-fA-F0-9]{40}$/.test(account || '')) resetWallet();
      else if (walletConnected) $('#walletLabel').textContent = `${account.slice(0, 6)}…${account.slice(-4)}`;
    });
    provider.on('chainChanged', (chainId) => {
      if (String(chainId).toLowerCase() !== BNB_CHAIN.chainId) resetWallet('SWITCH TO BNB CHAIN');
    });
  }

  $('#walletBtn').addEventListener('click', async () => {
    const provider = window.ethereum;
    if (!provider || typeof provider.request !== 'function') { showToast('INSTALL AN EVM WALLET TO CONNECT'); return; }
    const button = $('#walletBtn');
    button.disabled = true;
    $('#walletLabel').textContent = 'CONNECTING…';
    try {
      const accounts = await provider.request({ method: 'eth_requestAccounts' });
      await ensureBnbChain(provider);
      const account = Array.isArray(accounts) ? accounts[0] : '';
      if (!/^0x[a-fA-F0-9]{40}$/.test(account || '')) throw new Error('Wallet returned no valid account');
      walletConnected = true;
      button.classList.add('connected');
      $('#walletLabel').textContent = `${account.slice(0, 6)}…${account.slice(-4)}`;
      bindWalletListeners(provider);
      showToast('BNB CHAIN WALLET CONNECTED');
    } catch (error) {
      resetWallet();
      showToast(error?.code === 4001 ? 'WALLET CONNECTION CANCELLED' : 'COULD NOT CONNECT TO BNB CHAIN');
    } finally {
      button.disabled = false;
    }
  });

  function closeModal() { $('#launchModal').classList.remove('open'); $('#launchModal').setAttribute('aria-hidden', 'true'); }
  $('#modalClose').addEventListener('click', closeModal);
  $('#doneBtn').addEventListener('click', closeModal);
  $('#launchModal').addEventListener('click', (e) => { if (e.target === $('#launchModal') && !$('#modalClose').hidden) closeModal(); });
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && !$('#modalClose').hidden) closeModal(); });

  loadDraft(); updateCounts();
  if (window.location.hash === '#create') openLauncher();
})();
