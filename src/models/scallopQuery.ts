import { SuiKit } from '@scallop-io/sui-kit';
import { ScallopAddress } from './scallopAddress';
import { ScallopUtils } from './scallopUtils';
import { ADDRESSES_ID, SUPPORT_SPOOLS } from '../constants';
import {
  queryMarket,
  getObligations,
  queryObligation,
  getStakeAccounts,
  getStakePool,
  getRewardPool,
  getPythPrice,
  getMarketPools,
  getMarketPool,
  getMarketCollaterals,
  getMarketCollateral,
  getSpools,
  getSpool,
  getCoinAmounts,
  getCoinAmount,
  getMarketCoinAmounts,
  getMarketCoinAmount,
  getLendings,
  getLending,
  getObligationAccounts,
  getObligationAccount,
} from '../queries';
import {
  ScallopQueryParams,
  ScallopInstanceParams,
  SupportStakeMarketCoins,
  SupportCoins,
  SupportPoolCoins,
  SupportCollateralCoins,
  SupportMarketCoins,
  StakePools,
  RewardPools,
} from '../types';

/**
 * @description
 * it provides methods for getting on-chain data from the Scallop contract.
 *
 * @example
 * ```typescript
 * const scallopQuery  = new ScallopQuery(<parameters>);
 * await scallopQuery.init();
 * scallopQuery.<query functions>();
 * await scallopQuery.<query functions>();
 * ```
 */
export class ScallopQuery {
  public readonly params: ScallopQueryParams;

  public suiKit: SuiKit;
  public address: ScallopAddress;
  public utils: ScallopUtils;

  public constructor(
    params: ScallopQueryParams,
    instance?: ScallopInstanceParams
  ) {
    this.params = params;
    this.suiKit = instance?.suiKit ?? new SuiKit(params);
    this.address =
      instance?.address ??
      new ScallopAddress({
        id: params?.addressesId || ADDRESSES_ID,
        network: params?.networkType,
      });
    this.utils =
      instance?.utils ??
      new ScallopUtils(this.params, {
        suiKit: this.suiKit,
        address: this.address,
        query: this,
      });
  }

  /**
   * Request the scallop API to initialize data.
   *
   * @param forece - Whether to force initialization.
   */
  public async init(forece: boolean = false) {
    if (forece || !this.address.getAddresses()) {
      await this.address.read();
    }
    await this.utils.init(forece);
  }

  /* ==================== Core Query Methods ==================== */

  /**
   * Query market data.
   *
   * @return Market data.
   */
  public async queryMarket() {
    return await queryMarket(this);
  }

  /**
   * Get market pools.
   *
   * @description
   * To obtain all market pools at once, it is recommended to use
   * the `queryMarket` method to reduce time consumption.
   *
   * @param coinNames - Specific an array of support coin name.
   * @return Market pools data.
   */
  public async getMarketPools(coinNames?: SupportPoolCoins[]) {
    return await getMarketPools(this, coinNames);
  }

  /**
   * Get  market pool
   *
   * @param coinName - Specific support coin name.
   * @return Market pool data.
   */
  public async getMarketPool(coinName: SupportPoolCoins) {
    return await getMarketPool(this, coinName);
  }

  /**
   * Get market collaterals.
   *
   * @description
   * To obtain all market collaterals at once, it is recommended to use
   * the `queryMarket` method to reduce time consumption.
   *
   * @param coinNames - Specific an array of support coin name.
   * @return Market collaterals data.
   */
  public async getMarketCollaterals(coinNames?: SupportCollateralCoins[]) {
    return await getMarketCollaterals(this, coinNames);
  }

  /**
   * Get market collateral
   *
   * @param coinName - Specific support coin name.
   * @return Market collateral data.
   */
  public async getMarketCollateral(coinName: SupportCollateralCoins) {
    return await getMarketCollateral(this, coinName);
  }

  /**
   * Get obligations data.
   *
   * @param ownerAddress - The owner address.
   * @return Obligations data.
   */
  public async getObligations(ownerAddress?: string) {
    return await getObligations(this, ownerAddress);
  }

  /**
   * Query obligation data.
   *
   * @param obligationId - The obligation id.
   * @return Obligation data.
   */
  public async queryObligation(obligationId: string) {
    return queryObligation(this, obligationId);
  }

  /**
   * Get all coin amounts.
   *
   * @param coinNames - Specific an array of support coin name.
   * @param ownerAddress - The owner address.
   * @return All coin amounts.
   */
  public async getCoinAmounts(
    coinNames?: SupportPoolCoins[],
    ownerAddress?: string
  ) {
    return await getCoinAmounts(this, coinNames, ownerAddress);
  }

  /**
   * Get coin amount.
   *
   * @param coinNames - Specific support coin name.
   * @param ownerAddress - The owner address.
   * @return Coin amount.
   */
  public async getCoinAmount(
    coinName: SupportPoolCoins,
    ownerAddress?: string
  ) {
    return await getCoinAmount(this, coinName, ownerAddress);
  }

  /**
   * Get all market coin amounts.
   *
   * @param coinNames - Specific an array of support market coin name.
   * @param ownerAddress - The owner address.
   * @return All market market coin amounts.
   */
  public async getMarketCoinAmounts(
    marketCoinNames?: SupportMarketCoins[],
    ownerAddress?: string
  ) {
    return await getMarketCoinAmounts(this, marketCoinNames, ownerAddress);
  }

  /**
   * Get market coin amount.
   *
   * @param coinNames - Specific support market coin name.
   * @param ownerAddress - The owner address.
   * @return Market market coin amount.
   */
  public async getMarketCoinAmount(
    marketCoinName: SupportMarketCoins,
    ownerAddress?: string
  ) {
    return await getMarketCoinAmount(this, marketCoinName, ownerAddress);
  }

  /**
   * Get price from pyth fee object.
   *
   * @param coinName - Specific support coin name.
   * @return Coin price.
   */
  public async getPriceFromPyth(coinName: SupportCoins) {
    return await getPythPrice(this, coinName);
  }

  /* ==================== Spool Query Methods ==================== */

  /**
   * Get spools data.
   *
   * @param marketCoinNames - Specific an array of support stake market coin name.
   * @return Spools data.
   */
  public async getSpools(marketCoinNames?: SupportStakeMarketCoins[]) {
    return await getSpools(this, marketCoinNames);
  }

  /**
   * Get spool data.
   *
   * @param marketCoinName - Specific support stake market coin name.
   * @return Spool data.
   */
  public async getSpool(marketCoinName: SupportStakeMarketCoins) {
    return await getSpool(this, marketCoinName);
  }

  /**
   * Get stake accounts data for all stake pools (spools).
   *
   * @param ownerAddress - The owner address.
   * @return All Stake accounts data.
   */
  public async getAllStakeAccounts(ownerAddress?: string) {
    return await getStakeAccounts(this, ownerAddress);
  }

  /**
   * Get stake accounts data for specific stake pool (spool).
   *
   * @param marketCoinName - Support stake market coin.
   * @param ownerAddress - The owner address.
   * @return Stake accounts data.
   */
  public async getStakeAccounts(
    marketCoinName: SupportStakeMarketCoins,
    ownerAddress?: string
  ) {
    const allStakeAccount = await this.getAllStakeAccounts(ownerAddress);
    return allStakeAccount[marketCoinName] ?? [];
  }

  /**
   * Get stake pools (spools) data.
   *
   * @description
   * For backward compatible, it is recommended to use `getSpools` method
   * to get all spools data.
   *
   * @param marketCoinNames - Specific an array of market coin name.
   * @return Stake pools data.
   */
  public async getStakePools(marketCoinNames?: SupportStakeMarketCoins[]) {
    marketCoinNames = marketCoinNames ?? [...SUPPORT_SPOOLS];
    const stakePools: StakePools = {};
    for (const marketCoinName of marketCoinNames) {
      const stakePool = await getStakePool(this, marketCoinName);

      if (stakePool) {
        stakePools[marketCoinName] = stakePool;
      }
    }

    return stakePools;
  }

  /**
   * Get stake pool (spool) data.
   *
   * @description
   * For backward compatible, it is recommended to use `getSpool` method
   * to get all spool data.
   *
   * @param marketCoinName - The market coin name.
   * @return Stake pool data.
   */
  public async getStakePool(marketCoinName: SupportStakeMarketCoins) {
    return await getStakePool(this, marketCoinName);
  }

  /**
   * Get reward pools data.
   *
   * @description
   * For backward compatible, it is recommended to use `getSpools` method
   * to get all spools data.
   *
   * @param marketCoinNames - Specific an array of market coin name.
   * @return Reward pools data.
   */
  public async getRewardPools(marketCoinNames?: SupportStakeMarketCoins[]) {
    marketCoinNames = marketCoinNames ?? [...SUPPORT_SPOOLS];
    const rewardPools: RewardPools = {};
    for (const marketCoinName of marketCoinNames) {
      const rewardPool = await getRewardPool(this, marketCoinName);

      if (rewardPool) {
        rewardPools[marketCoinName] = rewardPool;
      }
    }

    return rewardPools;
  }

  /**
   * Get reward pool data.
   *
   * @description
   * For backward compatible, it is recommended to use `getSpool` method
   * to get spool data.
   *
   * @param marketCoinName - The market coin name.
   * @return Reward pool data.
   */
  public async getRewardPool(marketCoinName: SupportStakeMarketCoins) {
    return await getRewardPool(this, marketCoinName);
  }

  /**
   * Get user lending and spool infomation for specific pools.
   *
   * @param coinNames - Specific an array of support coin name.
   * @param ownerAddress - The owner address.
   * @return All lending and spool infomation.
   */
  public async getLendings(
    coinNames?: SupportPoolCoins[],
    ownerAddress?: string
  ) {
    return await getLendings(this, coinNames, ownerAddress);
  }

  /**
   * Get user lending and spool information for specific pool.
   *
   * @param coinName - Specific support coin name.
   * @param ownerAddress - The owner address.
   * @return Lending pool data.
   */
  public async getLending(coinName: SupportPoolCoins, ownerAddress?: string) {
    return await getLending(this, coinName, ownerAddress);
  }

  /**
   * Get user all obligation accounts information.
   *
   * @description
   * All collateral and borrowing information in all obligation accounts owned by the user.
   *
   * @param coinNames - Specific an array of support coin name.
   * @param ownerAddress - The owner address.
   * @return All obligation accounts information.
   */
  public async getObligationAccounts(ownerAddress?: string) {
    return await getObligationAccounts(this, ownerAddress);
  }

  /**
   * Get obligation account information for specific id.
   *
   * @description
   * borrowing and obligation information for specific pool.
   *
   * @param coinName - Specific support coin name.
   * @param ownerAddress - The owner address.
   * @param obligationId - The obligation id.
   * @return Borrowing and collateral information.
   */
  public async getObligationAccount(obligationId: string) {
    return await getObligationAccount(this, obligationId);
  }
}
