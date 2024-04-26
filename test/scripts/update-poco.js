import { getIExecHubOwnership } from './utils.js';
import {
  TEST_CHAINS,
  deployContractFromArtifact,
  linkContractToProxy,
  loadJsonFile,
} from './utils.js';
import { Contract } from 'ethers';

const main = async () => {
  // Import JSON artifacts : Proxy
  const ERC1538Update = await loadJsonFile(
    'ERC1538UpdateDelegate',
    '../PoCo/artifacts/@iexec/solidity/contracts/ERC1538/ERC1538Modules/ERC1538Update.sol/',
  );
  // Import JSON artifacts : Modules
  let IexecAccessors = await loadJsonFile(
    'IexecAccessorsDelegate',
    '../PoCo/artifacts/contracts/modules/delegates/IexecAccessorsDelegate.sol/',
  );
  let IexecAccessorsABILegacy = await loadJsonFile(
    'IexecAccessorsABILegacyDelegate',
    '../PoCo/artifacts/contracts/modules/delegates/IexecAccessorsABILegacyDelegate.sol/',
  );
  let IexecCategoryManager = await loadJsonFile(
    'IexecCategoryManagerDelegate',
    '../PoCo/artifacts/contracts/modules/delegates/IexecCategoryManagerDelegate.sol/',
  );
  let IexecERC20 = await loadJsonFile(
    'IexecERC20Delegate',
    '../PoCo/artifacts/contracts/modules/delegates/IexecERC20Delegate.sol/',
  );
  let IexecEscrowNative = await loadJsonFile(
    'IexecEscrowNativeDelegate',
    '../PoCo/artifacts/contracts/modules/delegates/IexecEscrowNativeDelegate.sol/',
  );
  let IexecMaintenance = await loadJsonFile(
    'IexecMaintenanceDelegate',
    '../PoCo/artifacts/contracts/modules/delegates/IexecMaintenanceDelegate.sol/',
  );
  let IexecMaintenanceExtra = await loadJsonFile(
    'IexecMaintenanceExtraDelegate',
    '../PoCo/artifacts/contracts/modules/delegates/IexecMaintenanceExtraDelegate.sol/',
  );
  let IexecOrderManagement = await loadJsonFile(
    'IexecOrderManagementDelegate',
    '../PoCo/artifacts/contracts/modules/delegates/IexecOrderManagementDelegate.sol/',
  );
  let IexecPoco1 = await loadJsonFile(
    'IexecPoco1Delegate',
    '../PoCo/artifacts/contracts/modules/delegates/IexecPoco1Delegate.sol/',
  );
  let IexecPoco2 = await loadJsonFile(
    'IexecPoco2Delegate',
    '../PoCo/artifacts/contracts/modules/delegates/IexecPoco2Delegate.sol/',
  );
  let IexecRelay = await loadJsonFile(
    'IexecRelayDelegate',
    '../PoCo/artifacts/contracts/modules/delegates/IexecRelayDelegate.sol/',
  );
  let ENSIntegration = await loadJsonFile(
    'ENSIntegrationDelegate',
    '../PoCo/artifacts/contracts/modules/delegates/ENSIntegrationDelegate.sol/',
  );

  getIExecHubOwnership(TEST_CHAINS['bellecour-fork'].pocoAdminWallet);

  // Deployment modules
  const contractsModulesArtifacts = [
    IexecAccessors,
    IexecAccessorsABILegacy,
    IexecCategoryManager,
    IexecERC20,
    IexecEscrowNative,
    // IexecMaintenance, //invalid bytesCode
    IexecMaintenanceExtra,
    // IexecOrderManagement, //invalid bytesCode
    // IexecPoco1, //invalid bytesCode
    IexecPoco2,
    IexecRelay,
    ENSIntegration,
  ];

  // update mapping selectorId into proxy Proxy
  const proxy = new Contract(
    TEST_CHAINS['bellecour-fork'].defaults.hubAddress,
    ERC1538Update.abi,
    TEST_CHAINS['bellecour-fork'].pocoAdminWallet.connect(
      TEST_CHAINS['bellecour-fork'].provider,
    ),
  );

  for (const contractModule of contractsModulesArtifacts) {
    const contract = await deployContractFromArtifact(contractModule);
    await linkContractToProxy(proxy, await contract.getAddress(), contract);
  }
};

main();
