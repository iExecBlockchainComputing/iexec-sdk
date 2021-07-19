#!/usr/bin/env node

const cli = require('commander');
const orderbook = require('../../common/modules/orderbook');
const { NULL_BYTES32, NULL_ADDRESS } = require('../../common/utils/utils');
const {
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
} = require('../utils/cli-helper');
const { loadChain } = require('../utils/chains');

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
      } = opts;

      const request = orderbook.fetchAppOrderbook(
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
        initilResultsCount,
        totalCount,
      ) =>
        `Apporders details (${initilResultsCount + 1} to ${
          initilResultsCount + callResults.length
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
      } = opts;

      const request = orderbook.fetchDatasetOrderbook(
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
        initilResultsCount,
        totalCount,
      ) =>
        `Datasetorders details (${initilResultsCount + 1} to ${
          initilResultsCount + callResults.length
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
      } = opts;

      const request = orderbook.fetchWorkerpoolOrderbook(
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
        initilResultsCount,
        totalCount,
      ) =>
        `Workerpoolorders details (${initilResultsCount + 1} to ${
          initilResultsCount + callResults.length
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
      } = opts;

      const request = orderbook.fetchRequestOrderbook(
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
        initilResultsCount,
        totalCount,
      ) =>
        `Requestorders details (${initilResultsCount + 1} to ${
          initilResultsCount + callResults.length
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
