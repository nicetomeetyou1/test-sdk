import { normalizeSuiAddress, SUI_TYPE_ARG } from '@mysten/sui.js';
import { SuiKit } from '@scallop-io/sui-kit';
import { ScallopAddress } from './scallopAddress';
import { ScallopUtils } from './scallopUtils';
import { ScallopTxBuilder } from './txBuilder';
import type {
  SupportAssetCoinType,
  SupportCollateralCoinType,
  SupportCoinType,
  MarketInterface,
  ObligationInterface,
} from '../types';

/**
 * ### Scallop Client
 *
 * it provides contract interaction operations for general users.
 *
 * #### Usage
 *
 * ```typescript
 * const clent  = new Scallop(<parameters>);
 * client.<interact functions>();
 * ```
 */
export class ScallopClient {
  private _suiKit: SuiKit;
  private _address: ScallopAddress;
  private _walletAddress: string;

  public utils: ScallopUtils;

  public constructor(
    suiKit: SuiKit,
    address: ScallopAddress,
    walletAddress?: string
  ) {
    const normalizedWalletAddress = normalizeSuiAddress(
      walletAddress || suiKit.currentAddress()
    );
    this._suiKit = suiKit;
    this._address = address;
    this._walletAddress = normalizedWalletAddress;

    this.utils = new ScallopUtils(this._suiKit);
  }

  /**
   * Query market data.
   *
   * @return Market data
   */
  public async queryMarket() {
    const txBuilder = new ScallopTxBuilder();
    const queryTxn = txBuilder.queryMarket(
      this._address.get('core.packages.query.id'),
      this._address.get('core.market')
    );
    const queryResult = await this._suiKit.inspectTxn(queryTxn);
    const queryData: MarketInterface = queryResult.events[0].parsedJson;
    return queryData;
  }

  /**
   * Query obligations data.
   *
   * @param ownerAddress - The owner address.
   * @return Obligations data
   */
  async getObligations(ownerAddress?: string) {
    const owner = ownerAddress || this._walletAddress;
    const keyObjectRefs =
      await this._suiKit.rpcProvider.provider.getOwnedObjects({
        owner,
        filter: {
          StructType: `${this._address.get(
            'core.packages.protocol.id'
          )}::obligation::ObligationKey`,
        },
      });
    const keyIds = keyObjectRefs.data
      .map((ref: any) => ref?.data?.objectId)
      .filter((id: any) => id !== undefined) as string[];
    const keyObjects = await this._suiKit.getObjects(keyIds);
    const obligations: { id: string; keyId: string }[] = [];
    for (const keyObject of keyObjects) {
      const keyId = keyObject.objectId;
      const fields = keyObject.objectFields as any;
      const obligationId = fields['ownership']['fields']['of'];
      obligations.push({ id: obligationId, keyId });
    }
    return obligations;
  }

  /**
   * Query obligation data.
   *
   * @param obligationId - The obligation id from protocol package.
   * @return Obligation data
   */
  public async queryObligation(obligationId: string) {
    const txBuilder = new ScallopTxBuilder();
    const queryTxn = txBuilder.queryObligation(
      this._address.get('core.packages.query.id'),
      obligationId
    );
    const queryResult = await this._suiKit.inspectTxn(queryTxn);
    const queryData: ObligationInterface = queryResult.events[0].parsedJson;
    return queryData;
  }

  /**
   * Open obligation.
   *
   * @param sign - Decide to directly sign the transaction or return the transaction block.
   * @return Transaction block response or transaction block
   */
  public async openObligation(sign: boolean = true) {
    const txBuilder = new ScallopTxBuilder();
    txBuilder.openObligationEntry(
      this._address.get('core.packages.protocol.id')
    );
    if (sign) {
      return this._suiKit.signAndSendTxn(txBuilder.suiTxBlock);
    } else {
      return txBuilder.txBlock;
    }
  }

  /**
   * Deposit collateral into the specific pool.
   *
   * @param coinName - Types of collateral coin.
   * @param amount - The amount of coins would depoist.
   * @param sign - Decide to directly sign the transaction or return the transaction block.
   * @param obligationId - The obligation object.
   * @param walletAddress - The wallet address of the owner.
   * @return Transaction block response or transaction block
   */
  public async depositCollateral(
    coinName: SupportCollateralCoinType,
    amount: number,
    sign: boolean = true,
    obligationId?: string,
    walletAddress?: string
  ) {
    const txBuilder = new ScallopTxBuilder();
    const coinType =
      coinName === 'sui'
        ? SUI_TYPE_ARG
        : `${this._address.get(
            `core.coins.${coinName}.id`
          )}::${coinName}::${coinName.toUpperCase()}`;
    const ownerAddress = walletAddress || this._walletAddress;
    const coins = await this.utils.selectCoins(ownerAddress, amount, coinType);
    const [takeCoin, leftCoin] = txBuilder.takeCoins(coins, amount, coinType);
    if (obligationId) {
      txBuilder.addCollateral(
        this._address.get('core.packages.protocol.id'),
        this._address.get('core.market'),
        obligationId,
        takeCoin,
        coinType
      );
      txBuilder.suiTxBlock.transferObjects([leftCoin], ownerAddress);
    } else {
      const [obligation, obligationKey, hotPotato] = txBuilder.openObligation(
        this._address.get('core.packages.protocol.id')
      );

      txBuilder.addCollateral(
        this._address.get('core.packages.protocol.id'),
        this._address.get('core.market'),
        obligation,
        takeCoin,
        coinType
      );
      txBuilder.returnObligation(
        this._address.get('core.packages.protocol.id'),
        obligation,
        hotPotato
      );
      txBuilder.suiTxBlock.transferObjects([leftCoin], ownerAddress);
      txBuilder.suiTxBlock.transferObjects([obligationKey], ownerAddress);
    }

    if (sign) {
      return this._suiKit.signAndSendTxn(txBuilder.suiTxBlock);
    } else {
      return txBuilder.txBlock;
    }
  }

  /**
   * Withdraw collateral from the specific pool.
   *
   * @param coinName - Types of collateral coin.
   * @param amount - The amount of coins would depoist.
   * @param sign - Decide to directly sign the transaction or return the transaction block.
   * @param obligationId - The obligation object.
   * @param obligationKey - The obligation key object to verifying obligation authority.
   * @param walletAddress - The wallet address of the owner.
   * @return Transaction block response or transaction block
   */
  public async withdrawCollateral(
    coinName: SupportCollateralCoinType,
    amount: number,
    sign: boolean = true,
    obligationId: string,
    obligationKey: string
  ) {
    const txBuilder = new ScallopTxBuilder();
    const coinType =
      coinName === 'sui'
        ? SUI_TYPE_ARG
        : `${this._address.get(
            `core.coins.${coinName}.id`
          )}::${coinName}::${coinName.toUpperCase()}`;

    // update prices
    const obligation = await this.queryObligation(obligationId);
    const collateralCoinTypes = obligation.collaterals.map((collateral) => {
      return `0x${collateral.type.name}`;
    });
    const debtCoinTypes = obligation.debts.map((debt) => {
      return `0x${debt.type.name}`;
    });
    const updateCoinTypes = [
      ...new Set([...collateralCoinTypes, ...debtCoinTypes, coinType]),
    ];

    for (const updateCoinType of updateCoinTypes) {
      const updateCoin = updateCoinType
        .split('::')[2]
        .toLowerCase() as SupportCoinType;
      txBuilder.updatePrice(
        this._address.get('core.packages.xOracle.id'),
        this._address.get('core.oracles.xOracle'),
        this._address.get('core.packages.switchboard.id'),
        this._address.get('core.oracles.switchboard.registry'),
        this._address.get(`core.coins.${updateCoin}.oracle.switchboard`),
        updateCoinType
      );
    }

    txBuilder.takeCollateralEntry(
      this._address.get('core.packages.protocol.id'),
      this._address.get('core.market'),
      this._address.get('core.coinDecimalsRegistry'),
      this._address.get('core.oracles.xOracle'),
      obligationId,
      obligationKey,
      amount,
      coinType
    );

    if (sign) {
      return this._suiKit.signAndSendTxn(txBuilder.suiTxBlock);
    } else {
      return txBuilder.txBlock;
    }
  }

  /**
   * Deposit asset into the specific pool.
   *
   * @param coinName - Types of asset coin.
   * @param amount - The amount of coins would depoist.
   * @param sign - Decide to directly sign the transaction or return the transaction block.
   * @param walletAddress - The wallet address of the owner.
   * @return Transaction block response or transaction block
   */
  public async deposit(
    coinName: SupportAssetCoinType,
    amount: number,
    sign: boolean = true,
    walletAddress?: string
  ) {
    const txBuilder = new ScallopTxBuilder();
    const coinType =
      //@ts-ignore
      coinName === 'sui'
        ? SUI_TYPE_ARG
        : `${this._address.get(
            `core.coins.${coinName}.id`
          )}::${coinName}::${coinName.toUpperCase()}`;
    const ownerAddress = walletAddress || this._walletAddress;
    const coins = await this.utils.selectCoins(ownerAddress, amount, coinType);
    const [takeCoin, leftCoin] = txBuilder.takeCoins(coins, amount, coinType);

    txBuilder.depositEntry(
      this._address.get('core.packages.protocol.id'),
      this._address.get('core.market'),
      takeCoin,
      coinType
    );
    txBuilder.suiTxBlock.transferObjects([leftCoin], ownerAddress);

    if (sign) {
      return this._suiKit.signAndSendTxn(txBuilder.suiTxBlock);
    } else {
      return txBuilder.txBlock;
    }
  }

  /**
   * Withdraw asset from the specific pool, must return market coin.
   *
   * @param coinName - Types of asset coin.
   * @param amount - The amount of coins would withdraw.
   * @param sign - Decide to directly sign the transaction or return the transaction block.
   * @param walletAddress - The wallet address of the owner.
   * @return Transaction block response or transaction block
   */
  public async withdraw(
    coinName: SupportAssetCoinType,
    amount: number,
    sign: boolean = true,
    walletAddress?: string
  ) {
    const txBuilder = new ScallopTxBuilder();
    const coinType =
      //@ts-ignore
      coinName === 'sui'
        ? SUI_TYPE_ARG
        : `${this._address.get(
            `core.coins.${coinName}.id`
          )}::${coinName}::${coinName.toUpperCase()}`;
    const MarketCoinType = `${this._address.get(
      'core.packages.protocol.id'
    )}::reserve::MarketCoin<${
      //@ts-ignore
      coinName === 'sui'
        ? '0x2'
        : this._address.get('core.packages.testCoin.id')
    }::${coinName}::${coinName.toUpperCase()}>`;

    const ownerAddress = walletAddress || this._walletAddress;
    const marketCoins = await this.utils.selectCoins(
      ownerAddress,
      amount,
      MarketCoinType
    );
    const [takeCoin, leftCoin] = txBuilder.takeCoins(
      marketCoins,
      amount,
      MarketCoinType
    );

    txBuilder.withdrawEntry(
      this._address.get('core.packages.protocol.id'),
      this._address.get('core.market'),
      takeCoin,
      coinType
    );
    txBuilder.suiTxBlock.transferObjects([leftCoin], ownerAddress);

    if (sign) {
      return this._suiKit.signAndSendTxn(txBuilder.suiTxBlock);
    } else {
      return txBuilder.txBlock;
    }
  }

  /**
   * borrow asset from the specific pool.
   *
   * @param coinName - Types of asset coin.
   * @param amount - The amount of coins would borrow.
   * @param sign - Decide to directly sign the transaction or return the transaction block.
   * @param obligationId - The obligation object.
   * @param obligationKey - The obligation key object to verifying obligation authority.
   * @param walletAddress - The wallet address of the owner.
   * @return Transaction block response or transaction block
   */
  public async borrow(
    coinName: SupportAssetCoinType,
    amount: number,
    sign: boolean = true,
    obligationId: string,
    obligationKey: string
  ) {
    const txBuilder = new ScallopTxBuilder();
    const coinType =
      //@ts-ignore
      coinName === 'sui'
        ? SUI_TYPE_ARG
        : `${this._address.get(
            `core.coins.${coinName}.id`
          )}::${coinName}::${coinName.toUpperCase()}`;

    // update prices
    const obligation = await this.queryObligation(obligationId);
    const collateralCoinTypes = obligation.collaterals.map((collateral) => {
      return `0x${collateral.type.name}`;
    });
    const debtCoinTypes = obligation.debts.map((debt) => {
      return `0x${debt.type.name}`;
    });
    const updateCoinTypes = [
      ...new Set([...collateralCoinTypes, ...debtCoinTypes, coinType]),
    ];

    for (const updateCoinType of updateCoinTypes) {
      const updateCoin = updateCoinType
        .split('::')[2]
        .toLowerCase() as SupportCoinType;
      txBuilder.updatePrice(
        this._address.get('core.packages.xOracle.id'),
        this._address.get('core.oracles.xOracle'),
        this._address.get('core.packages.switchboard.id'),
        this._address.get('core.oracles.switchboard.registry'),
        this._address.get(`core.coins.${updateCoin}.oracle.switchboard`),
        updateCoinType
      );
    }

    txBuilder.borrowEntry(
      this._address.get('core.packages.protocol.id'),
      this._address.get('core.market'),
      this._address.get('core.coinDecimalsRegistry'),
      this._address.get('core.oracles.xOracle'),
      obligationId,
      obligationKey,
      amount,
      coinType
    );

    if (sign) {
      return this._suiKit.signAndSendTxn(txBuilder.suiTxBlock);
    } else {
      return txBuilder.txBlock;
    }
  }

  /**
   * Repay asset into the specific pool.
   *
   * @param coinName - Types of asset coin.
   * @param amount - The amount of coins would repay.
   * @param sign - Decide to directly sign the transaction or return the transaction block.
   * @param obligationId - The obligation object.
   * @param walletAddress - The wallet address of the owner.
   * @return Transaction block response or transaction block
   */
  public async repay(
    coinName: SupportAssetCoinType,
    amount: number,
    sign: boolean = true,
    obligationId: string,
    walletAddress?: string
  ) {
    const txBuilder = new ScallopTxBuilder();
    const coinType =
      //@ts-ignore
      coinName === 'sui'
        ? SUI_TYPE_ARG
        : `${this._address.get(
            `core.coins.${coinName}.id`
          )}::${coinName}::${coinName.toUpperCase()}`;
    const ownerAddress = walletAddress || this._walletAddress;
    const coins = await this.utils.selectCoins(ownerAddress, amount, coinType);
    const [takeCoin, leftCoin] = txBuilder.takeCoins(coins, amount, coinType);

    txBuilder.repay(
      this._address.get('core.packages.protocol.id'),
      this._address.get('core.market'),
      obligationId,
      takeCoin,
      coinType
    );
    txBuilder.suiTxBlock.transferObjects([leftCoin], ownerAddress);

    if (sign) {
      return this._suiKit.signAndSendTxn(txBuilder.suiTxBlock);
    } else {
      return txBuilder.txBlock;
    }
  }

  /**
   * Mint and get test coin.
   *
   * @remarks
   *  Only be used on the test network.
   *
   * @param coinName - Types of coins supported on the test network.
   * @param amount - The amount of coins minted and received.
   * @param receiveAddress - The wallet address that receives the coins.
   * @param sign - Decide to directly sign the transaction or return the transaction block.
   * @return Transaction block response or transaction block
   */
  public async mintTestCoin(
    coinName: Exclude<SupportCoinType, 'sui'>,
    amount: number,
    receiveAddress: string = this._walletAddress,
    sign: boolean = true
  ) {
    const txBuilder = new ScallopTxBuilder();
    const recipient = receiveAddress || this._walletAddress;
    txBuilder.mintTestCoinEntry(
      this._address.get('core.packages.testCoin.id'),
      this._address.get(`core.coins.${coinName}.treasury`),
      coinName,
      amount,
      recipient
    );

    if (sign) {
      return this._suiKit.signAndSendTxn(txBuilder.suiTxBlock);
    } else {
      return txBuilder.txBlock;
    }
  }
}
