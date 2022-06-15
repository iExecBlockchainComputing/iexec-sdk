import { IExec, utils } from 'iexec';
import './styles.css';

const networkOutput = document.getElementById('network');
const addressOutput = document.getElementById('address');
const rlcWalletOutput = document.getElementById('rlc-wallet');
const nativeWalletOutput = document.getElementById('native-wallet');
const accountOutput = document.getElementById('account');
const accountDepositInput = document.getElementById('account-deposit-input');
const accountDepositButton = document.getElementById('account-deposit-button');
const accountDepositError = document.getElementById('account-deposit-error');
const accountWithdrawInput = document.getElementById('account-withdraw-input');
const accountWithdrawButton = document.getElementById(
  'account-withdraw-button',
);
const accountWithdrawError = document.getElementById('account-withdraw-error');
const walletBTMInput = document.getElementById('wallet-btm-input');
const walletBTMButton = document.getElementById('wallet-btm-button');
const walletBTMError = document.getElementById('wallet-btm-error');
const walletBTSInput = document.getElementById('wallet-bts-input');
const walletBTSButton = document.getElementById('wallet-bts-button');
const walletBTSError = document.getElementById('wallet-bts-error');
const storageInitButton = document.getElementById('storage-init-button');
const storageInitError = document.getElementById('storage-init-error');
const storageCheckOutput = document.getElementById('storage-check-output');
const storageCheckError = document.getElementById('storage-check-error');
const requesterSecretCheckNameInput = document.getElementById(
  'secret-check-name-input',
);
const requesterSecretCheckButton = document.getElementById(
  'secret-check-button',
);
const requesterSecretCheckOutput = document.getElementById(
  'secret-check-output',
);
const requesterSecretCheckError = document.getElementById('secret-check-error');
const requesterSecretPushNameInput = document.getElementById(
  'secret-push-name-input',
);
const requesterSecretPushValueInput = document.getElementById(
  'secret-push-value-input',
);
const requesterSecretPushButton = document.getElementById('secret-push-button');
const requesterSecretPushOutput = document.getElementById('secret-push-output');
const requesterSecretPushError = document.getElementById('secret-push-error');

const appsShowInput = document.getElementById('apps-address-input');
const appsShowButton = document.getElementById('apps-show-button');
const appsShowError = document.getElementById('apps-show-error');
const appsShowOutput = document.getElementById('apps-details-output');
const buyBuyButton = document.getElementById('buy-buy-button');
const buyBuyError = document.getElementById('buy-buy-error');
const buyBuyOutput = document.getElementById('buy-dealid-output');
const buyAppAddressInput = document.getElementById('buy-appaddress-input');
const buyCategoryInput = document.getElementById('buy-category-input');
const buyParamsInput = document.getElementById('buy-params-input');
const previousDealsButton = document.getElementById('previous-deals-button');
const previousDealsError = document.getElementById('previous-deals-error');
const previousDealsOutput = document.getElementById('previous-deals-output');
const resultsDealidInput = document.getElementById('results-dealid-input');
const resultsShowDealButton = document.getElementById(
  'results-showdeal-button',
);
const resultsShowDealError = document.getElementById('results-showdeal-error');
const resultsShowDealOutput = document.getElementById(
  'results-dealdetails-output',
);
const resultsTaskidInput = document.getElementById('results-taskid-input');
const resultsShowTaskButton = document.getElementById(
  'results-showtask-button',
);
const resultsShowTaskError = document.getElementById('results-showtask-error');
const resultsShowTaskOutput = document.getElementById(
  'results-taskdetails-output',
);
const resultsDownloadInput = document.getElementById('results-download-input');
const resultsDownloadButton = document.getElementById(
  'results-download-button',
);
const resultsDownloadError = document.getElementById('results-download-error');

const refreshUser = (iexec) => async () => {
  const userAddress = await iexec.wallet.getAddress();
  const [wallet, account] = await Promise.all([
    iexec.wallet.checkBalances(userAddress),
    iexec.account.checkBalance(userAddress),
  ]);
  const nativeWalletText = `${utils.formatEth(wallet.wei)} ether`;
  const rlcWalletText = `${utils.formatRLC(wallet.nRLC)} RLC`;
  addressOutput.innerText = userAddress;
  rlcWalletOutput.innerHTML = rlcWalletText;
  nativeWalletOutput.innerHTML = nativeWalletText;
  accountOutput.innerText = `${utils.formatRLC(
    account.stake,
  )} RLC (+ ${utils.formatRLC(account.locked)} RLC locked)`;
};

const deposit = (iexec) => async () => {
  try {
    accountDepositButton.disabled = true;
    accountDepositError.innerText = '';
    const amount = accountDepositInput.value;
    await iexec.account.deposit(amount);
    refreshUser(iexec)();
  } catch (error) {
    accountDepositError.innerText = error;
  } finally {
    accountDepositButton.disabled = false;
  }
};

const withdraw = (iexec) => async () => {
  try {
    accountWithdrawButton.disabled = true;
    accountWithdrawError.innerText = '';
    const amount = accountWithdrawInput.value;
    await iexec.account.withdraw(amount);
    refreshUser(iexec)();
  } catch (error) {
    accountWithdrawError.innerText = error;
  } finally {
    accountWithdrawButton.disabled = false;
  }
};

const bridgeToMainchain = (iexec) => async () => {
  try {
    walletBTMButton.disabled = true;
    walletBTMError.innerText = '';
    const amount = walletBTMInput.value;
    await iexec.wallet.bridgeToMainchain(amount);
    refreshUser(iexec)();
  } catch (error) {
    walletBTMError.innerText = error;
  } finally {
    walletBTMButton.disabled = false;
  }
};

const bridgeToSidechain = (iexec) => async () => {
  try {
    walletBTSButton.disabled = true;
    walletBTSError.innerText = '';
    const amount = walletBTSInput.value;
    await iexec.wallet.bridgeToSidechain(amount);
    refreshUser(iexec)();
  } catch (error) {
    walletBTSError.innerText = error;
  } finally {
    walletBTSButton.disabled = false;
  }
};

const checkStorage = (iexec) => async () => {
  try {
    storageCheckOutput.innerText = '';
    storageCheckError.innerText = '';
    const isStorageInitialized = await iexec.storage.checkStorageTokenExists(
      await iexec.wallet.getAddress(),
    );
    storageCheckOutput.innerText = isStorageInitialized
      ? 'initialized'
      : 'not initialized';
  } catch (error) {
    storageCheckError.innerText = error.message;
  }
};

const initStorage = (iexec) => async () => {
  try {
    storageInitButton.disabled = true;
    storageInitError.innerText = '';
    const storageToken = await iexec.storage.defaultStorageLogin();
    await iexec.storage.pushStorageToken(storageToken, { forceUpdate: true });
    checkStorage(iexec)();
  } catch (error) {
    storageInitError.innerText = error;
  } finally {
    storageInitButton.disabled = false;
  }
};

const checkRequesterSecret = (iexec) => async () => {
  try {
    requesterSecretCheckButton.disabled = true;
    requesterSecretCheckOutput.innerText = '';
    requesterSecretCheckError.innerText = '';
    const secretName = requesterSecretCheckNameInput.value;
    const isSecretSet = await iexec.secrets.checkRequesterSecretExists(
      await iexec.wallet.getAddress(),
      secretName,
    );
    requesterSecretCheckOutput.innerText = isSecretSet
      ? `secret "${secretName}" set`
      : `secret "${secretName}" no set`;
  } catch (error) {
    requesterSecretCheckError.innerText = error.message;
  } finally {
    requesterSecretCheckButton.disabled = false;
  }
};

const pushRequesterSecret = (iexec) => async () => {
  try {
    requesterSecretPushButton.disabled = true;
    requesterSecretPushError.innerText = '';
    const secretName = requesterSecretPushNameInput.value;
    const secretValue = requesterSecretPushValueInput.value;
    await iexec.secrets.pushRequesterSecret(secretName, secretValue);
    requesterSecretPushOutput.innerText = `secret "${secretName}" set`;
  } catch (error) {
    requesterSecretPushError.innerText = error;
  } finally {
    requesterSecretPushButton.disabled = false;
  }
};

const showApp = (iexec) => async () => {
  try {
    appsShowButton.disabled = true;
    appsShowError.innerText = '';
    appsShowOutput.innerText = '';
    const appAddress = appsShowInput.value;
    const res = await iexec.app.showApp(appAddress);
    appsShowOutput.innerText = JSON.stringify(res, null, 2);
  } catch (error) {
    appsShowError.innerText = error;
  } finally {
    appsShowButton.disabled = false;
  }
};

const buyComputation = (iexec) => async () => {
  try {
    buyBuyButton.disabled = true;
    buyBuyError.innerText = '';
    buyBuyOutput.innerText = '';
    const appAddress = buyAppAddressInput.value;
    const category = buyCategoryInput.value;
    const params = buyParamsInput.value;
    const { appOrders } = await iexec.orderbook.fetchAppOrderbook(appAddress);
    const appOrder = appOrders && appOrders[0] && appOrders[0].order;
    if (!appOrder) throw Error(`no apporder found for app ${appAddress}`);
    const { workerpoolOrders } = await iexec.orderbook.fetchWorkerpoolOrderbook(
      { category },
    );
    const workerpoolOrder =
      workerpoolOrders && workerpoolOrders[0] && workerpoolOrders[0].order;
    if (!workerpoolOrder)
      throw Error(`no workerpoolorder found for category ${category}`);

    const userAddress = await iexec.wallet.getAddress();

    const requestOrderToSign = await iexec.order.createRequestorder({
      app: appAddress,
      appmaxprice: appOrder.appprice,
      workerpoolmaxprice: workerpoolOrder.workerpoolprice,
      requester: userAddress,
      volume: 1,
      params,
      category,
    });

    const requestOrder = await iexec.order.signRequestorder(requestOrderToSign);

    const res = await iexec.order.matchOrders({
      apporder: appOrder,
      requestorder: requestOrder,
      workerpoolorder: workerpoolOrder,
    });
    buyBuyOutput.innerText = JSON.stringify(res, null, 2);
    resultsDealidInput.value = res.dealid;
    refreshUser(iexec)();
  } catch (error) {
    buyBuyError.innerText = error;
  } finally {
    buyBuyButton.disabled = false;
  }
};

const showPreviousDeals = (iexec) => async () => {
  try {
    previousDealsButton.disabled = true;
    previousDealsError.innerText = '';
    previousDealsOutput.innerText = '';
    const userAddress = await iexec.wallet.getAddress();
    const deals = await iexec.deal.fetchRequesterDeals(userAddress);
    previousDealsOutput.innerText = JSON.stringify(deals, null, 2);
  } catch (error) {
    previousDealsError.innerText = error;
  } finally {
    previousDealsButton.disabled = false;
  }
};

const showDeal = (iexec) => async () => {
  try {
    resultsShowDealButton.disabled = true;
    resultsShowDealError.innerText = '';
    resultsShowDealOutput.innerText = '';
    const dealid = resultsDealidInput.value;
    const deal = await iexec.deal.show(dealid);
    resultsShowDealOutput.innerText = JSON.stringify(deal, null, 2);
    resultsTaskidInput.value = deal.tasks['0'];
    resultsDownloadInput.value = deal.tasks['0'];
  } catch (error) {
    resultsShowDealError.innerText = error;
  } finally {
    resultsShowDealButton.disabled = false;
  }
};

const showTask = (iexec) => async () => {
  try {
    resultsShowTaskButton.disabled = true;
    resultsShowTaskError.innerText = '';
    resultsShowTaskOutput.innerText = '';
    const taskid = resultsTaskidInput.value;
    const res = await iexec.task.show(taskid);
    resultsShowTaskOutput.innerText = JSON.stringify(res, null, 2);
  } catch (error) {
    resultsShowTaskError.innerText = error;
  } finally {
    resultsShowTaskButton.disabled = false;
  }
};

const dowloadResults = (iexec) => async () => {
  try {
    resultsDownloadButton.disabled = true;
    resultsDownloadError.innerText = '';
    const taskid = resultsDownloadInput.value;
    const res = await iexec.task.fetchResults(taskid, {
      ipfsGatewayURL: 'https://ipfs.iex.ec',
    });
    const file = await res.blob();
    const fileName = `${taskid}.zip`;
    if (window.navigator.msSaveOrOpenBlob)
      window.navigator.msSaveOrOpenBlob(file, fileName);
    else {
      const a = document.createElement('a');
      const url = URL.createObjectURL(file);
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      setTimeout(() => {
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
      }, 0);
    }
  } catch (error) {
    resultsDownloadError.innerText = error;
  } finally {
    resultsDownloadButton.disabled = false;
  }
};

const init = async () => {
  try {
    let ethProvider;

    if (window.ethereum) {
      ethProvider = window.ethereum;
      ethProvider.on('chainChanged', () => window.location.reload());
    } else {
      throw Error('Missing window.ethereum');
    }

    await ethProvider.enable();

    const iexec = new IExec({
      ethProvider,
    });

    const { chainId } = await iexec.network.getNetwork();
    networkOutput.innerText = chainId;

    await refreshUser(iexec)();
    await checkStorage(iexec)();

    accountDepositButton.addEventListener('click', deposit(iexec));
    accountWithdrawButton.addEventListener('click', withdraw(iexec));
    walletBTMButton.addEventListener('click', bridgeToMainchain(iexec));
    walletBTSButton.addEventListener('click', bridgeToSidechain(iexec));
    storageInitButton.addEventListener('click', initStorage(iexec));
    requesterSecretCheckButton.addEventListener(
      'click',
      checkRequesterSecret(iexec),
    );
    requesterSecretPushButton.addEventListener(
      'click',
      pushRequesterSecret(iexec),
    );
    appsShowButton.addEventListener('click', showApp(iexec));
    buyBuyButton.addEventListener('click', buyComputation(iexec));
    previousDealsButton.addEventListener('click', showPreviousDeals(iexec));
    resultsShowDealButton.addEventListener('click', showDeal(iexec));
    resultsShowTaskButton.addEventListener('click', showTask(iexec));
    resultsDownloadButton.addEventListener('click', dowloadResults(iexec));
    accountDepositButton.disabled = false;
    accountWithdrawButton.disabled = false;
    walletBTMButton.disabled = false;
    walletBTSButton.disabled = false;
    storageInitButton.disabled = false;
    requesterSecretCheckButton.disabled = false;
    requesterSecretPushButton.disabled = false;
    appsShowButton.disabled = false;
    buyBuyButton.disabled = false;
    previousDealsButton.disabled = false;
    resultsShowDealButton.disabled = false;
    resultsShowTaskButton.disabled = false;
    resultsDownloadButton.disabled = false;
    console.log('initialized');
  } catch (e) {
    console.error(e.message);
  }
};

init();
