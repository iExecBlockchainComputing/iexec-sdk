import Debug from 'debug';
import BN from 'bn.js';
import { getAddress } from '../wallet/address.js';
import { isInWhitelist } from '../wallet/enterprise.js';
import { checkBalance } from '../account/balance.js';
import {
  checkDeployedApp,
  checkDeployedDataset,
  checkDeployedWorkerpool,
  getAppOwner,
  getDatasetOwner,
  getWorkerpoolOwner,
} from '../protocol/registries.js';
import { createObjParams } from '../execution/order-helper.js';
import {
  checkEvent,
  getEventFromLogs,
  ethersBnToBn,
  getSalt,
  sumTags,
  findMissingBitsInTag,
  checkActiveBitInTag,
  tagBitToHuman,
  checkSigner,
  TAG_MAP,
} from '../utils/utils.js';
import { hashEIP712 } from '../utils/sig-utils.js';
import {
  NULL_BYTES,
  NULL_BYTES32,
  NULL_ADDRESS,
  APP_ORDER,
  DATASET_ORDER,
  WORKERPOOL_ORDER,
  REQUEST_ORDER,
  NULL_DATASETORDER,
} from '../utils/constant.js';
import {
  addressSchema,
  apporderSchema,
  datasetorderSchema,
  workerpoolorderSchema,
  requestorderSchema,
  saltedApporderSchema,
  saltedDatasetorderSchema,
  saltedWorkerpoolorderSchema,
  saltedRequestorderSchema,
  signedApporderSchema,
  signedDatasetorderSchema,
  signedWorkerpoolorderSchema,
  signedRequestorderSchema,
  tagSchema,
  uint256Schema,
  nRlcAmountSchema,
  throwIfMissing,
} from '../utils/validator.js';
import {
  wrapCall,
  wrapSend,
  wrapWait,
  wrapSignTypedData,
} from '../utils/errorWrappers.js';

const debug = Debug('iexec:market:order');

const objDesc = {
  EIP712Domain: {
    primaryType: 'EIP712Domain',
    structMembers: [
      { name: 'name', type: 'string' },
      { name: 'version', type: 'string' },
      { name: 'chainId', type: 'uint256' },
      { name: 'verifyingContract', type: 'address' },
    ],
  },
  [APP_ORDER]: {
    primaryType: 'AppOrder',
    structMembers: [
      { name: 'app', type: 'address' },
      { name: 'appprice', type: 'uint256' },
      { name: 'volume', type: 'uint256' },
      { name: 'tag', type: 'bytes32' },
      { name: 'datasetrestrict', type: 'address' },
      { name: 'workerpoolrestrict', type: 'address' },
      { name: 'requesterrestrict', type: 'address' },
      { name: 'salt', type: 'bytes32' },
    ],
    contractPropName: 'app',
    ownerMethod: getAppOwner,
    cancelMethod: 'manageAppOrder',
    cancelEvent: 'ClosedAppOrder',
    addressField: 'app',
  },
  [DATASET_ORDER]: {
    primaryType: 'DatasetOrder',
    structMembers: [
      { name: 'dataset', type: 'address' },
      { name: 'datasetprice', type: 'uint256' },
      { name: 'volume', type: 'uint256' },
      { name: 'tag', type: 'bytes32' },
      { name: 'apprestrict', type: 'address' },
      { name: 'workerpoolrestrict', type: 'address' },
      { name: 'requesterrestrict', type: 'address' },
      { name: 'salt', type: 'bytes32' },
    ],
    contractPropName: 'dataset',
    ownerMethod: getDatasetOwner,
    cancelMethod: 'manageDatasetOrder',
    cancelEvent: 'ClosedDatasetOrder',
    addressField: 'dataset',
  },
  [WORKERPOOL_ORDER]: {
    primaryType: 'WorkerpoolOrder',
    structMembers: [
      { name: 'workerpool', type: 'address' },
      { name: 'workerpoolprice', type: 'uint256' },
      { name: 'volume', type: 'uint256' },
      { name: 'tag', type: 'bytes32' },
      { name: 'category', type: 'uint256' },
      { name: 'trust', type: 'uint256' },
      { name: 'apprestrict', type: 'address' },
      { name: 'datasetrestrict', type: 'address' },
      { name: 'requesterrestrict', type: 'address' },
      { name: 'salt', type: 'bytes32' },
    ],
    contractPropName: 'workerpool',
    ownerMethod: getWorkerpoolOwner,
    cancelMethod: 'manageWorkerpoolOrder',
    cancelEvent: 'ClosedWorkerpoolOrder',
    addressField: 'workerpool',
  },
  [REQUEST_ORDER]: {
    primaryType: 'RequestOrder',
    structMembers: [
      { name: 'app', type: 'address' },
      { name: 'appmaxprice', type: 'uint256' },
      { name: 'dataset', type: 'address' },
      { name: 'datasetmaxprice', type: 'uint256' },
      { name: 'workerpool', type: 'address' },
      { name: 'workerpoolmaxprice', type: 'uint256' },
      { name: 'requester', type: 'address' },
      { name: 'volume', type: 'uint256' },
      { name: 'tag', type: 'bytes32' },
      { name: 'category', type: 'uint256' },
      { name: 'trust', type: 'uint256' },
      { name: 'beneficiary', type: 'address' },
      { name: 'callback', type: 'address' },
      { name: 'params', type: 'string' },
      { name: 'salt', type: 'bytes32' },
    ],
    cancelMethod: 'manageRequestOrder',
    cancelEvent: 'ClosedRequestOrder',
    addressField: 'requester',
  },
};

const objToStructArray = (objName, obj) => {
  const reducer = (total, current) => total.concat([obj[current.name]]);
  return objDesc[objName].structMembers.reduce(reducer, []);
};

const signedOrderToStruct = (orderName, orderObj) => {
  const unsigned = objToStructArray(orderName, orderObj);
  return unsigned.concat([orderObj.sign]);
};

const getEIP712Domain = async (contracts) => {
  const iexecContract = await contracts.getIExecContract();
  const { name, version, chainId, verifyingContract } = await wrapCall(
    iexecContract.domain(),
  );
  return {
    name,
    version,
    chainId: chainId.toString(),
    verifyingContract,
  };
};

const getContractOwner = async (
  contracts = throwIfMissing(),
  orderName = throwIfMissing(),
  orderObj = throwIfMissing(),
) => {
  const contractAddress = orderObj[objDesc[orderName].contractPropName];
  return objDesc[orderName].ownerMethod(contracts, contractAddress);
};

export const computeOrderHash = async (
  contracts = throwIfMissing(),
  orderName = throwIfMissing(),
  order = throwIfMissing(),
) => {
  try {
    let vOrder;
    switch (orderName) {
      case APP_ORDER:
        vOrder = await saltedApporderSchema({
          ethProvider: contracts.provider,
        }).validate(order);
        break;
      case DATASET_ORDER:
        vOrder = await saltedDatasetorderSchema({
          ethProvider: contracts.provider,
        }).validate(order);
        break;
      case WORKERPOOL_ORDER:
        vOrder = await saltedWorkerpoolorderSchema({
          ethProvider: contracts.provider,
        }).validate(order);
        break;
      case REQUEST_ORDER:
        vOrder = await saltedRequestorderSchema({
          ethProvider: contracts.provider,
        }).validate(order);
        break;
      default:
    }
    const domainObj = await getEIP712Domain(contracts);
    const types = {};
    types.EIP712Domain = objDesc.EIP712Domain.structMembers;
    types[objDesc[orderName].primaryType] = objDesc[orderName].structMembers;

    const typedData = {
      types,
      domain: domainObj,
      primaryType: objDesc[orderName].primaryType,
      message: vOrder,
    };
    return hashEIP712(typedData);
  } catch (error) {
    debug('computeOrderHash()', error);
    throw error;
  }
};

export const hashApporder = async (
  contracts = throwIfMissing(),
  order = throwIfMissing(),
) =>
  computeOrderHash(
    contracts,
    APP_ORDER,
    await saltedApporderSchema({
      ethProvider: contracts.provider,
    }).validate(order),
  );
export const hashDatasetorder = async (
  contracts = throwIfMissing(),
  order = throwIfMissing(),
) =>
  computeOrderHash(
    contracts,
    DATASET_ORDER,
    await saltedDatasetorderSchema({
      ethProvider: contracts.provider,
    }).validate(order),
  );
export const hashWorkerpoolorder = async (
  contracts = throwIfMissing(),
  order = throwIfMissing(),
) =>
  computeOrderHash(
    contracts,
    WORKERPOOL_ORDER,
    await saltedWorkerpoolorderSchema({
      ethProvider: contracts.provider,
    }).validate(order),
  );
export const hashRequestorder = async (
  contracts = throwIfMissing(),
  order = throwIfMissing(),
) =>
  computeOrderHash(
    contracts,
    REQUEST_ORDER,
    await saltedRequestorderSchema({
      ethProvider: contracts.provider,
    }).validate(order),
  );

export const getRemainingVolume = async (
  contracts = throwIfMissing(),
  orderName = throwIfMissing(),
  order = throwIfMissing(),
) => {
  try {
    const initial = new BN(order.volume);
    if (initial.isZero()) {
      return initial;
    }
    const orderHash = await computeOrderHash(contracts, orderName, order);
    const iexecContract = contracts.getIExecContract();
    const cons = await wrapCall(iexecContract.viewConsumed(orderHash));
    const consumed = ethersBnToBn(cons);
    return initial.sub(consumed);
  } catch (error) {
    debug('getRemainingVolume()', error);
    throw error;
  }
};

const signOrder = async (
  contracts = throwIfMissing(),
  orderName = throwIfMissing(),
  orderObj = throwIfMissing(),
) => {
  checkSigner(contracts);
  const signerAddress =
    orderName === REQUEST_ORDER
      ? orderObj.requester
      : await getContractOwner(contracts, orderName, orderObj);
  const address = await getAddress(contracts);
  if (signerAddress !== address) {
    throw Error(
      `Invalid order signer, must be the ${
        orderName === REQUEST_ORDER ? 'requester' : 'resource owner'
      }`,
    );
  }
  const salt = getSalt();
  const saltedOrder = { ...orderObj, salt };
  const domain = await getEIP712Domain(contracts);
  const types = {
    [objDesc[orderName].primaryType]: objDesc[orderName].structMembers,
  };
  const { signer } = contracts;
  const sign = await wrapSignTypedData(
    // use experiential ether Signer._signTypedData (to remove when signTypedData is included)
    // https://docs.ethers.io/v5/api/signer/#Signer-signTypedData
    /* eslint no-underscore-dangle: ["error", { "allow": ["_signTypedData"] }] */
    signer._signTypedData && typeof signer._signTypedData === 'function'
      ? signer._signTypedData(domain, types, saltedOrder)
      : signer.signTypedData(domain, types, saltedOrder),
  );
  return { ...saltedOrder, sign };
};

export const signApporder = async (
  contracts = throwIfMissing(),
  apporder = throwIfMissing(),
) =>
  signOrder(
    contracts,
    APP_ORDER,
    await apporderSchema({ ethProvider: contracts.provider }).validate(
      apporder,
    ),
  );

export const signDatasetorder = async (
  contracts = throwIfMissing(),
  datasetorder = throwIfMissing(),
) =>
  signOrder(
    contracts,
    DATASET_ORDER,
    await datasetorderSchema({
      ethProvider: contracts.provider,
    }).validate(datasetorder),
  );

export const signWorkerpoolorder = async (
  contracts = throwIfMissing(),
  workerpoolorder = throwIfMissing(),
) =>
  signOrder(
    contracts,
    WORKERPOOL_ORDER,
    await workerpoolorderSchema({
      ethProvider: contracts.provider,
    }).validate(workerpoolorder),
  );

export const signRequestorder = async (
  contracts = throwIfMissing(),
  requestorder = throwIfMissing(),
) =>
  signOrder(
    contracts,
    REQUEST_ORDER,
    await requestorderSchema({
      ethProvider: contracts.provider,
    }).validate(requestorder),
  );

const cancelOrder = async (
  contracts = throwIfMissing(),
  orderName = throwIfMissing(),
  orderObj = throwIfMissing(),
) => {
  try {
    checkSigner(contracts);
    const args = signedOrderToStruct(orderName, orderObj);
    const remainingVolume = await getRemainingVolume(
      contracts,
      orderName,
      orderObj,
    );
    if (remainingVolume.isZero()) throw Error(`${orderName} already canceled`);
    const iexecContract = contracts.getIExecContract();
    const tx = await wrapSend(
      iexecContract[objDesc[orderName].cancelMethod](
        [args, 1, NULL_BYTES],
        contracts.txOptions,
      ),
    );
    const txReceipt = await wrapWait(tx.wait(contracts.confirms));
    if (!checkEvent(objDesc[orderName].cancelEvent, txReceipt.events))
      throw Error(`${objDesc[orderName].cancelEvent} not confirmed`);
    return { order: orderObj, txHash: tx.hash };
  } catch (error) {
    debug('cancelOrder()', error);
    throw error;
  }
};

export const cancelApporder = async (
  contracts = throwIfMissing(),
  apporder = throwIfMissing(),
) =>
  cancelOrder(
    contracts,
    APP_ORDER,
    await signedApporderSchema().validate(apporder),
  );

export const cancelDatasetorder = async (
  contracts = throwIfMissing(),
  datasetorder = throwIfMissing(),
) =>
  cancelOrder(
    contracts,
    DATASET_ORDER,
    await signedDatasetorderSchema().validate(datasetorder),
  );

export const cancelWorkerpoolorder = async (
  contracts = throwIfMissing(),
  workerpoolorder = throwIfMissing(),
) =>
  cancelOrder(
    contracts,
    WORKERPOOL_ORDER,
    await signedWorkerpoolorderSchema().validate(workerpoolorder),
  );

export const cancelRequestorder = async (
  contracts = throwIfMissing(),
  requestorder = throwIfMissing(),
) =>
  cancelOrder(
    contracts,
    REQUEST_ORDER,
    await signedRequestorderSchema().validate(requestorder),
  );

const verifySign = async (
  contracts = throwIfMissing(),
  signer = throwIfMissing(),
  orderHash = throwIfMissing(),
  sign = throwIfMissing(),
) => {
  const iexecContract = contracts.getIExecContract();
  const isValid = await wrapCall(
    iexecContract.verifySignature(signer, orderHash, sign),
  );
  return !!isValid;
};

const getMatchableVolume = async (
  contracts = throwIfMissing(),
  appOrder = throwIfMissing(),
  datasetOrder = NULL_DATASETORDER,
  workerpoolOrder = throwIfMissing(),
  requestOrder = throwIfMissing(),
) => {
  try {
    const [vAppOrder, vDatasetOrder, vWorkerpoolOrder, vRequestOrder] =
      await Promise.all([
        signedApporderSchema().validate(appOrder),
        signedDatasetorderSchema().validate(datasetOrder),
        signedWorkerpoolorderSchema().validate(workerpoolOrder),
        signedRequestorderSchema().validate(requestOrder),
      ]);

    // deployment checks
    const checkAppDeployedAsync = async () => {
      if (!(await checkDeployedApp(contracts, vAppOrder.app))) {
        throw new Error(`No app deployed at address ${vAppOrder.app}`);
      }
    };
    const checkDatasetDeployedAsync = async () => {
      if (vDatasetOrder.dataset !== NULL_ADDRESS) {
        if (!(await checkDeployedDataset(contracts, vDatasetOrder.dataset))) {
          throw new Error(
            `No dataset deployed at address ${vDatasetOrder.dataset}`,
          );
        }
      }
    };
    const checkWorkerpoolDeployedAsync = async () => {
      if (
        !(await checkDeployedWorkerpool(contracts, vWorkerpoolOrder.workerpool))
      ) {
        throw new Error(
          `No workerpool deployed at address ${vWorkerpoolOrder.workerpool}`,
        );
      }
    };

    await Promise.all([
      checkAppDeployedAsync(),
      checkDatasetDeployedAsync(),
      checkWorkerpoolDeployedAsync(),
    ]);

    // signatures checks
    const checkAppSignAsync = async () => {
      const isValid = await verifySign(
        contracts,
        await getAppOwner(contracts, vAppOrder.app),
        await hashApporder(contracts, vAppOrder),
        vAppOrder.sign,
      );
      if (!isValid) {
        throw new Error('apporder invalid sign');
      }
    };
    const checkDatasetSignAsync = async () => {
      if (vDatasetOrder.dataset !== NULL_ADDRESS) {
        const isValid = await verifySign(
          contracts,
          await getDatasetOwner(contracts, vDatasetOrder.dataset),
          await hashDatasetorder(contracts, vDatasetOrder),
          vDatasetOrder.sign,
        );
        if (!isValid) {
          throw new Error('datasetorder invalid sign');
        }
      }
    };
    const checkWorkerpoolSignAsync = async () => {
      const isValid = await verifySign(
        contracts,
        await getWorkerpoolOwner(contracts, vWorkerpoolOrder.workerpool),
        await hashWorkerpoolorder(contracts, vWorkerpoolOrder),
        vWorkerpoolOrder.sign,
      );
      if (!isValid) {
        throw new Error('workerpoolorder invalid sign');
      }
    };
    const checkRequestSignAsync = async () => {
      const isValid = await verifySign(
        contracts,
        vRequestOrder.requester,
        await hashRequestorder(contracts, vRequestOrder),
        vRequestOrder.sign,
      );
      if (!isValid) {
        throw new Error('requestorder invalid sign');
      }
    };

    await Promise.all([
      checkAppSignAsync(),
      checkDatasetSignAsync(),
      checkWorkerpoolSignAsync(),
      checkRequestSignAsync(),
    ]);

    // enterprise KYC checks
    if (contracts.flavour === 'enterprise') {
      debug('check enterprise');
      const checkRequesterInWhitelistAsync = async () => {
        const isKYC = await isInWhitelist(contracts, vRequestOrder.requester, {
          strict: false,
        });
        debug('requester in whitelist', isKYC);
        if (!isKYC) {
          throw new Error(
            `requester ${vRequestOrder.requester} is not authorized to interact with eRLC`,
          );
        }
      };
      const checkAppOwnerInWhitelistAsync = async () => {
        const owner = await getAppOwner(contracts, vAppOrder.app);
        const isKYC = await isInWhitelist(contracts, owner, { strict: false });
        debug('app owner in whitelist', isKYC);
        if (!isKYC) {
          throw new Error(
            `app owner ${owner} is not authorized to interact with eRLC`,
          );
        }
      };
      const checkDatasetOwnerInWhitelistAsync = async () => {
        if (vDatasetOrder.dataset === NULL_ADDRESS) {
          return;
        }
        const owner = await getDatasetOwner(contracts, vDatasetOrder.dataset);
        const isKYC = await isInWhitelist(contracts, owner, { strict: false });
        debug('dataset owner in whitelist', isKYC);
        if (!isKYC) {
          throw new Error(
            `dataset owner ${owner} is not authorized to interact with eRLC`,
          );
        }
      };
      const checkWorkerpoolOwnerInWhitelistAsync = async () => {
        const owner = await getWorkerpoolOwner(
          contracts,
          vWorkerpoolOrder.workerpool,
        );
        const isKYC = await isInWhitelist(contracts, owner, { strict: false });
        debug('workerpool owner in whitelist', isKYC);
        if (!isKYC) {
          throw new Error(
            `workerpool owner ${owner} is not authorized to interact with eRLC`,
          );
        }
      };
      await Promise.all([
        checkRequesterInWhitelistAsync(),
        checkAppOwnerInWhitelistAsync(),
        checkDatasetOwnerInWhitelistAsync(),
        checkWorkerpoolOwnerInWhitelistAsync(),
      ]);
    }

    // address checks
    if (vRequestOrder.app !== vAppOrder.app) {
      throw new Error(
        `app address mismatch between requestorder (${vRequestOrder.app}) and apporder (${vAppOrder.app})`,
      );
    }
    if (
      vRequestOrder.dataset !== NULL_ADDRESS &&
      vRequestOrder.dataset !== vDatasetOrder.dataset
    ) {
      throw new Error(
        `dataset address mismatch between requestorder (${vRequestOrder.dataset}) and datasetorder (${vDatasetOrder.dataset})`,
      );
    }
    if (
      vRequestOrder.workerpool !== NULL_ADDRESS &&
      vRequestOrder.workerpool !== vWorkerpoolOrder.workerpool
    ) {
      throw new Error(
        `workerpool address mismatch between requestorder (${vRequestOrder.workerpool}) and workerpoolorder (${vWorkerpoolOrder.workerpool})`,
      );
    }
    // category check
    const requestCat = new BN(vRequestOrder.category);
    const workerpoolCat = new BN(vWorkerpoolOrder.category);
    if (!workerpoolCat.eq(requestCat)) {
      throw new Error(
        `category mismatch between requestorder (${requestCat}) and workerpoolorder (${workerpoolCat})`,
      );
    }
    // trust check
    const requestTrust = new BN(vRequestOrder.trust);
    const workerpoolTrust = new BN(vWorkerpoolOrder.trust);
    if (workerpoolTrust.lt(requestTrust)) {
      throw new Error(
        `workerpoolorder trust is too low (expected ${requestTrust}, got ${workerpoolTrust})`,
      );
    }
    // workerpool tag check
    const workerpoolMissingTagBits = findMissingBitsInTag(
      vWorkerpoolOrder.tag,
      sumTags([vRequestOrder.tag, vAppOrder.tag, vDatasetOrder.tag]),
    );
    if (workerpoolMissingTagBits.length > 0) {
      throw Error(
        `Missing tags [${workerpoolMissingTagBits.map((bit) =>
          tagBitToHuman(bit),
        )}] in workerpoolorder`,
      );
    }
    // app tag check
    const teeAppRequired = checkActiveBitInTag(
      sumTags([vRequestOrder.tag, vDatasetOrder.tag]),
      1,
    );
    if (teeAppRequired) {
      if (!checkActiveBitInTag(vAppOrder.tag, TAG_MAP.tee)) {
        throw Error('Missing tag [tee] in apporder');
      }
    }

    // price check
    const workerpoolPrice = new BN(vWorkerpoolOrder.workerpoolprice);
    const workerpoolMaxPrice = new BN(vRequestOrder.workerpoolmaxprice);
    const appPrice = new BN(vAppOrder.appprice);
    const appMaxPrice = new BN(vRequestOrder.appmaxprice);
    const datasetPrice = new BN(vDatasetOrder.datasetprice);
    const datasetMaxPrice = new BN(vRequestOrder.datasetmaxprice);
    if (appMaxPrice.lt(appPrice)) {
      throw new Error(
        `appmaxprice too low (expected ${appPrice}, got ${appMaxPrice})`,
      );
    }
    if (workerpoolMaxPrice.lt(workerpoolPrice)) {
      throw new Error(
        `workerpoolmaxprice too low (expected ${workerpoolPrice}, got ${workerpoolMaxPrice})`,
      );
    }
    if (datasetMaxPrice.lt(datasetPrice)) {
      throw new Error(
        `datasetmaxprice too low (expected ${datasetPrice}, got ${datasetMaxPrice})`,
      );
    }

    // workerpool owner stake check
    const workerpoolOwner = await getWorkerpoolOwner(
      contracts,
      vWorkerpoolOrder.workerpool,
    );
    const { stake } = await checkBalance(contracts, workerpoolOwner);
    const requiredStakePerTask = workerpoolPrice
      .mul(new BN(30))
      .div(new BN(100));
    const workerpoolStakedVolume = requiredStakePerTask.isZero()
      ? new BN(workerpoolOrder.volume)
      : stake.div(requiredStakePerTask);
    if (workerpoolStakedVolume.isZero()) {
      throw Error(
        `workerpool required stake (${requiredStakePerTask}) is greater than workerpool owner's account stake (${stake}). Orders can't be matched. If you are the workerpool owner, you should deposit to top up your account`,
      );
    }

    // check matchable volume
    const volumes = await Promise.all(
      vRequestOrder.dataset !== NULL_ADDRESS
        ? [
            getRemainingVolume(contracts, APP_ORDER, vAppOrder).then(
              (volume) => {
                if (volume.lte(new BN(0)))
                  throw new Error('apporder is fully consumed');
                return volume;
              },
            ),
            getRemainingVolume(contracts, DATASET_ORDER, vDatasetOrder).then(
              (volume) => {
                if (volume.lte(new BN(0)))
                  throw new Error('datasetorder is fully consumed');
                return volume;
              },
            ),
            getRemainingVolume(
              contracts,
              WORKERPOOL_ORDER,
              vWorkerpoolOrder,
            ).then((volume) => {
              if (volume.lte(new BN(0)))
                throw new Error('workerpoolorder is fully consumed');
              return volume;
            }),
            getRemainingVolume(contracts, REQUEST_ORDER, vRequestOrder).then(
              (volume) => {
                if (volume.lte(new BN(0)))
                  throw new Error('requestorder is fully consumed');
                return volume;
              },
            ),
          ]
        : [
            getRemainingVolume(contracts, APP_ORDER, vAppOrder).then(
              (volume) => {
                if (volume.lte(new BN(0)))
                  throw new Error('apporder is fully consumed');
                return volume;
              },
            ),
            getRemainingVolume(
              contracts,
              WORKERPOOL_ORDER,
              vWorkerpoolOrder,
            ).then((volume) => {
              if (volume.lte(new BN(0)))
                throw new Error('workerpoolorder is fully consumed');
              return volume;
            }),
            getRemainingVolume(contracts, REQUEST_ORDER, vRequestOrder).then(
              (volume) => {
                if (volume.lte(new BN(0)))
                  throw new Error('requestorder is fully consumed');
                return volume;
              },
            ),
          ],
    );
    return volumes.reduce(
      (min, curr) => (curr.lt(min) ? curr : min),
      workerpoolStakedVolume,
    );
  } catch (error) {
    debug('getMatchableVolume()', error);
    throw error;
  }
};

export const matchOrders = async (
  contracts = throwIfMissing(),
  appOrder = throwIfMissing(),
  datasetOrder = NULL_DATASETORDER,
  workerpoolOrder = throwIfMissing(),
  requestOrder = throwIfMissing(),
) => {
  try {
    checkSigner(contracts);
    const [vAppOrder, vDatasetOrder, vWorkerpoolOrder, vRequestOrder] =
      await Promise.all([
        signedApporderSchema().validate(appOrder),
        signedDatasetorderSchema().validate(datasetOrder),
        signedWorkerpoolorderSchema().validate(workerpoolOrder),
        signedRequestorderSchema().validate(requestOrder),
      ]);

    // check resulting tag
    await tagSchema()
      .validate(sumTags([vAppOrder.tag, vDatasetOrder.tag, vRequestOrder.tag]))
      .catch((e) => {
        throw new Error(
          `Matching order would produce an invalid deal tag. ${e.message}`,
        );
      });

    // check matchability
    const matchableVolume = await getMatchableVolume(
      contracts,
      vAppOrder,
      vDatasetOrder,
      vWorkerpoolOrder,
      vRequestOrder,
    );

    const workerpoolPrice = new BN(vWorkerpoolOrder.workerpoolprice);
    const appPrice = new BN(vAppOrder.appprice);
    const datasetPrice = new BN(vDatasetOrder.datasetprice);

    // account stake check
    const checkRequesterSolvabilityAsync = async () => {
      const costPerTask = appPrice.add(datasetPrice).add(workerpoolPrice);
      const totalCost = costPerTask.mul(matchableVolume);
      const { stake } = await checkBalance(contracts, vRequestOrder.requester);
      if (stake.lt(costPerTask)) {
        throw new Error(
          `Cost per task (${costPerTask}) is greater than requester account stake (${stake}). Orders can't be matched. If you are the requester, you should deposit to top up your account`,
        );
      }
      if (stake.lt(totalCost)) {
        throw new Error(
          `Total cost for ${matchableVolume} tasks (${totalCost}) is greater than requester account stake (${stake}). Orders can't be matched. If you are the requester, you should deposit to top up your account or reduce your requestorder volume`,
        );
      }
    };

    await checkRequesterSolvabilityAsync();

    const appOrderStruct = signedOrderToStruct(APP_ORDER, vAppOrder);
    const datasetOrderStruct = signedOrderToStruct(
      DATASET_ORDER,
      vDatasetOrder,
    );
    const workerpoolOrderStruct = signedOrderToStruct(
      WORKERPOOL_ORDER,
      vWorkerpoolOrder,
    );
    const requestOrderStruct = signedOrderToStruct(
      REQUEST_ORDER,
      vRequestOrder,
    );
    const iexecContract = contracts.getIExecContract();
    const tx = await wrapSend(
      iexecContract.matchOrders(
        appOrderStruct,
        datasetOrderStruct,
        workerpoolOrderStruct,
        requestOrderStruct,
        contracts.txOptions,
      ),
    );
    const txReceipt = await wrapWait(tx.wait(contracts.confirms));
    const matchEvent = 'OrdersMatched';
    if (!checkEvent(matchEvent, txReceipt.events))
      throw Error(`${matchEvent} not confirmed`);
    const { dealid, volume } = getEventFromLogs(
      matchEvent,
      txReceipt.events,
    ).args;
    return { dealid, volume: ethersBnToBn(volume), txHash: tx.hash };
  } catch (error) {
    debug('matchOrders() error', error);
    throw error;
  }
};

export const createApporder = async (
  contracts = throwIfMissing(),
  {
    app = throwIfMissing(),
    appprice = '0',
    volume = '1',
    tag = NULL_BYTES32,
    datasetrestrict = NULL_ADDRESS,
    workerpoolrestrict = NULL_ADDRESS,
    requesterrestrict = NULL_ADDRESS,
  } = {},
) => ({
  app: await addressSchema({ ethProvider: contracts.provider }).validate(app),
  appprice: await nRlcAmountSchema().validate(appprice),
  volume: await uint256Schema().validate(volume),
  tag: await tagSchema().validate(tag),
  datasetrestrict: await addressSchema({
    ethProvider: contracts.provider,
  }).validate(datasetrestrict),
  workerpoolrestrict: await addressSchema({
    ethProvider: contracts.provider,
  }).validate(workerpoolrestrict),
  requesterrestrict: await addressSchema({
    ethProvider: contracts.provider,
  }).validate(requesterrestrict),
});

export const createDatasetorder = async (
  contracts = throwIfMissing(),
  {
    dataset = throwIfMissing(),
    datasetprice = '0',
    volume = '1',
    tag = NULL_BYTES32,
    apprestrict = NULL_ADDRESS,
    workerpoolrestrict = NULL_ADDRESS,
    requesterrestrict = NULL_ADDRESS,
  } = {},
) => ({
  dataset: await addressSchema({
    ethProvider: contracts.provider,
  }).validate(dataset),
  datasetprice: await nRlcAmountSchema().validate(datasetprice),
  volume: await uint256Schema().validate(volume),
  tag: await tagSchema().validate(tag),
  apprestrict: await addressSchema({
    ethProvider: contracts.provider,
  }).validate(apprestrict),
  workerpoolrestrict: await addressSchema({
    ethProvider: contracts.provider,
  }).validate(workerpoolrestrict),
  requesterrestrict: await addressSchema({
    ethProvider: contracts.provider,
  }).validate(requesterrestrict),
});

export const createWorkerpoolorder = async (
  contracts = throwIfMissing(),
  {
    workerpool = throwIfMissing(),
    category = throwIfMissing(),
    workerpoolprice = '0',
    volume = '1',
    trust = '0',
    tag = NULL_BYTES32,
    apprestrict = NULL_ADDRESS,
    datasetrestrict = NULL_ADDRESS,
    requesterrestrict = NULL_ADDRESS,
  } = {},
) => ({
  workerpool: await addressSchema({
    ethProvider: contracts.provider,
  }).validate(workerpool),
  workerpoolprice: await nRlcAmountSchema().validate(workerpoolprice),
  volume: await uint256Schema().validate(volume),
  category: await uint256Schema().validate(category),
  trust: await uint256Schema().validate(trust),
  tag: await tagSchema().validate(tag),
  apprestrict: await addressSchema({
    ethProvider: contracts.provider,
  }).validate(apprestrict),
  datasetrestrict: await addressSchema({
    ethProvider: contracts.provider,
  }).validate(datasetrestrict),
  requesterrestrict: await addressSchema({
    ethProvider: contracts.provider,
  }).validate(requesterrestrict),
});

export const createRequestorder = async (
  { contracts = throwIfMissing(), resultProxyURL = throwIfMissing() } = {},
  {
    app = throwIfMissing(),
    category = throwIfMissing(),
    dataset = NULL_ADDRESS,
    workerpool = NULL_ADDRESS,
    appmaxprice = '0',
    datasetmaxprice = '0',
    workerpoolmaxprice = '0',
    volume = '1',
    requester,
    beneficiary,
    params = {},
    callback = NULL_ADDRESS,
    trust = '0',
    tag = NULL_BYTES32,
  } = {},
) => {
  const requesterOrUser = requester || (await getAddress(contracts));
  return {
    app: await addressSchema({
      ethProvider: contracts.provider,
    }).validate(app),
    appmaxprice: await nRlcAmountSchema().validate(appmaxprice),
    dataset: await addressSchema({
      ethProvider: contracts.provider,
    }).validate(dataset),
    datasetmaxprice: await nRlcAmountSchema().validate(datasetmaxprice),
    workerpool: await addressSchema({
      ethProvider: contracts.provider,
    }).validate(workerpool),
    workerpoolmaxprice: await nRlcAmountSchema().validate(workerpoolmaxprice),
    requester: await addressSchema({
      ethProvider: contracts.provider,
    }).validate(requesterOrUser),
    beneficiary: await addressSchema({
      ethProvider: contracts.provider,
    }).validate(beneficiary || requesterOrUser),
    volume: await uint256Schema().validate(volume),
    params: await createObjParams({
      params,
      tag: await tagSchema().validate(tag),
      callback: await addressSchema({
        ethProvider: contracts.provider,
      }).validate(callback),
      resultProxyURL,
    }),
    callback: await addressSchema({
      ethProvider: contracts.provider,
    }).validate(callback),
    category: await uint256Schema().validate(category),
    trust: await uint256Schema().validate(trust),
    tag: await tagSchema().validate(tag),
  };
};
