import BigNumber from 'bignumber.js';
import { normalizeStructTag } from '@mysten/sui.js/utils';
import type { ScallopUtils } from '../models';
import type {
  OriginMarketPoolData,
  ParsedMarketPoolData,
  CalculatedMarketPoolData,
  OriginMarketCollateralData,
  ParsedMarketCollateralData,
  CalculatedMarketCollateralData,
  OriginSpoolData,
  ParsedSpoolData,
  CalculatedSpoolData,
  OriginSpoolRewardPoolData,
  ParsedSpoolRewardPoolData,
  CalculatedSpoolRewardPoolData,
  OriginBorrowIncentivePoolData,
  ParsedBorrowIncentivePoolData,
  CalculatedBorrowIncentivePoolData,
  OriginBorrowIncentiveRewardPoolData,
  ParsedBorrowIncentiveRewardPoolData,
  CalculatedBorrowIncentiveRewardPoolData,
  OriginBorrowIncentiveAccountData,
  ParsedBorrowIncentiveAccountData,
  SupportPoolCoins,
  SupportCollateralCoins,
} from '../types';

/**
 *  Parse origin market pool data to a more readable format.
 *
 * @param originMarketPoolData - Origin market pool data
 * @return Parsed market pool data
 */
export const parseOriginMarketPoolData = (
  originMarketPoolData: OriginMarketPoolData
): ParsedMarketPoolData => {
  return {
    coinType: normalizeStructTag(originMarketPoolData.type.name),
    // Parse origin data required for basic calculations.
    maxBorrowRate: Number(originMarketPoolData.maxBorrowRate.value) / 2 ** 32,
    borrowRate: Number(originMarketPoolData.interestRate.value) / 2 ** 32,
    borrowRateScale: Number(originMarketPoolData.interestRateScale),
    borrowIndex: Number(originMarketPoolData.borrowIndex),
    lastUpdated: Number(originMarketPoolData.lastUpdated),
    cashAmount: Number(originMarketPoolData.cash),
    debtAmount: Number(originMarketPoolData.debt),
    marketCoinSupplyAmount: Number(originMarketPoolData.marketCoinSupply),
    reserveAmount: Number(originMarketPoolData.reserve),
    reserveFactor: Number(originMarketPoolData.reserveFactor.value) / 2 ** 32,
    borrowWeight: Number(originMarketPoolData.borrowWeight.value) / 2 ** 32,
    borrowFee: Number(originMarketPoolData.borrowFeeRate.value) / 2 ** 32,
    // Parse origin data required for additional display.
    baseBorrowRate:
      Number(originMarketPoolData.baseBorrowRatePerSec.value) / 2 ** 32,
    borrowRateOnHighKink:
      Number(originMarketPoolData.borrowRateOnHighKink.value) / 2 ** 32,
    borrowRateOnMidKink:
      Number(originMarketPoolData.borrowRateOnMidKink.value) / 2 ** 32,
    highKink: Number(originMarketPoolData.highKink.value) / 2 ** 32,
    midKink: Number(originMarketPoolData.midKink.value) / 2 ** 32,
    minBorrowAmount: Number(originMarketPoolData.minBorrowAmount),
  };
};

export const calculateMarketPoolData = (
  utils: ScallopUtils,
  parsedMarketPoolData: ParsedMarketPoolData
): CalculatedMarketPoolData => {
  const poolCoinName = utils.parseCoinNameFromType<SupportPoolCoins>(
    parsedMarketPoolData.coinType
  );
  const coinDecimal = utils.getCoinDecimal(poolCoinName);

  const borrowYearFactor = 24 * 365 * 3600;

  const baseBorrowApr =
    (parsedMarketPoolData.baseBorrowRate * borrowYearFactor) /
    parsedMarketPoolData.borrowRateScale;
  const borrowAprOnHighKink =
    (parsedMarketPoolData.borrowRateOnHighKink * borrowYearFactor) /
    parsedMarketPoolData.borrowRateScale;
  const borrowAprOnMidKink =
    (parsedMarketPoolData.borrowRateOnMidKink * borrowYearFactor) /
    parsedMarketPoolData.borrowRateScale;
  const maxBorrowApr =
    (parsedMarketPoolData.maxBorrowRate * borrowYearFactor) /
    parsedMarketPoolData.borrowRateScale;
  const borrowApr =
    (parsedMarketPoolData.borrowRate * borrowYearFactor) /
    parsedMarketPoolData.borrowRateScale;

  const timeDelta =
    Math.floor(new Date().getTime() / 1000) - parsedMarketPoolData.lastUpdated;
  const borrowIndexDelta = BigNumber(parsedMarketPoolData.borrowIndex)
    .multipliedBy(
      BigNumber(timeDelta).multipliedBy(parsedMarketPoolData.borrowRate)
    )
    .dividedBy(parsedMarketPoolData.borrowRateScale);
  const currentBorrowIndex = BigNumber(parsedMarketPoolData.borrowIndex).plus(
    borrowIndexDelta
  );
  // How much accumulated interest since `lastUpdate`.
  const growthInterest = BigNumber(currentBorrowIndex)
    .dividedBy(parsedMarketPoolData.borrowIndex)
    .minus(1);
  const increasedDebtAmount = BigNumber(
    parsedMarketPoolData.debtAmount
  ).multipliedBy(growthInterest);
  const borrowAmount = increasedDebtAmount.plus(
    parsedMarketPoolData.debtAmount
  );
  const borrowCoin = borrowAmount.shiftedBy(-1 * coinDecimal);
  const reserveAmount = BigNumber(parsedMarketPoolData.reserveAmount).plus(
    increasedDebtAmount.multipliedBy(parsedMarketPoolData.reserveFactor)
  );
  const reserveCoin = reserveAmount.shiftedBy(-1 * coinDecimal);
  const supplyAmount = BigNumber(borrowAmount).plus(
    Math.max(parsedMarketPoolData.cashAmount - reserveAmount.toNumber(), 0)
  );
  const supplyCoin = supplyAmount.shiftedBy(-1 * coinDecimal);
  let utilizationRate = BigNumber(borrowAmount).dividedBy(supplyAmount);
  utilizationRate = utilizationRate.isFinite() ? utilizationRate : BigNumber(0);
  let supplyApr = BigNumber(borrowApr)
    .multipliedBy(utilizationRate)
    .multipliedBy(1 - parsedMarketPoolData.reserveFactor);
  supplyApr = supplyApr.isFinite() ? supplyApr : BigNumber(0);
  let conversionRate = supplyAmount.dividedBy(
    parsedMarketPoolData.marketCoinSupplyAmount
  );
  conversionRate =
    conversionRate.isFinite() && !conversionRate.isNaN()
      ? conversionRate
      : BigNumber(1);

  return {
    baseBorrowApr,
    baseBorrowApy: utils.parseAprToApy(baseBorrowApr),
    borrowAprOnHighKink,
    borrowApyOnHighKink: utils.parseAprToApy(borrowAprOnHighKink),
    borrowAprOnMidKink,
    borrowApyOnMidKink: utils.parseAprToApy(borrowAprOnMidKink),
    maxBorrowApr,
    maxBorrowApy: utils.parseAprToApy(maxBorrowApr),
    borrowApr: Math.min(borrowApr, maxBorrowApr),
    borrowApy: Math.min(
      utils.parseAprToApy(borrowApr),
      utils.parseAprToApy(maxBorrowApr)
    ),
    borrowIndex: currentBorrowIndex.toNumber(),
    growthInterest: growthInterest.toNumber(),
    supplyAmount: supplyAmount.toNumber(),
    supplyCoin: supplyCoin.toNumber(),
    borrowAmount: borrowAmount.toNumber(),
    borrowCoin: borrowCoin.toNumber(),
    reserveAmount: reserveAmount.toNumber(),
    reserveCoin: reserveCoin.toNumber(),
    utilizationRate: utilizationRate.toNumber(),
    supplyApr: supplyApr.toNumber(),
    supplyApy: utils.parseAprToApy(supplyApr.toNumber()),
    conversionRate: conversionRate.toNumber(),
  };
};

/**
 *  Parse origin market collateral data to a more readable format.
 *
 * @param originMarketCollateralData - Origin market collateral data
 * @return Parsed market collateral data
 */
export const parseOriginMarketCollateralData = (
  originMarketCollateralData: OriginMarketCollateralData
): ParsedMarketCollateralData => {
  return {
    coinType: normalizeStructTag(originMarketCollateralData.type.name),
    collateralFactor:
      Number(originMarketCollateralData.collateralFactor.value) / 2 ** 32,
    liquidationFactor:
      Number(originMarketCollateralData.liquidationFactor.value) / 2 ** 32,
    liquidationDiscount:
      Number(originMarketCollateralData.liquidationDiscount.value) / 2 ** 32,
    liquidationPanelty:
      Number(originMarketCollateralData.liquidationPanelty.value) / 2 ** 32,
    liquidationReserveFactor:
      Number(originMarketCollateralData.liquidationReserveFactor.value) /
      2 ** 32,
    maxCollateralAmount: Number(originMarketCollateralData.maxCollateralAmount),
    totalCollateralAmount: Number(
      originMarketCollateralData.totalCollateralAmount
    ),
  };
};

export const calculateMarketCollateralData = (
  utils: ScallopUtils,
  parsedMarketCollateralData: ParsedMarketCollateralData
): CalculatedMarketCollateralData => {
  const collateralCoinName =
    utils.parseCoinNameFromType<SupportCollateralCoins>(
      parsedMarketCollateralData.coinType
    );
  const coinDecimal = utils.getCoinDecimal(collateralCoinName);

  const maxCollateralCoin = BigNumber(
    parsedMarketCollateralData.maxCollateralAmount
  ).shiftedBy(-1 * coinDecimal);
  const depositCoin = BigNumber(
    parsedMarketCollateralData.totalCollateralAmount
  ).shiftedBy(-1 * coinDecimal);

  return {
    maxDepositAmount: parsedMarketCollateralData.maxCollateralAmount,
    maxDepositCoin: maxCollateralCoin.toNumber(),
    depositAmount: parsedMarketCollateralData.totalCollateralAmount,
    depositCoin: depositCoin.toNumber(),
  };
};

/**
 *  Parse origin spool data to a more readable format.
 *
 * @param originSpoolData - Origin spool data
 * @return Parsed spool data
 */
export const parseOriginSpoolData = (
  originSpoolData: OriginSpoolData
): ParsedSpoolData => {
  return {
    stakeType: normalizeStructTag(originSpoolData.stakeType.fields.name),
    maxPoint: Number(originSpoolData.maxDistributedPoint),
    distributedPoint: Number(originSpoolData.distributedPoint),
    pointPerPeriod: Number(originSpoolData.distributedPointPerPeriod),
    period: Number(originSpoolData.pointDistributionTime),
    maxStake: Number(originSpoolData.maxStake),
    staked: Number(originSpoolData.stakes),
    index: Number(originSpoolData.index),
    createdAt: Number(originSpoolData.createdAt),
    lastUpdate: Number(originSpoolData.lastUpdate),
  };
};

export const calculateSpoolData = (
  parsedSpoolData: ParsedSpoolData,
  stakeMarketCoinPrice: number,
  stakeMarketCoinDecimal: number
): CalculatedSpoolData => {
  const baseIndexRate = 1_000_000_000;

  const distributedPointPerSec = BigNumber(
    parsedSpoolData.pointPerPeriod
  ).dividedBy(parsedSpoolData.period);

  const pointPerSec = BigNumber(parsedSpoolData.pointPerPeriod).dividedBy(
    parsedSpoolData.period
  );
  const remainingPeriod = BigNumber(parsedSpoolData.maxPoint)
    .minus(parsedSpoolData.distributedPoint)
    .dividedBy(pointPerSec);
  const startDate = parsedSpoolData.createdAt;
  const endDate = remainingPeriod
    .plus(parsedSpoolData.lastUpdate)
    .integerValue()
    .toNumber();

  const timeDelta = BigNumber(
    Math.floor(new Date().getTime() / 1000) - parsedSpoolData.lastUpdate
  )
    .dividedBy(parsedSpoolData.period)
    .toFixed(0);
  const remainingPoints = BigNumber(parsedSpoolData.maxPoint).minus(
    parsedSpoolData.distributedPoint
  );
  const accumulatedPoints = BigNumber.minimum(
    BigNumber(timeDelta).multipliedBy(parsedSpoolData.pointPerPeriod),
    remainingPoints
  );

  const currentPointIndex = BigNumber(parsedSpoolData.index).plus(
    accumulatedPoints.dividedBy(parsedSpoolData.staked).isFinite()
      ? BigNumber(baseIndexRate)
          .multipliedBy(accumulatedPoints)
          .dividedBy(parsedSpoolData.staked)
      : 0
  );
  const currentTotalDistributedPoint = BigNumber(
    parsedSpoolData.distributedPoint
  ).plus(accumulatedPoints);

  const stakedAmount = BigNumber(parsedSpoolData.staked);
  const stakedCoin = stakedAmount.shiftedBy(-1 * stakeMarketCoinDecimal);
  const stakedValue = stakedCoin.multipliedBy(stakeMarketCoinPrice);

  return {
    distributedPointPerSec: distributedPointPerSec.toNumber(),
    accumulatedPoints: accumulatedPoints.toNumber(),
    currentPointIndex: currentPointIndex.toNumber(),
    currentTotalDistributedPoint: currentTotalDistributedPoint.toNumber(),
    startDate: new Date(startDate * 1000),
    endDate: new Date(endDate * 1000),
    stakedAmount: stakedAmount.toNumber(),
    stakedCoin: stakedCoin.toNumber(),
    stakedValue: stakedValue.toNumber(),
  };
};

/**
 *  Parse origin spool reward pool data to a more readable format.
 *
 * @param originRewardPoolData - Origin reward pool data
 * @return Parsed spool reward pool data
 */
export const parseOriginSpoolRewardPoolData = (
  originSpoolRewardPoolData: OriginSpoolRewardPoolData
): ParsedSpoolRewardPoolData => {
  return {
    claimedRewards: Number(originSpoolRewardPoolData.claimed_rewards),
    exchangeRateDenominator: Number(
      originSpoolRewardPoolData.exchange_rate_denominator
    ),
    exchangeRateNumerator: Number(
      originSpoolRewardPoolData.exchange_rate_numerator
    ),
    feeRateDenominator: Number(originSpoolRewardPoolData.fee_rate_denominator),
    feeRateNumerator: Number(originSpoolRewardPoolData.fee_rate_numerator),
    rewards: Number(originSpoolRewardPoolData.rewards),
    spoolId: String(originSpoolRewardPoolData.spool_id),
  };
};

export const calculateSpoolRewardPoolData = (
  parsedSpoolData: ParsedSpoolData,
  parsedSpoolRewardPoolData: ParsedSpoolRewardPoolData,
  calculatedSpoolData: CalculatedSpoolData,
  rewardCoinPrice: number,
  rewardCoinDecimal: number
): CalculatedSpoolRewardPoolData => {
  const rateYearFactor = 365 * 24 * 60 * 60;

  const rewardPerSec = BigNumber(calculatedSpoolData.distributedPointPerSec)
    .multipliedBy(parsedSpoolRewardPoolData.exchangeRateNumerator)
    .dividedBy(parsedSpoolRewardPoolData.exchangeRateDenominator);
  const totalRewardAmount = BigNumber(parsedSpoolData.maxPoint)
    .multipliedBy(parsedSpoolRewardPoolData.exchangeRateNumerator)
    .dividedBy(parsedSpoolRewardPoolData.exchangeRateDenominator);
  const totalRewardCoin = totalRewardAmount.shiftedBy(-1 * rewardCoinDecimal);
  const totalRewardValue = totalRewardCoin.multipliedBy(rewardCoinPrice);
  const remaindRewardAmount = BigNumber(parsedSpoolRewardPoolData.rewards);
  const remaindRewardCoin = remaindRewardAmount.shiftedBy(
    -1 * rewardCoinDecimal
  );
  const remaindRewardValue = remaindRewardCoin.multipliedBy(rewardCoinPrice);
  const claimedRewardAmount = BigNumber(
    parsedSpoolRewardPoolData.claimedRewards
  );
  const claimedRewardCoin = claimedRewardAmount.shiftedBy(
    -1 * rewardCoinDecimal
  );
  const claimedRewardValue = claimedRewardCoin.multipliedBy(rewardCoinPrice);

  const rewardValueForYear = BigNumber(rewardPerSec)
    .shiftedBy(-1 * rewardCoinDecimal)
    .multipliedBy(rateYearFactor)
    .multipliedBy(rewardCoinPrice);
  const rewardRate = rewardValueForYear
    .dividedBy(calculatedSpoolData.stakedValue)
    .isFinite()
    ? rewardValueForYear.dividedBy(calculatedSpoolData.stakedValue).toNumber()
    : Infinity;
  const rewardFeeRate = BigNumber(parsedSpoolRewardPoolData.feeRateNumerator)
    .dividedBy(parsedSpoolRewardPoolData.feeRateDenominator)
    .toNumber();

  return {
    rewardApr: rewardRate,
    totalRewardAmount: totalRewardAmount.toNumber(),
    totalRewardCoin: totalRewardCoin.toNumber(),
    totalRewardValue: totalRewardValue.toNumber(),
    remaindRewardAmount: remaindRewardAmount.toNumber(),
    remaindRewardCoin: remaindRewardCoin.toNumber(),
    remaindRewardValue: remaindRewardValue.toNumber(),
    claimedRewardAmount: claimedRewardAmount.toNumber(),
    claimedRewardCoin: claimedRewardCoin.toNumber(),
    claimedRewardValue: claimedRewardValue.toNumber(),
    rewardPerSec: rewardPerSec.toNumber(),
    rewardFee: rewardFeeRate,
  };
};

/**
 *  Parse origin borrow incentive pool data to a more readable format.
 *
 * @param originBorrowIncentivePoolData - Origin borrow incentive pool data
 * @return Parsed borrow incentive pool data
 */
export const parseOriginBorrowIncentivePoolData = (
  originBorrowIncentivePoolData: OriginBorrowIncentivePoolData
): ParsedBorrowIncentivePoolData => {
  return {
    poolType: normalizeStructTag(originBorrowIncentivePoolData.pool_type.name),
    maxPoint: Number(originBorrowIncentivePoolData.max_distributed_point),
    distributedPoint: Number(originBorrowIncentivePoolData.distributed_point),
    pointPerPeriod: Number(
      originBorrowIncentivePoolData.distributed_point_per_period
    ),
    period: Number(originBorrowIncentivePoolData.point_distribution_time),
    maxStake: Number(originBorrowIncentivePoolData.max_stakes),
    staked: Number(originBorrowIncentivePoolData.stakes),
    index: Number(originBorrowIncentivePoolData.index),
    createdAt: Number(originBorrowIncentivePoolData.created_at),
    lastUpdate: Number(originBorrowIncentivePoolData.last_update),
  };
};

export const calculateBorrowIncentivePoolData = (
  parsedBorrowIncentivePoolData: ParsedBorrowIncentivePoolData,
  borrowIncentiveCoinPrice: number,
  borrowIncentiveCoinDecimal: number
): CalculatedBorrowIncentivePoolData => {
  const baseIndexRate = 1_000_000_000;

  const distributedPointPerSec = BigNumber(
    parsedBorrowIncentivePoolData.pointPerPeriod
  ).dividedBy(parsedBorrowIncentivePoolData.period);

  const pointPerSec = BigNumber(
    parsedBorrowIncentivePoolData.pointPerPeriod
  ).dividedBy(parsedBorrowIncentivePoolData.period);
  const remainingPeriod = BigNumber(parsedBorrowIncentivePoolData.maxPoint)
    .minus(parsedBorrowIncentivePoolData.distributedPoint)
    .dividedBy(pointPerSec);
  const startDate = parsedBorrowIncentivePoolData.createdAt;
  const endDate = remainingPeriod
    .plus(parsedBorrowIncentivePoolData.lastUpdate)
    .integerValue()
    .toNumber();

  const timeDelta = BigNumber(
    Math.floor(new Date().getTime() / 1000) -
      parsedBorrowIncentivePoolData.lastUpdate
  )
    .dividedBy(parsedBorrowIncentivePoolData.period)
    .toFixed(0);
  const remainingPoints = BigNumber(
    parsedBorrowIncentivePoolData.maxPoint
  ).minus(parsedBorrowIncentivePoolData.distributedPoint);
  const accumulatedPoints = BigNumber.minimum(
    BigNumber(timeDelta).multipliedBy(
      parsedBorrowIncentivePoolData.pointPerPeriod
    ),
    remainingPoints
  );

  const currentPointIndex = BigNumber(parsedBorrowIncentivePoolData.index).plus(
    accumulatedPoints.dividedBy(parsedBorrowIncentivePoolData.staked).isFinite()
      ? BigNumber(baseIndexRate)
          .multipliedBy(accumulatedPoints)
          .dividedBy(parsedBorrowIncentivePoolData.staked)
      : 0
  );
  const currentTotalDistributedPoint = BigNumber(
    parsedBorrowIncentivePoolData.distributedPoint
  ).plus(accumulatedPoints);

  const stakedAmount = BigNumber(parsedBorrowIncentivePoolData.staked);
  const stakedCoin = stakedAmount.shiftedBy(-1 * borrowIncentiveCoinDecimal);
  const stakedValue = stakedCoin.multipliedBy(borrowIncentiveCoinPrice);

  return {
    distributedPointPerSec: distributedPointPerSec.toNumber(),
    accumulatedPoints: accumulatedPoints.toNumber(),
    currentPointIndex: currentPointIndex.toNumber(),
    currentTotalDistributedPoint: currentTotalDistributedPoint.toNumber(),
    startDate: new Date(startDate * 1000),
    endDate: new Date(endDate * 1000),
    stakedAmount: stakedAmount.toNumber(),
    stakedCoin: stakedCoin.toNumber(),
    stakedValue: stakedValue.toNumber(),
  };
};

/**
 *  Parse origin borrow incentive reward pool data to a more readable format.
 *
 * @param originBorrowIncentiveRewardPoolData - Origin borrow incentive reward pool data
 * @return Parsed borrow incentive reward pool data
 */
export const parseOriginBorrowIncentiveRewardPoolData = (
  originBorrowIncentiveRewardPoolData: OriginBorrowIncentiveRewardPoolData
): ParsedBorrowIncentiveRewardPoolData => {
  return {
    rewardType: normalizeStructTag(
      originBorrowIncentiveRewardPoolData.reward_type.name
    ),
    claimedRewards: Number(originBorrowIncentiveRewardPoolData.claimed_rewards),
    exchangeRateNumerator: Number(
      originBorrowIncentiveRewardPoolData.exchange_rate_numerator
    ),
    exchangeRateDenominator: Number(
      originBorrowIncentiveRewardPoolData.exchange_rate_denominator
    ),
    rewardsFeeRateNumerator: Number(
      originBorrowIncentiveRewardPoolData.rewards_fee_rate_numerator
    ),
    rewardsFeeRateDenominator: Number(
      originBorrowIncentiveRewardPoolData.rewards_fee_rate_denominator
    ),
    remainingRewards: Number(
      originBorrowIncentiveRewardPoolData.remaining_reward
    ),
  };
};

export const calculateBorrowIncentiveRewardPoolData = (
  parsedBorrowIncentivePoolData: ParsedBorrowIncentivePoolData,
  parsedBorrowIncentiveRewardPoolData: ParsedBorrowIncentiveRewardPoolData,
  calculatedBorrowIncentivePoolData: CalculatedBorrowIncentivePoolData,
  rewardCoinPrice: number,
  rewardCoinDecimal: number
): CalculatedBorrowIncentiveRewardPoolData => {
  const rateYearFactor = 365 * 24 * 60 * 60;

  const rewardPerSec = BigNumber(
    calculatedBorrowIncentivePoolData.distributedPointPerSec
  )
    .multipliedBy(parsedBorrowIncentiveRewardPoolData.exchangeRateNumerator)
    .dividedBy(parsedBorrowIncentiveRewardPoolData.exchangeRateDenominator);
  const totalRewardAmount = BigNumber(parsedBorrowIncentivePoolData.maxPoint)
    .multipliedBy(parsedBorrowIncentiveRewardPoolData.exchangeRateNumerator)
    .dividedBy(parsedBorrowIncentiveRewardPoolData.exchangeRateDenominator);
  const totalRewardCoin = totalRewardAmount.shiftedBy(-1 * rewardCoinDecimal);
  const totalRewardValue = totalRewardCoin.multipliedBy(rewardCoinPrice);
  const remaindRewardAmount = BigNumber(
    parsedBorrowIncentiveRewardPoolData.remainingRewards
  );
  const remaindRewardCoin = remaindRewardAmount.shiftedBy(
    -1 * rewardCoinDecimal
  );
  const remaindRewardValue = remaindRewardCoin.multipliedBy(rewardCoinPrice);
  const claimedRewardAmount = BigNumber(
    parsedBorrowIncentiveRewardPoolData.claimedRewards
  );
  const claimedRewardCoin = claimedRewardAmount.shiftedBy(
    -1 * rewardCoinDecimal
  );
  const claimedRewardValue = claimedRewardCoin.multipliedBy(rewardCoinPrice);

  const rewardValueForYear = BigNumber(rewardPerSec)
    .shiftedBy(-1 * rewardCoinDecimal)
    .multipliedBy(rateYearFactor)
    .multipliedBy(rewardCoinPrice);
  const rewardRate = rewardValueForYear
    .dividedBy(calculatedBorrowIncentivePoolData.stakedValue)
    .isFinite()
    ? rewardValueForYear
        .dividedBy(calculatedBorrowIncentivePoolData.stakedValue)
        .toNumber()
    : Infinity;
  const rewardFeeRate = BigNumber(
    parsedBorrowIncentiveRewardPoolData.rewardsFeeRateNumerator
  )
    .dividedBy(parsedBorrowIncentiveRewardPoolData.rewardsFeeRateDenominator)
    .toNumber();

  return {
    rewardApr: rewardRate,
    totalRewardAmount: totalRewardAmount.toNumber(),
    totalRewardCoin: totalRewardCoin.toNumber(),
    totalRewardValue: totalRewardValue.toNumber(),
    remaindRewardAmount: remaindRewardAmount.toNumber(),
    remaindRewardCoin: remaindRewardCoin.toNumber(),
    remaindRewardValue: remaindRewardValue.toNumber(),
    claimedRewardAmount: claimedRewardAmount.toNumber(),
    claimedRewardCoin: claimedRewardCoin.toNumber(),
    claimedRewardValue: claimedRewardValue.toNumber(),
    rewardPerSec: rewardPerSec.toNumber(),
    rewardFee: rewardFeeRate,
  };
};

/**
 *  Parse origin borrow incentive account data to a more readable format.
 *
 * @param originBorrowIncentiveAccountData - Origin borrow incentive account data
 * @return Parsed borrow incentive account data
 */
export const parseOriginBorrowIncentiveAccountData = (
  originBorrowIncentiveAccountData: OriginBorrowIncentiveAccountData
): ParsedBorrowIncentiveAccountData => {
  return {
    poolType: normalizeStructTag(
      originBorrowIncentiveAccountData.pool_type.name
    ),
    amount: Number(originBorrowIncentiveAccountData.amount),
    index: Number(originBorrowIncentiveAccountData.index),
    points: Number(originBorrowIncentiveAccountData.points),
    totalPoints: Number(originBorrowIncentiveAccountData.total_points),
  };
};

export const minBigNumber = (...args: BigNumber.Value[]) => {
  return BigNumber(
    args.reduce((min, current) =>
      new BigNumber(current).lt(min) ? current : min
    )
  );
};

export const maxBigNumber = (...args: BigNumber.Value[]) => {
  return BigNumber(
    args.reduce((max, current) =>
      new BigNumber(current).gt(max) ? current : max
    )
  );
};

/**
 * Dynamically adjust the decrease or increase ratio according to the amout
 * @param amount - The amount required to calculate factor.
 * @param scaleStep - The scale step required to determine the factor..
 * @param type - The type of the calculation.
 * @return The estimated factor
 * */
export const estimatedFactor = (
  amount: number,
  scaleStep: number,
  type: 'increase' | 'decrease'
) => {
  const amountOfDigits = Math.max(
    1,
    Math.floor(Math.log10(Math.abs(amount)) + 1)
  );

  const adjustScale =
    Math.max(Math.floor((amountOfDigits - 1) / scaleStep), 1) + 1;

  let adjustFactor = Math.pow(10, -adjustScale);
  adjustFactor = type === 'increase' ? 1 - adjustFactor : 1 + adjustFactor;

  return adjustFactor;
};
