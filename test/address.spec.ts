import * as dotenv from 'dotenv';
import { describe, it, expect } from 'vitest';
import { NetworkType } from '@scallop-io/sui-kit';
import { ScallopAddress } from '../src';
import type { AddressesInterface } from '../src';

dotenv.config();

const ENABLE_LOG = true;

const TEST_ADDRESSES_ID = '';
const NETWORK: NetworkType = 'mainnet';

describe('Test Scallop Address', () => {
  const scallopAddress = new ScallopAddress({
    id: TEST_ADDRESSES_ID,
    auth: process.env.API_KEY,
    network: NETWORK,
  });
  console.info('\x1b[32mAddresses Id: \x1b[33m', TEST_ADDRESSES_ID);

  it('Should get new addresses after create', async () => {
    const oldAddressesId = scallopAddress.getId();
    if (oldAddressesId === undefined) {
      const allAddresses = await scallopAddress.create();
      if (ENABLE_LOG) console.info('All addresses:', allAddresses);
      expect(!!allAddresses).toBe(true);
    }
    const newAddressesId = scallopAddress.getId();
    expect(oldAddressesId).not.toEqual(newAddressesId);
    await scallopAddress.delete();
  });

  it('Should get new addresses after update', async () => {
    let addressesId = scallopAddress.getId();
    let oldAddresses: AddressesInterface | undefined = undefined;
    if (addressesId === undefined) {
      await scallopAddress.create({ memo: 'Scallop sdk addresses unit test' });
      addressesId = scallopAddress.getId();
      oldAddresses = scallopAddress.getAddresses();
    } else {
      oldAddresses = scallopAddress.getAddresses();
    }
    const testAddresse: AddressesInterface = JSON.parse(`
      {
        "core": {
            "version": "0x07871c4b3c847a0f674510d4978d5cf6f960452795e8ff6f189fd2088a3f6ac7",
            "versionCap": "0x590a4011cb649b3878f3ea14b3a78674642a9548d79b7e091ef679574b158a07",
            "market": "0xa757975255146dc9686aa823b7838b507f315d704f428cbadad2f4ea061939d9",
            "adminCap": "0x09689d018e71c337d9db6d67cbca06b74ed92196103624028ccc3ecea411777c",
            "coinDecimalsRegistry": "0x200abe9bf19751cc566ae35aa58e2b7e4ff688fc1130f8d8909ea09bc137d668",
            "coins": {
                "cetus": {
                    "id": "0x06864a6f921804860930db6ddbe2e16acdf8504495ea7481637a1c8b9a8fe54b",
                    "metaData": "0x4c0dce55eff2db5419bbd2d239d1aa22b4a400c01bbb648b058a9883989025da",
                    "treasury": "",
                    "oracle": {
                        "supra": "",
                        "switchboard": "",
                        "pyth": {
                            "feed": "e5b274b2611143df055d6e7cd8d93fe1961716bcd4dca1cad87a83bc1e78c1ef",
                            "feedObject": "0x2caadc4fb259ec57d6ee5ea8b6256376851955dffdb679d5e5526c5b6f8d865f"
                        }
                    }
                },
                "apt": {
                    "id": "0x3a5143bb1196e3bcdfab6203d1683ae29edd26294fc8bfeafe4aaa9d2704df37",
                    "metaData": "0xc969c5251f372c0f34c32759f1d315cf1ea0ee5e4454b52aea08778eacfdd0a8",
                    "treasury": "",
                    "oracle": {
                        "supra": "",
                        "switchboard": "",
                        "pyth": {
                            "feed": "03ae4db29ed4ae33d323568895aa00337e658e348b37509f5372ae51f0af00d5",
                            "feedObject": "0x02ed0bfc818a060e1378eccda6a6c1dc6b4360b499bdaa23e3c69bb9ba2bfc96"
                        }
                    }
                },
                "sol": {
                    "id": "0xb7844e289a8410e50fb3ca48d69eb9cf29e27d223ef90353fe1bd8e27ff8f3f8",
                    "metaData": "0x4d2c39082b4477e3e79dc4562d939147ab90c42fc5f3e4acf03b94383cd69b6e",
                    "treasury": "",
                    "oracle": {
                        "supra": "",
                        "switchboard": "",
                        "pyth": {
                            "feed": "ef0d8b6fda2ceba41da15d4095d1da392a0d2f8ed0c6c7bc0f4cfac8c280b56d",
                            "feedObject": "0x0ea409db743138a6a35d067de468b1f43944f970267a9026de9794a86e3a0ac3"
                        }
                    }
                },
                "btc": {
                    "id": "0x027792d9fed7f9844eb4839566001bb6f6cb4804f66aa2da6fe1ee242d896881",
                    "metaData": "0x5d3c6e60eeff8a05b693b481539e7847dfe33013e7070cdcb387f5c0cac05dfd",
                    "treasury": "",
                    "oracle": {
                        "supra": "",
                        "switchboard": "",
                        "pyth": {
                            "feed": "e62df6c8b4a85fe1a67db44dc12de5db330f7ac66b72dc658afedf0f4a415b43",
                            "feedObject": "0x144ec4135c65af207b97b3d2dfea9972efc7d80cc13a960ae1d808a3307d90ca"
                        }
                    }
                },
                "eth": {
                    "id": "0xaf8cd5edc19c4512f4259f0bee101a40d41ebed738ade5874359610ef8eeced5",
                    "metaData": "0x8900e4ceede3363bef086d6b50ca89d816d0e90bf6bc46efefe1f8455e08f50f",
                    "treasury": "",
                    "oracle": {
                        "supra": "",
                        "switchboard": "",
                        "pyth": {
                            "feed": "ff61491a931112ddf1bd8147cd1b641375f79f5825126d665480874634fd0ace",
                            "feedObject": "0xaa6adc565636860729907ef3e7fb7808d80c8a425a5fd417ae47bb68e2dcc2e3"
                        }
                    }
                },
                "usdc": {
                    "id": "0x5d4b302506645c37ff133b98c4b50a5ae14841659738d6d733d59d0d217a93bf",
                    "metaData": "0x4fbf84f3029bd0c0b77164b587963be957f853eccf834a67bb9ecba6ec80f189",
                    "treasury": "",
                    "oracle": {
                        "supra": "",
                        "switchboard": "",
                        "pyth": {
                            "feed": "eaa020c61cc479712813461ce153894a96a6c00b21ed0cfc2798d1f9a9e9c94a",
                            "feedObject": "0x1db46472aa29f5a41dd4dc41867fdcbc1594f761e607293c40bdb66d7cd5278f"
                        }
                    }
                },
                "usdt": {
                    "id": "0xc060006111016b8a020ad5b33834984a437aaa7d3c74c18e09a95d48aceab08c",
                    "metaData": "0xfb0e3eb97dd158a5ae979dddfa24348063843c5b20eb8381dd5fa7c93699e45c",
                    "treasury": "",
                    "oracle": {
                        "supra": "",
                        "switchboard": "",
                        "pyth": {
                            "feed": "2b89b9dc8fdf9f34709a5b106b472f0f39bb6ca9ce04b0fd7f2e971688e2e53b",
                            "feedObject": "0x64f8db86bef3603472cf446c7ab40278af7f4bcda97c7599ad4cb33d228e31eb"
                        }
                    }
                },
                "sui": {
                    "id": "0x0000000000000000000000000000000000000000000000000000000000000002",
                    "metaData": "",
                    "treasury": "",
                    "oracle": {
                        "supra": "",
                        "switchboard": "0xbca474133638352ba83ccf7b5c931d50f764b09550e16612c9f70f1e21f3f594",
                        "pyth": {
                            "feed": "23d7315113f5b1d3ba7a83604c44b94d79f4fd69af77f804fc7f920a6dc65744",
                            "feedObject": "0x168aa44fa92b27358beb17643834078b1320be6adf1b3bb0c7f018ac3591db1a"
                        }
                    }
                }
            },
            "oracles": {
                "xOracle": "0x93d5bf0936b71eb27255941e532fac33b5a5c7759e377b4923af0a1359ad494f",
                "xOracleCap": "0x1edeae568fde99e090dbdec4bcdbd33a15f53a1ce1f87aeef1a560dedf4b4a90",
                "supra": {
                    "registry": "",
                    "registryCap": "",
                    "holder": ""
                },
                "switchboard": {
                    "registry": "",
                    "registryCap": ""
                },
                "pyth": {
                    "registry": "0x8c30c13df429e16d4e7be8726f25acfd8f5a6992d84a81eb36967e95bf18c889",
                    "registryCap": "0x85ceae1f42746452ca0b6506414ce038b04447723b7d41990545647b3d48a713",
                    "state": "0xf9ff3ef935ef6cdfb659a203bf2754cebeb63346e29114a535ea6f41315e5a3f",
                    "wormhole": "0x5306f64e312b581766351c07af79c72fcb1cd25147157fdc2f8ad76de9a3fb6a",
                    "wormholeState": "0xaeab97f96cf9877fee2883315d459552b2b921edc16d7ceac6eab944dd88919c"
                }
            },
            "packages": {
                "coinDecimalsRegistry": {
                    "id": "0xca5a5a62f01c79a104bf4d31669e29daa387f325c241de4edbe30986a9bc8b0d",
                    "upgradeCap": "0x34e76a945d29f195bc53ca704fa70877d1cf3a5d7bbfdda1b13e633fff13c0f6"
                },
                "math": {
                    "id": "0xad013d5fde39e15eabda32b3dbdafd67dac32b798ce63237c27a8f73339b9b6f",
                    "upgradeCap": "0x3a329598231de02e6135c62284b66005b41cad1d9ab7ca2dc79c08293aba2ec6"
                },
                "whitelist": {
                    "id": "0x1318fdc90319ec9c24df1456d960a447521b0a658316155895014a6e39b5482f",
                    "upgradeCap": "0xf5a22aea23db664f7b69855b6a546747f17c1ec4230319cfc17225e462b05761"
                },
                "x": {
                    "id": "0x779b5c547976899f5474f3a5bc0db36ddf4697ad7e5a901db0415c2281d28162",
                    "upgradeCap": "0x3f203f6fff6a69d151e4f1cd931f22b68c489ef2759765662fc7baf673943c9e"
                },
                "protocol": {
                    "id": "0xc05a9cdf09d2f2451dea08ca72641e013834baef3d2ea5fcfee60a9d1dc3c7d9",
                    "upgradeCap": "0x38527d154618d1fd5a644b90717fe07cf0e9f26b46b63e9568e611a3f86d5c1a"
                },
                "query": {
                    "id": "0xbd4f1adbef14cf6ddf31cf637adaa7227050424286d733dc44e6fd3318fc6ba3",
                    "upgradeCap": "0x3d0ef1c744c6f957d5bd5298908ad1bdef031767aa9f137313a8ccea6db9cca3"
                },
                "supra": {
                    "id": "",
                    "upgradeCap": ""
                },
                "pyth": {
                    "id": "0xaac1fdb607b884cc256c59dc307bb78b6ba95b97e22d4415fe87ad99689ea462",
                    "upgradeCap": "0x3b96c287dcdc1660bdae26e34a52ac07e826a438b12c2ced9addce91daf90ac5"
                },
                "switchboard": {
                    "id": "",
                    "upgradeCap": ""
                },
                "xOracle": {
                    "id": "0x1478a432123e4b3d61878b629f2c692969fdb375644f1251cd278a4b1e7d7cd6",
                    "upgradeCap": "0x0f928a6b2e26b73330fecaf9b44acfc9800a4a9794d6415c2a3153bc70e3c1f0"
                },
                "testCoin": {
                    "id": "",
                    "upgradeCap": ""
                }
            }
        },
        "spool": {
            "id": "0xe87f1b2d498106a2c61421cec75b7b5c5e348512b0dc263949a0e7a3c256571a",
            "adminCap": "0xdd8a047cbbf802bfcde5288b8ef1910965d789cc614da11d39af05fca0bd020a",
            "pools": {
              "ssui": {
                "id": "0x4f0ba970d3c11db05c8f40c64a15b6a33322db3702d634ced6536960ab6f3ee4",
                "rewardPoolId": "0x162250ef72393a4ad3d46294c4e1bdfcb03f04c869d390e7efbfc995353a7ee9"
              },
              "susdc": {
                "id": "0x4ace6648ddc64e646ba47a957c562c32c9599b3bba8f5ac1aadb2ae23a2f8ca0",
                "rewardPoolId": "0xf4268cc9b9413b9bfe09e8966b8de650494c9e5784bf0930759cfef4904daff8"
              }
            }
        }
      }
    `);
    await scallopAddress.update({
      addresses: testAddresse,
    });
    const updatedAddresses = scallopAddress.getAddresses();
    if (ENABLE_LOG) {
      console.log('Id', addressesId);
      console.info('Addresses:', updatedAddresses);
    }
    expect(!!updatedAddresses).toBe(true);
    expect(updatedAddresses).not.toEqual(oldAddresses);
    await scallopAddress.delete();
  });

  it('Should read and get addresses success', async () => {
    let addressesId = scallopAddress.getId();
    if (addressesId === undefined) {
      const oldAddresses = scallopAddress.getAddresses();
      expect(oldAddresses).toEqual(undefined);
      await scallopAddress.create({ memo: 'Scallop sdk addresses unit test' });
      addressesId = scallopAddress.getId();
    }

    await scallopAddress.read();
    const addresses = scallopAddress.getAddresses();
    const allAddresses = scallopAddress.getAllAddresses();
    if (ENABLE_LOG) {
      console.info('Id:', addressesId);
      console.info('Addresses:', addresses);
      console.info('All addresses:', allAddresses);
    }
    expect(addresses).toEqual(allAddresses[NETWORK]);
    await scallopAddress.delete();
  });

  it('Should get success', async () => {
    let addressesId = scallopAddress.getId();
    if (addressesId === undefined) {
      await scallopAddress.create({ memo: 'Scallop sdk addresses unit test' });
      addressesId = scallopAddress.getId();
    }

    const addresses = scallopAddress.getAddresses();
    const usdcCoinId = scallopAddress.get('core.coins.usdc.id');
    if (ENABLE_LOG) {
      console.info('Id:', addressesId);
      console.info('UsdcCoinId', usdcCoinId);
    }
    expect(usdcCoinId).toEqual(addresses?.core.coins.usdc?.id || undefined);
    await scallopAddress.delete();
  });

  it('Should set success', async () => {
    let addressesId = scallopAddress.getId();
    if (addressesId === undefined) {
      await scallopAddress.create({ memo: 'Scallop sdk addresses unit test' });
      addressesId = scallopAddress.getId();
    }
    const oldUsdcCoinId = scallopAddress.get('core.coins.usdc.id');
    scallopAddress.set('core.coins.usdc.id', '0x00');
    const newAddresses = scallopAddress.get('core.coins.usdc.id');
    if (ENABLE_LOG) {
      console.info('Id:', addressesId);
      console.info('Old usdcCoinId', oldUsdcCoinId);
      console.info('New usdcCoinId', newAddresses);
    }
    expect(newAddresses).not.toEqual(oldUsdcCoinId);
    await scallopAddress.delete();
  });

  it('Should switch current addresses success', async () => {
    let addressesId = scallopAddress.getId();
    if (addressesId === undefined) {
      await scallopAddress.create({ memo: 'Scallop sdk addresses unit test' });
      addressesId = scallopAddress.getId();
    }
    const testnetAddresses = scallopAddress.getAddresses('testnet');
    const currentAddresses = scallopAddress.switchCurrentAddresses('testnet');
    if (ENABLE_LOG) {
      console.info('Id:', addressesId);
      console.info('Testnet Addresses', testnetAddresses);
      console.info('Current addresses', currentAddresses);
    }
    expect(testnetAddresses).toEqual(undefined);
    expect(!!currentAddresses).toBe(true);
    await scallopAddress.delete();
  });
});
