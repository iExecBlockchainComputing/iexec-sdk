import IExec from 'iexec/IExec';
import * as utils from 'iexec/utils';

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

const datasetsShowInput = document.getElementById('datasets-address-input');
const datasetsShowButton = document.getElementById('datasets-show-button');
const datasetsShowError = document.getElementById('datasets-show-error');
const datasetShowOutput = document.getElementById('datasets-details-output');
const datasetsCountButton = document.getElementById('datasets-count-button');
const datasetsCountError = document.getElementById('datasets-count-error');
const datasetsCountOutput = document.getElementById('datasets-count-output');
const datasetsIndexInput = document.getElementById('datasets-index-input');
const datasetsShowIndexButton = document.getElementById(
  'datasets-showindex-button',
);
const datasetsShowIndexError = document.getElementById(
  'datasets-showindex-error',
);
const datasetsShowIndexOutput = document.getElementById(
  'datasets-showindex-output',
);

const datasetsGenerateKeyButton = document.getElementById(
  'datasets-generatekey-button',
);
const datasetsGenerateKeyError = document.getElementById(
  'datasets-generatekey-error',
);
const datasetsGenerateKeyOutput = document.getElementById(
  'datasets-generatekey-output',
);
const datasetsEncryptKeyInput = document.getElementById(
  'datasets-encryptkey-input',
);
const datasetsEncryptFileInput = document.getElementById(
  'datasets-encryptfile-input',
);
const datasetsEncryptButton = document.getElementById(
  'datasets-encrypt-button',
);
const datasetsEncryptError = document.getElementById('datasets-encrypt-error');
const datasetsEncryptOutput = document.getElementById(
  'datasets-encrypt-output',
);

const datasetsDeployNameInput = document.getElementById(
  'datasets-deployname-input',
);
const datasetsDeployMultiaddrInput = document.getElementById(
  'datasets-deploymultiaddr-input',
);
const datasetsDeployChecksumInput = document.getElementById(
  'datasets-deploychecksum-input',
);
const datasetsDeployButton = document.getElementById('datasets-deploy-button');
const datasetsDeployError = document.getElementById('datasets-deploy-error');
const datasetsDeployOutput = document.getElementById('datasets-deploy-output');

const pushSecretKeyInput = document.getElementById('pushsecret-key-input');
const pushSecretAddressInput = document.getElementById(
  'pushsecret-address-input',
);
const pushSecretButton = document.getElementById('push-secret-button');
const pushSecretError = document.getElementById('push-secret-error');
const pushSecretOutput = document.getElementById('push-secret-output');

const resultsDecryptKey = document.getElementById('results-decrypt-key-file');
const resultsDecryptEncrypted = document.getElementById(
  'results-decrypt-encrypted-file',
);
const resultsDecryptButton = document.getElementById('results-decrypt-button');
const resultsDecryptError = document.getElementById('results-decrypt-error');

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
    const { orders: appOrders } = await iexec.orderbook.fetchAppOrderbook(
      appAddress,
    );
    const appOrder = appOrders && appOrders[0] && appOrders[0].order;
    if (!appOrder) throw Error(`no apporder found for app ${appAddress}`);
    const { orders: workerpoolOrders } =
      await iexec.orderbook.fetchWorkerpoolOrderbook({ category });
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

const downloadResults = (iexec) => async () => {
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

const showDataset = (iexec) => async () => {
  try {
    datasetsShowButton.disabled = true;
    datasetsShowError.innerText = '';
    datasetShowOutput.innerText = '';
    const datasetAddress = datasetsShowInput.value;
    const res = await iexec.dataset.showDataset(datasetAddress);
    datasetShowOutput.innerText = JSON.stringify(res, null, 2);
  } catch (error) {
    datasetsShowError.innerText = error;
  } finally {
    datasetsShowButton.disabled = false;
  }
};

const showDatasetByIndex = (iexec) => async () => {
  try {
    datasetsShowIndexButton.disabled = true;
    datasetsShowIndexError.innerText = '';
    datasetsShowIndexOutput.innerText = '';
    const datasetIndex = datasetsIndexInput.value;
    const res = await iexec.dataset.showUserDataset(
      datasetIndex,
      await iexec.wallet.getAddress(),
    );
    datasetsShowIndexOutput.innerText = JSON.stringify(res, null, 2);
  } catch (error) {
    datasetsShowIndexError.innerText = error;
  } finally {
    datasetsShowIndexButton.disabled = false;
  }
};

const countDatasets = (iexec) => async () => {
  try {
    datasetsCountButton.disabled = true;
    datasetsCountError.innerText = '';
    datasetsCountOutput.innerText = '';
    const count = await iexec.dataset.countUserDatasets(
      await iexec.wallet.getAddress(),
    );
    datasetsCountOutput.innerText = `total deployed datasets ${count}`;
  } catch (error) {
    datasetsCountError.innerText = error;
  } finally {
    datasetsCountButton.disabled = false;
  }
};

const generateDatasetKey = (iexec) => () => {
  try {
    datasetsGenerateKeyError.innerText = '';
    datasetsGenerateKeyOutput.innerText = '';
    const key = iexec.dataset.generateEncryptionKey();
    datasetsGenerateKeyOutput.innerText = `Generated key: ${key}`;
    datasetsEncryptKeyInput.value = key;
  } catch (error) {
    datasetsGenerateKeyError.innerText = error;
  } finally {
    datasetsGenerateKeyButton.disabled = false;
  }
};

const encryptDataset = (iexec) => async () => {
  try {
    datasetsEncryptButton.disabled = true;
    datasetsEncryptError.innerText = '';
    datasetsEncryptOutput.innerText = '';
    const file = datasetsEncryptFileInput.files[0];
    if (!file) {
      throw Error('No file selected');
    }
    if (file.size > 500) {
      throw Error(
        'File too large, this is a demo, please use small files (>=500 bytes)',
      );
    }

    datasetsEncryptOutput.innerText = `Reading ${file.name}`;
    const fileBytes = await new Promise((resolve, reject) => {
      const fileReader = new FileReader();
      fileReader.readAsArrayBuffer(file);
      fileReader.onload = (e) => resolve(e.target.result);
      fileReader.onerror = () =>
        reject(Error(`Failed to read file: ${fileReader.error}`));
      fileReader.onabort = () => reject(Error(`Failed to read file: aborted`));
    });

    const key = datasetsEncryptKeyInput.value;

    datasetsEncryptOutput.innerText = `Encrypting ${file.name}`;
    const encrypted = await iexec.dataset.encrypt(fileBytes, key);
    const checksum = await iexec.dataset.computeEncryptedFileChecksum(
      encrypted,
    );

    datasetsEncryptOutput.innerText = 'Uploading encrypted file to IPFS';
    const ipfs = window.KuboRpcClient.create('/dns4/ipfs-upload.iex.ec/https/');
    const uploadResult = await ipfs.add(encrypted);
    const { cid } = uploadResult;
    const multiaddr = `ipfs/${cid.toString()}`;
    const publicUrl = `https://ipfs.iex.ec/${multiaddr}`;

    datasetsEncryptOutput.innerText = 'Checking file on IPFS';
    await fetch(publicUrl).then((res) => {
      if (!res.ok) {
        throw Error(`Failed to load uploaded file at ${publicUrl}`);
      }
    });

    const a = document.createElement('a');
    a.href = publicUrl;
    a.text = publicUrl;
    a.target = '_blank';
    datasetsEncryptOutput.innerText = `File encrypted and uploaded to IPFS (checksum ${checksum})\n`;
    datasetsEncryptOutput.appendChild(a);

    datasetsDeployNameInput.value = file.name;
    datasetsDeployMultiaddrInput.value = multiaddr;
    datasetsDeployChecksumInput.value = checksum;
    pushSecretKeyInput.value = key;
  } catch (error) {
    datasetsEncryptError.innerText = error;
    datasetsEncryptOutput.innerText = '';
  } finally {
    datasetsEncryptButton.disabled = false;
  }
};

const deployDataset = (iexec) => async () => {
  try {
    datasetsDeployButton.disabled = true;
    datasetsDeployError.innerText = '';
    datasetsDeployOutput.innerText = '';
    const owner = await iexec.wallet.getAddress();
    const name = datasetsDeployNameInput.value;
    const multiaddr = datasetsDeployMultiaddrInput.value;
    const checksum = datasetsDeployChecksumInput.value;
    const { address } = await iexec.dataset.deployDataset({
      owner,
      name,
      multiaddr,
      checksum,
    });
    datasetsDeployOutput.innerText = `Dataset deployed at address ${address}`;
    pushSecretAddressInput.value = address;
    datasetsShowInput.value = address;
    refreshUser(iexec)();
  } catch (error) {
    datasetsDeployError.innerText = error;
  } finally {
    datasetsDeployButton.disabled = false;
  }
};

const pushSecret = (iexec) => async () => {
  try {
    pushSecretButton.disabled = true;
    pushSecretError.innerText = '';
    pushSecretOutput.innerText = '';
    const datasetAddress = pushSecretAddressInput.value;
    const key = pushSecretKeyInput.value;
    await iexec.dataset.pushDatasetSecret(datasetAddress, key);
    pushSecretOutput.innerText = `Encryption key pushed for dataset ${datasetAddress}`;
  } catch (error) {
    pushSecretError.innerText = error;
  } finally {
    pushSecretButton.disabled = false;
  }
};

const decryptResults = () => async () => {
  try {
    resultsDecryptError.innerText = '';
    const readFile = (file) =>
      new Promise((resolve, reject) => {
        const fileReader = new FileReader();
        fileReader.readAsArrayBuffer(file);
        fileReader.onload = (e) => resolve(e.target.result);
        fileReader.onerror = () =>
          reject(Error(`Failed to read file: ${fileReader.error}`));
        fileReader.onabort = () =>
          reject(Error(`Failed to read file: aborted`));
      });

    const keyBuffer = await readFile(resultsDecryptKey.files[0]);
    const encryptedBuffer = await readFile(resultsDecryptEncrypted.files[0]);

    const decryptedBuffer = await utils.decryptResult(
      encryptedBuffer,
      keyBuffer,
    );

    const file = new Blob([decryptedBuffer]);
    const fileName = `decrypted.zip`;
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
    resultsDecryptError.innerText = error;
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
    resultsDownloadButton.addEventListener('click', downloadResults(iexec));
    resultsDecryptButton.addEventListener('click', decryptResults(iexec));
    datasetsShowButton.addEventListener('click', showDataset(iexec));
    datasetsCountButton.addEventListener('click', countDatasets(iexec));
    datasetsShowIndexButton.addEventListener(
      'click',
      showDatasetByIndex(iexec),
    );
    datasetsGenerateKeyButton.addEventListener(
      'click',
      generateDatasetKey(iexec),
    );
    datasetsEncryptButton.addEventListener('click', encryptDataset(iexec));
    datasetsDeployButton.addEventListener('click', deployDataset(iexec));
    pushSecretButton.addEventListener('click', pushSecret(iexec));
    accountDepositButton.disabled = false;
    accountWithdrawButton.disabled = false;
    datasetsShowButton.disabled = false;
    datasetsCountButton.disabled = false;
    datasetsShowIndexButton.disabled = false;
    datasetsGenerateKeyButton.disabled = false;
    datasetsEncryptButton.disabled = false;
    pushSecretButton.disabled = false;
    datasetsDeployButton.disabled = false;
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
    resultsDecryptButton.disabled = false;
    console.log('initialized');
  } catch (e) {
    console.error(e.message);
  }
};

init();
