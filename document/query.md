# Use ScallopQuery

## Core query

- Get asset or collateral pool data from market.

  ```typescript
  const scallopQuery = await scallopSDK.createScallopQuery();

  // Get both asset and collateral pools data from market. Use inspectTxn call to obtain the data provided in the scallop contract query module.
  const marketData = await scallopQuery.queryMarket();

  // Get multiple asset pools data. To obtain all market pools at once, it is recommended to use the `queryMarket` method to reduce time consumption.
  const marketPools = await scallopQuery.getMarketPools(['sui', 'usdc']);

  // Get asset pool data separately.
  const suiMarketPool = await scallopQuery.getMarketPool('sui');

  // Get multiple collateral pools data. To obtain all market pools at once, it is recommended to use the `queryMarket` method to reduce time consumption.
  const marketCollaterals = await scallopQuery.getMarketCollaterals([
    'sui',
    'usdc',
  ]);

  // Get collateral pool data separately.
  const suiMarketCollateral = await scallopQuery.getMarketCollateral('sui');

  // For the return type, please refer to the type definition of the source code, which is located in the project `src/types/query` folder location.
  ```

- Get obligation data.

  ```typescript
  const scallopQuery = await scallopSDK.createScallopQuery();

  // Get all obligation key and id from owner.
  const obligations = await scallopQuery.getObligations();

  // Use obligation id to get obligation data..
  const obligationData = await scallopQuery.queryObligation(obligations[0].id);

  // For the return type, please refer to the type definition of the source code, which is located in the project `src/types/query` folder location.
  ```

- Get coin and market coin amount for owner. We also provide the way obtain coin price.

  ```typescript
  const scallopQuery = await scallopSDK.createScallopQuery();

  // Get all coin amount from owner.
  const coinAmounts = await scallopQuery.getCoinAmounts();

  // Get specific coin amount from owner.
  const coinAmount = await scallopQuery.getCoinAmount('sui');

  // Get all market coin amount from owner.
  const marketCoinAmounts = await scallopQuery.getMarketCoinAmounts();

  // Get specific market coin amount from owner.
  const marketCoinAmount = await scallopQuery.getMarketCoinAmount('ssui');

  // Get specific asset coin price.
  const usdcPrice = await scallopQuery.getPriceFromPyth('usdc');

  // For the return type, please refer to the type definition of the source code, which is located in the project `src/types/query` folder location.
  ```

## Spool query

- Get spool data.

  ```typescript
  const scallopQuery = await scallopSDK.createScallopQuery();

  // Get all spools data.
  const spools = await scallopQuery.getSpools();

  // Get multiple spools data.
  const spools = await scallopQuery.getSpools(['ssui', 'susdc']);

  // Get spool data separately.
  const ssuiSpool = await scallopQuery.getSpool('ssui');

  // For the return type, please refer to the type definition of the source code, which is located in the project `src/types/query` folder location.
  ```

- Stale methods, directly obtain the data of object fields.

  ```typescript
  const scallopQuery = await scallopSDK.createScallopQuery();

  // Get stake account for all spools.
  const allStakeAccounts = await scallopQuery.getAllStakeAccounts();

  // Get stake accounts for specific spool.
  const stakeAccounts = await scallopQuery.getStakeAccounts('ssui');

  // Get multiple stake pools data.
  const stakePools = await scallopQuery.getStakePools(['ssui', 'susdc']);

  // Get stake pool data separately.
  const suiStakePool = await scallopQuery.getStakePool('ssui');

  // Get multiple reward pools data.
  const rewardPools = await scallopQuery.getRewardPools(['ssui', 'susdc']);

  // Get reward pool data separately.
  const rewardPool = await scallopQuery.getRewardPool('ssui');

  // For the return type, please refer to the type definition of the source code, which is located in the project `src/types/query` folder location.
  ```

## Portfolio query

- Get user lending information include spool information.

  ```typescript
  const scallopQuery = await scallopSDK.createScallopQuery();

  // Get multiple lending information from owner.
  const lendings = await scallopQuery.getLendings(['sui', 'usdc']);

  // Get lending information separately.
  const lending = await scallopQuery.getLending('sui');

  // For the return type, please refer to the type definition of the source code, which is located in the project `src/types/query` folder location.
  ```

- Get user obligation account information include collateral and borrowing information.

  ```typescript
  const scallopQuery = await scallopSDK.createScallopQuery();

  // Get all obligation accounts information.
  const obligationAccounts = await scallopQuery.getObligationAccounts();

  // Get obligation account information separately.
  const obligations = await scallopQuery.getObligations();
  const obligationAccount = await scallopQuery.getObligationAccount(
    obligations[0].id
  );

  // For the return type, please refer to the type definition of the source code, which is located in the project `src/types/query` folder location.
  ```

- Get Scallop total value locked information.

  ```typescript
  const scallopQuery = await scallopSDK.createScallopQuery();

  // Get tvl that including total supply value and total borrow value.
  const tvl = await scallopQuery.getTvl();

  // For the return type, please refer to the type definition of the source code, which is located in the project `src/types/query` folder location.
  ```
