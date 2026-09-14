(() => {
  'use strict';
  const button = document.querySelector('#walletBtn');
  const label = document.querySelector('#walletLabel');
  const toast = document.querySelector('#toast');
  if (!button || !label) return;

  const BNB_CHAIN = {
    chainId: '0x38',
    chainName: 'BNB Smart Chain Mainnet',
    nativeCurrency: { name: 'BNB', symbol: 'BNB', decimals: 18 },
    rpcUrls: ['https://bsc-dataseed.bnbchain.org'],
    blockExplorerUrls: ['https://bscscan.com/']
  };
  let connected = false;
  let listenersBound = false;

  function notify(message) {
    if (!toast) return;
    toast.textContent = message;
    toast.classList.add('show');
    clearTimeout(notify.timer);
    notify.timer = setTimeout(() => toast.classList.remove('show'), 2400);
  }

  function reset(text = 'CONNECT BNB WALLET') {
    connected = false;
    label.textContent = text;
    button.classList.remove('connected');
  }

  async function ensureBnbChain(provider) {
    const current = await provider.request({ method: 'eth_chainId' });
    if (String(current).toLowerCase() === BNB_CHAIN.chainId) return;
    try {
      await provider.request({ method: 'wallet_switchEthereumChain', params: [{ chainId: BNB_CHAIN.chainId }] });
    } catch (error) {
      const code = Number(error?.code ?? error?.data?.originalError?.code);
      if (code !== 4902) throw error;
      await provider.request({ method: 'wallet_addEthereumChain', params: [BNB_CHAIN] });
    }
  }

  function bind(provider) {
    if (listenersBound || typeof provider.on !== 'function') return;
    listenersBound = true;
    provider.on('accountsChanged', (accounts) => {
      const account = Array.isArray(accounts) ? accounts[0] : '';
      if (!/^0x[a-fA-F0-9]{40}$/.test(account || '')) reset();
      else if (connected) label.textContent = `${account.slice(0, 6)}…${account.slice(-4)}`;
    });
    provider.on('chainChanged', (chainId) => {
      if (String(chainId).toLowerCase() !== BNB_CHAIN.chainId) reset('SWITCH TO BNB CHAIN');
    });
  }

  button.addEventListener('click', async () => {
    const provider = window.ethereum;
    if (!provider || typeof provider.request !== 'function') {
      notify('INSTALL AN EVM WALLET TO CONNECT');
      return;
    }
    button.disabled = true;
    label.textContent = 'CONNECTING…';
    try {
      const accounts = await provider.request({ method: 'eth_requestAccounts' });
      await ensureBnbChain(provider);
      const account = Array.isArray(accounts) ? accounts[0] : '';
      if (!/^0x[a-fA-F0-9]{40}$/.test(account || '')) throw new Error('No valid account');
      connected = true;
      button.classList.add('connected');
      label.textContent = `${account.slice(0, 6)}…${account.slice(-4)}`;
      bind(provider);
      notify('BNB CHAIN WALLET CONNECTED');
    } catch (error) {
      reset();
      notify(error?.code === 4001 ? 'WALLET CONNECTION CANCELLED' : 'COULD NOT CONNECT TO BNB CHAIN');
    } finally {
      button.disabled = false;
    }
  });
})();
