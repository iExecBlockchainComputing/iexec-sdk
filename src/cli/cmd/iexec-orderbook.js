#!/usr/bin/env node

import { program as cli } from 'commander';
import {
  fetchAppOrderbook,
  fetchDatasetOrderbook,
  fetchRequestOrderbook,
  fetchWorkerpoolOrderbook,
} from '../../common/market/orderbook.js';
import { NULL_ADDRESS, NULL_BYTES32 } from '../../common/utils/constant.js';
import {
  finalizeCli,
  addGlobalOptions,
  checkUpdate,
  handleError,
  desc,
  option,
  Spinner,
  displayPaginableRequest,
  pretty,
  info,
  getPropertyFormChain,
} from '../utils/cli-helper.js';
import { loadChain } from '../utils/chains.js';

const objName = 'orderbook';

cli.name('iexec orderbook').usage('<command> [options]');

const orderbookApp = cli.command('app <address>');
addGlobalOptions(orderbookApp);
orderbookApp
  .option(...option.chain())
  .option(...option.tag())
  .option(...option.requiredTag())
  .option(...option.maxTag())
  .option(...option.minVolume())
  .option(...option.includeDatasetSpecific())
  .option(...option.includeWorkerpoolSpecific())
  .option(...option.includeRequesterSpecific())
  .option(...option.isDatasetStrict())
  .description(desc.showObj('app orderbook', 'marketplace'))
  .action(async (app, opts) => {
    await checkUpdate(opts);
    const spinner = Spinner(opts);
    try {
      const chain = await loadChain(opts.chain, {
        spinner,
      });
      const {
        dataset,
        workerpool,
        requester,
        tag,
        requireTag,
        maxTag,
        minVolume,
        raw,
        isDatasetStrict,
        isWorkerpoolStrict,
        isRequesterStrict,
      } = opts;

      const request = fetchAppOrderbook(
        chain.contracts,
        getPropertyFormChain(chain, 'iexecGateway'),
        app,
        {
          dataset,
          workerpool,
          requester,
          minTag: tag !== undefined ? tag : requireTag,
          maxTag: tag !== undefined ? tag : maxTag,
          minVolume,
          isDatasetStrict,
          isWorkerpoolStrict,
          isRequesterStrict,
        },
      );
      const fetchMessage = info.showing(objName);
      const processResponse = (res) =>
        res.orders
          ? res.orders.map((e) => ({
              orderHash: e.orderHash,
              price: e.order.appprice,
              remaining: e.remaining,
              app: e.order.app,
              tag: e.order.tag,
              datasetrestrict: e.order.datasetrestrict,
              workerpoolrestrict: e.order.workerpoolrestrict,
              requesterrestrict: e.order.requesterrestrict,
            }))
          : [];
      const createResultsMessage = (
        callResults,
        initialResultsCount,
        totalCount,
      ) =>
        `Apporders details (${initialResultsCount + 1} to ${
          initialResultsCount + callResults.length
        }${totalCount ? ` of ${totalCount}` : ''}):${pretty(
          callResults.map((e) => ({
            orderHash: e.orderHash,
            price: e.price,
            remaining: e.remaining,
            ...(e.tag !== NULL_BYTES32 && { tag: e.tag }),
            ...(e.datasetrestrict !== NULL_ADDRESS && {
              datasetrestrict: e.datasetrestrict,
            }),
            ...(e.workerpoolrestrict !== NULL_ADDRESS && {
              workerpoolrestrict: e.workerpoolrestrict,
            }),
            ...(e.requesterrestrict !== NULL_ADDRESS && {
              requesterrestrict: e.requesterrestrict,
            }),
          })),
        )}`;

      const { results, count } = await displayPaginableRequest({
        request,
        processResponse,
        fetchMessage,
        createResultsMessage,
        spinner,
        raw,
      });

      const successMessage =
        results.length > 0 ? 'No more results' : 'Empty orderbook';

      spinner.succeed(successMessage, {
        raw: {
          count,
          appOrders: results,
        },
      });
      spinner.info('Trade in the browser at https://market.iex.ec');
    } catch (error) {
      handleError(error, cli, opts);
    }
  });

const orderbookDataset = cli.command('dataset <address>');
addGlobalOptions(orderbookDataset);
orderbookDataset
  .option(...option.chain())
  .option(...option.tag())
  .option(...option.requiredTag())
  .option(...option.maxTag())
  .option(...option.minVolume())
  .option(...option.includeAppSpecific())
  .option(...option.includeWorkerpoolSpecific())
  .option(...option.includeRequesterSpecific())
  .option(...option.isAppStrict())
  .option(...option.isRequesterStrict())
  .option(...option.isWorkerpoolStrict())
  .description(desc.showObj('dataset orderbook', 'marketplace'))
  .action(async (dataset, opts) => {
    await checkUpdate(opts);
    const spinner = Spinner(opts);
    try {
      const chain = await loadChain(opts.chain, {
        spinner,
      });
      const {
        app,
        workerpool,
        requester,
        minVolume,
        tag,
        maxTag,
        requireTag,
        raw,
        isAppStrict,
        isRequesterStrict,
        isWorkerpoolStrict,
      } = opts;

      const request = fetchDatasetOrderbook(
        chain.contracts,
        getPropertyFormChain(chain, 'iexecGateway'),
        dataset,
        {
          app,
          workerpool,
          requester,
          minTag: tag !== undefined ? tag : requireTag,
          maxTag: tag !== undefined ? tag : maxTag,
          minVolume,
          isAppStrict,
          isRequesterStrict,
          isWorkerpoolStrict,
        },
      );
      const fetchMessage = info.showing(objName);
      const processResponse = (res) =>
        res.orders
          ? res.orders.map((e) => ({
              orderHash: e.orderHash,
              price: e.order.datasetprice,
              remaining: e.remaining,
              dataset: e.order.dataset,
              tag: e.order.tag,
              apprestrict: e.order.apprestrict,
              workerpoolrestrict: e.order.workerpoolrestrict,
              requesterrestrict: e.order.requesterrestrict,
            }))
          : [];
      const createResultsMessage = (
        callResults,
        initialResultsCount,
        totalCount,
      ) =>
        `Datasetorders details (${initialResultsCount + 1} to ${
          initialResultsCount + callResults.length
        }${totalCount ? ` of ${totalCount}` : ''}):${pretty(
          callResults.map((e) => ({
            orderHash: e.orderHash,
            price: e.price,
            remaining: e.remaining,
            ...(e.tag !== NULL_BYTES32 && { tag: e.tag }),
            ...(e.apprestrict !== NULL_ADDRESS && {
              apprestrict: e.apprestrict,
            }),
            ...(e.workerpoolrestrict !== NULL_ADDRESS && {
              workerpoolrestrict: e.workerpoolrestrict,
            }),
            ...(e.requesterrestrict !== NULL_ADDRESS && {
              requesterrestrict: e.requesterrestrict,
            }),
          })),
        )}`;

      const { results, count } = await displayPaginableRequest({
        request,
        processResponse,
        fetchMessage,
        createResultsMessage,
        spinner,
        raw,
      });

      const successMessage =
        results.length > 0 ? 'No more results' : 'Empty orderbook';

      spinner.succeed(successMessage, {
        raw: {
          count,
          datasetOrders: results,
        },
      });
      spinner.info('Trade in the browser at https://market.iex.ec');
    } catch (error) {
      handleError(error, cli, opts);
    }
  });

const orderbookWorkerpool = cli.command('workerpool [address]');
addGlobalOptions(orderbookWorkerpool);
orderbookWorkerpool
  .option(...option.chain())
  .option(...option.category())
  .option(...option.tag())
  .option(...option.requiredTag())
  .option(...option.maxTag())
  .option(...option.minVolume())
  .option(...option.minTrust())
  .option(...option.includeAppSpecific())
  .option(...option.includeDatasetSpecific())
  .option(...option.includeRequesterSpecific())
  .option(...option.isDatasetStrict())
  .option(...option.isAppStrict())
  .option(...option.isRequesterStrict())
  .description(desc.showObj('workerpools orderbook', 'marketplace'))
  .action(async (workerpool, opts) => {
    await checkUpdate(opts);
    const spinner = Spinner(opts);
    try {
      const chain = await loadChain(opts.chain, {
        spinner,
      });
      const {
        tag,
        maxTag,
        requireTag,
        app,
        dataset,
        requester,
        category,
        minVolume,
        minTrust,
        raw,
        isAppStrict,
        isRequesterStrict,
        isDatasetStrict,
      } = opts;

      const request = fetchWorkerpoolOrderbook(
        chain.contracts,
        getPropertyFormChain(chain, 'iexecGateway'),
        {
          category,
          workerpool,
          minTag: tag !== undefined ? tag : requireTag,
          maxTag: tag !== undefined ? tag : maxTag,
          minVolume,
          minTrust,
          app,
          dataset,
          requester,
          isAppStrict,
          isRequesterStrict,
          isDatasetStrict,
        },
      );
      const fetchMessage = info.showing(objName);
      const processResponse = (res) =>
        res.orders
          ? res.orders.map((e) => ({
              orderHash: e.orderHash,
              price: e.order.workerpoolprice,
              remaining: e.remaining,
              category: e.order.category,
              tag: e.order.tag,
              trust: e.order.trust,
              workerpool: e.order.workerpool,
              apprestrict: e.order.apprestrict,
              datasetrestrict: e.order.datasetrestrict,
              requesterrestrict: e.order.requesterrestrict,
            }))
          : [];
      const createResultsMessage = (
        callResults,
        initialResultsCount,
        totalCount,
      ) =>
        `Workerpoolorders details (${initialResultsCount + 1} to ${
          initialResultsCount + callResults.length
        }${totalCount ? ` of ${totalCount}` : ''}):${pretty(
          callResults.map((e) => ({
            orderHash: e.orderHash,
            price: e.price,
            remaining: e.remaining,
            category: e.category,
            ...((!workerpool || workerpool === NULL_BYTES32) && {
              workerpool: e.workerpool,
            }),
            ...(e.tag !== NULL_BYTES32 && { tag: e.tag }),
            ...(e.trust > 1 && { trust: e.trust }),
            ...(e.apprestrict !== NULL_ADDRESS && {
              apprestrict: e.apprestrict,
            }),
            ...(e.datasetrestrict !== NULL_ADDRESS && {
              datasetrestrict: e.datasetrestrict,
            }),
            ...(e.requesterrestrict !== NULL_ADDRESS && {
              requesterrestrict: e.requesterrestrict,
            }),
          })),
        )}`;

      const { results, count } = await displayPaginableRequest({
        request,
        processResponse,
        fetchMessage,
        createResultsMessage,
        spinner,
        raw,
      });

      const successMessage =
        results.length > 0 ? 'No more results' : 'Empty orderbook';

      spinner.succeed(successMessage, {
        raw: {
          count,
          workerpoolOrders: results,
        },
      });
      spinner.info('Trade in the browser at https://market.iex.ec');
    } catch (error) {
      handleError(error, cli, opts);
    }
  });

const orderbookRequester = cli.command('requester [address]');
addGlobalOptions(orderbookRequester);
orderbookRequester
  .option(...option.chain())
  .option(...option.category())
  .option(...option.tag())
  .option(...option.requiredTag())
  .option(...option.maxTag())
  .option(...option.minVolume())
  .option(...option.maxTrust())
  .option(...option.filterAppSpecific())
  .option(...option.filterDatasetSpecific())
  .option(...option.filterBeneficiarySpecific())
  .option(...option.includeWorkerpoolSpecific())
  .option(...option.isDatasetStrict())
  .option(...option.isAppStrict())
  .option(...option.isWorkerpoolStrict())
  .description(desc.showObj('requesters orderbook', 'marketplace'))
  .action(async (address, opts) => {
    await checkUpdate(opts);
    const spinner = Spinner(opts);
    try {
      const chain = await loadChain(opts.chain, {
        spinner,
      });
      const {
        tag,
        requireTag,
        maxTag,
        app,
        dataset,
        workerpool,
        beneficiary,
        category,
        maxTrust,
        minVolume,
        raw,
        isAppStrict,
        isWorkerpoolStrict,
        isDatasetStrict,
      } = opts;

      const request = fetchRequestOrderbook(
        chain.contracts,
        getPropertyFormChain(chain, 'iexecGateway'),
        {
          category,
          requester: address,
          minTag: tag !== undefined ? tag : requireTag,
          maxTag: tag !== undefined ? tag : maxTag,
          minVolume,
          maxTrust,
          app,
          dataset,
          workerpool,
          beneficiary,
          isAppStrict,
          isWorkerpoolStrict,
          isDatasetStrict,
        },
      );
      const fetchMessage = info.showing(objName);
      const processResponse = (res) =>
        res.orders
          ? res.orders.map((e) => ({
              orderHash: e.orderHash,
              app: e.order.app,
              dataset: e.order.dataset,
              workerpool: e.order.workerpool,
              requester: e.order.requester,
              beneficiary: e.order.beneficiary,
              category: e.order.category,
              tag: e.order.tag,
              trust: e.order.trust,
              price: e.order.workerpoolmaxprice,
              remaining: e.remaining,
            }))
          : [];
      const createResultsMessage = (
        callResults,
        initialResultsCount,
        totalCount,
      ) =>
        `Requestorders details (${initialResultsCount + 1} to ${
          initialResultsCount + callResults.length
        }${totalCount ? ` of ${totalCount}` : ''}):${pretty(
          callResults.map((e) => ({
            orderHash: e.orderHash,
            price: e.price,
            remaining: e.remaining,
            category: e.category,
            app: e.app,
            ...(e.dataset !== NULL_ADDRESS && {
              dataset: e.dataset,
            }),
            ...(e.tag !== NULL_BYTES32 && { tag: e.tag }),
            ...(e.trust > 1 && { trust: e.trust }),
            ...(e.workerpool !== NULL_ADDRESS && {
              workerpool: e.workerpool,
            }),
          })),
        )}`;

      const { results, count } = await displayPaginableRequest({
        request,
        processResponse,
        fetchMessage,
        createResultsMessage,
        spinner,
        raw,
      });

      const successMessage =
        results.length > 0 ? 'No more results' : 'Empty orderbook';

      spinner.succeed(successMessage, {
        raw: {
          count,
          requestOrders: results,
        },
      });
      spinner.info('Trade in the browser at https://market.iex.ec');
    } catch (error) {
      handleError(error, cli, opts);
    }
  });

finalizeCli(cli);
