import React from 'react';
import { observer, useLocalObservable } from 'mobx-react-lite';
import Button from 'components/Button';
import sleep from 'utils/sleep';
import useActiveGroup from 'store/selectors/useActiveGroup';
import UserApi from 'apis/user';
import ElectronCurrentNodeStore from 'store/electronCurrentNodeStore';
import { useStore } from 'store';
import { lang } from 'utils/lang';
import Loading from 'components/Loading';
import { shell } from 'electron';
import MVMApi, { ICoin } from 'apis/mvm';
import * as ethers from 'ethers';
import * as Contract from 'utils/contract';
import formatAmount from 'utils/formatAmount';
import openDepositModal from 'standaloneModals/wallet/openDepositModal';
import getKeyName from 'utils/getKeyName';
import KeystoreApi from 'apis/keystore';

const USER_PAID_FOR_GROUP_MAP_KEY = 'userPaidForGroupMap';
const USER_ANNOUNCED_RECORDS_KEY = 'userAnnouncedRecords';

export default observer(() => {
  const { snackbarStore, confirmDialogStore, nodeStore, notificationSlideStore } = useStore();
  const group = useActiveGroup();
  const groupId = group.group_id;
  const intGroupId = Contract.uuidToBigInt(groupId);
  const state = useLocalObservable(() => ({
    fetched: false,
    paying: false,
    userPaidForGroupMap: (ElectronCurrentNodeStore.getStore().get(USER_PAID_FOR_GROUP_MAP_KEY) || {}) as any,
    amount: '0',
    paid: false,
    rumSymbol: '',
    coins: [] as ICoin[],

    get transactionUrl() {
      return this.userPaidForGroupMap[groupId];
    },
    get coin() {
      return this.coins.find((coin) => coin.rumSymbol === state.rumSymbol)!;
    },
    gasLimit: ethers.BigNumber.from(1000000),
    gasPrice: ethers.BigNumber.from(0),
  }));

  React.useEffect(() => {
    (async () => {
      try {
        const res = await MVMApi.coins();
        state.coins = Object.values(res.data).filter((coin) => coin.rumSymbol !== 'RUM') as ICoin[];

        const contract = new ethers.Contract(Contract.PAID_GROUP_CONTRACT_ADDRESS, Contract.PAID_GROUP_ABI, Contract.provider);
        const groupDetail = await contract.getPrice(intGroupId);

        console.log(groupDetail);

        state.amount = formatAmount(ethers.utils.formatEther(groupDetail.amount));
        state.rumSymbol = state.coins.find((coin) => coin.rumAddress === groupDetail.tokenAddr)?.rumSymbol || '';

        const gasPrice = await Contract.provider.getGasPrice();
        state.gasPrice = gasPrice;

        const paid = await contract.isPaid(group.user_eth_addr, intGroupId);
        state.paid = paid;
        state.fetched = true;
        if (paid) {
          await announce(groupId);
        }
      } catch (e: any) {
        let message = e?.error?.reason || e?.error?.message || e?.message || lang.somethingWrong;
        if (e.body) {
          try {
            console.log(JSON.parse(e.body).error.message);
            message = JSON.parse(e.body).error.message;
          } catch {}
        }
        console.log(message);
        snackbarStore.show({
          message,
          type: 'error',
        });
      }
    })();
  }, []);

  const handlePay = async () => {
    state.paying = true;
    try {
      const contract = new ethers.Contract(Contract.PAID_GROUP_CONTRACT_ADDRESS, Contract.PAID_GROUP_ABI, Contract.provider);
      const paid = await contract.isPaid(group.user_eth_addr, intGroupId);
      if (paid) {
        await announce(groupId);
        state.paid = true;
        state.paying = false;
        return;
      }
      const erc20Contract = new ethers.Contract(state.coin.rumAddress, Contract.RUM_ERC20_ABI, Contract.provider);
      let balance = await erc20Contract.balanceOf(group.user_eth_addr);
      balance = ethers.utils.formatEther(balance);
      if (+state.amount > +balance) {
        confirmDialogStore.show({
          content: `您的余额为 ${balance} ${state.coin?.rumSymbol || ''}，不足 ${state.amount} ${state.coin?.rumSymbol || ''}`,
          okText: '去充值',
          ok: async () => {
            confirmDialogStore.hide();
            await sleep(300);
            openDepositModal({
              rumSymbol: state.rumSymbol,
            });
          },
        });
        state.paying = false;
        return;
      }
      const balanceWEI = await Contract.provider.getBalance(group.user_eth_addr);
      const balanceETH = ethers.utils.formatEther(balanceWEI);
      if (+ethers.utils.formatEther(state.gasLimit.mul(state.gasPrice)) > +balanceETH) {
        confirmDialogStore.show({
          content: `您的 RUM 不足 ${ethers.utils.formatEther(state.gasLimit.mul(state.gasPrice))}`,
          okText: '去充值',
          ok: async () => {
            confirmDialogStore.hide();
            await sleep(300);
            openDepositModal({
              rumSymbol: 'RUM',
            });
          },
        });
        state.paying = false;
        return;
      }
      confirmDialogStore.show({
        content: `确定支付 ${state.amount} ${state.coin?.rumSymbol || ''} 吗？`,
        ok: async () => {
          if (confirmDialogStore.loading) {
            return;
          }
          confirmDialogStore.setLoading(true);
          try {
            console.log(paid);
            const erc20Contract = new ethers.Contract(state.coin.rumAddress, Contract.RUM_ERC20_ABI, Contract.provider);
            const allowance = await erc20Contract.allowance(group.user_eth_addr, Contract.PAID_GROUP_CONTRACT_ADDRESS);
            console.log('get allownace done');
            if (parseInt(ethers.utils.formatEther(allowance), 10) < +state.amount) {
              console.log('approve start');
              const data = erc20Contract.interface.encodeFunctionData('approve', [
                Contract.PAID_GROUP_CONTRACT_ADDRESS,
                ethers.utils.parseEther(state.amount.toString()),
              ]);
              const [keyName, nonce, network] = await Promise.all([
                getKeyName(nodeStore.storagePath, group.user_eth_addr),
                Contract.provider.getTransactionCount(group.user_eth_addr, 'pending'),
                Contract.provider.getNetwork(),
              ]);
              if (!keyName) {
                console.log('keyName not found');
                return;
              }
              const { data: signedTrx } = await KeystoreApi.signTx({
                keyname: keyName,
                nonce,
                to: state.coin.rumAddress,
                value: '0',
                gas_limit: state.gasLimit.toNumber(),
                gas_price: state.gasPrice.toHexString(),
                data,
                chain_id: String(network.chainId),
              });
              console.log('signTx done');
              const approveTxHash = await Contract.provider.send('eth_sendRawTransaction', [signedTrx]);
              console.log('send done');
              await Contract.provider.waitForTransaction(approveTxHash);
              const receipt = await Contract.provider.getTransactionReceipt(approveTxHash);
              console.log('receit done');
              if (receipt.status === 0) {
                notificationSlideStore.show({
                  message: '支付失败',
                  type: 'failed',
                  link: {
                    text: '查看详情',
                    url: Contract.getExploreTxUrl(approveTxHash),
                  },
                });
                state.paying = false;
                confirmDialogStore.hide();
                return;
              }
              console.log('approve done');
            }
            console.log('pay start');
            const data = contract.interface.encodeFunctionData('pay', [
              intGroupId,
            ]);
            const [keyName, nonce, gasPrice, network] = await Promise.all([
              getKeyName(nodeStore.storagePath, group.user_eth_addr),
              Contract.provider.getTransactionCount(group.user_eth_addr, 'pending'),
              Contract.provider.getGasPrice(),
              Contract.provider.getNetwork(),
            ]);
            if (!keyName) {
              console.log('keyName not found');
              return;
            }
            const { data: signedTrx } = await KeystoreApi.signTx({
              keyname: keyName,
              nonce,
              to: Contract.PAID_GROUP_CONTRACT_ADDRESS,
              value: '0',
              gas_limit: state.gasLimit.toNumber(),
              gas_price: gasPrice.toHexString(),
              data,
              chain_id: String(network.chainId),
            });
            console.log('signTx done');
            const txHash = await Contract.provider.send('eth_sendRawTransaction', [signedTrx]);
            console.log('send done');
            await Contract.provider.waitForTransaction(txHash);
            confirmDialogStore.hide();
            notificationSlideStore.show({
              message: '正在支付',
              type: 'pending',
              link: {
                text: '查看详情',
                url: Contract.getExploreTxUrl(txHash),
              },
            });
            await Contract.provider.waitForTransaction(txHash);
            const receipt = await Contract.provider.getTransactionReceipt(txHash);
            console.log('receit done');
            if (receipt.status === 0) {
              notificationSlideStore.show({
                message: '支付失败',
                type: 'failed',
                link: {
                  text: '查看详情',
                  url: Contract.getExploreTxUrl(txHash),
                },
              });
            } else {
              notificationSlideStore.show({
                message: '支付成功',
                duration: 5000,
                link: {
                  text: '查看详情',
                  url: Contract.getExploreTxUrl(txHash),
                },
              });
              await announce(groupId);
              await sleep(400);
              state.userPaidForGroupMap[groupId] = Contract.getExploreTxUrl(txHash);
              ElectronCurrentNodeStore.getStore().set(USER_PAID_FOR_GROUP_MAP_KEY, state.userPaidForGroupMap);
              state.paid = true;
            }
          } catch (e: any) {
            confirmDialogStore.setLoading(false);
            let message = e?.error?.reason || e?.error?.message || e?.message || lang.somethingWrong;
            if (e.body) {
              try {
                console.log(JSON.parse(e.body).error.message);
                message = JSON.parse(e.body).error.message;
              } catch {}
            }
            console.log(message);
            if (message.includes('insufficient funds for gas * price + value')) {
              message = lang.insufficientRum;
            }
            snackbarStore.show({
              message,
              type: 'error',
            });
          }
        },
      });
    } catch (e: any) {
      let message = e?.error?.reason || e?.error?.message || e?.message || lang.somethingWrong;
      if (e.body) {
        try {
          console.log(JSON.parse(e.body).error.message);
          message = JSON.parse(e.body).error.message;
        } catch {}
      }
      console.log(message);
      snackbarStore.show({
        message,
        type: 'error',
      });
    }
    state.paying = false;
  };

  const announce = async (groupId: string) => {
    const announceRet = await UserApi.announce({
      group_id: groupId,
      action: 'add',
      type: 'user',
      memo: 'paid_group',
    });
    console.log({ announceRet });
    const userAnnouncedRecords = (ElectronCurrentNodeStore.getStore().get(USER_ANNOUNCED_RECORDS_KEY) || []) as any;
    userAnnouncedRecords.push(announceRet);
    ElectronCurrentNodeStore.getStore().set(USER_ANNOUNCED_RECORDS_KEY, userAnnouncedRecords);
  };

  if (!state.fetched) {
    return (<div className="pt-40 flex justify-center">
      <Loading />
    </div>);
  }

  return (
    <div className="mt-32 mx-auto">
      {+state.amount > 0 && state.rumSymbol && (
        <>
          <div
            className="text-gray-70 text-center text-16 leading-loose tracking-wide"
          >
            {lang.thisIsAPaidGroup}
            <br />
            {lang.payAndUse(+state.amount, state.coin?.rumSymbol || '')}
            <br />
            {lang.needSomeRum(ethers.utils.formatEther(state.gasLimit.mul(state.gasPrice)))}
          </div>

          <Button
            className="mx-auto block mt-4"
            onClick={handlePay}
            isDoing={state.paying}
            disabled={state.paid}
          >
            {state.paid ? lang.paidSuccessfully : lang.pay}
          </Button>
          {state.paid && (
            <div className="flex items-center mt-3 justify-center">
              {state.transactionUrl && (
                <div
                  className="text-12 text-blue-400 cursor-pointer mr-4"
                  onClick={() => {
                    shell.openExternal(state.transactionUrl);
                  }}
                >
                  {lang.paidTicket}
                </div>
              )}
              <div
                className="text-12 text-blue-400 cursor-pointer"
                onClick={async () => {
                  await announce(groupId);
                  snackbarStore.show({
                    message: lang.announced,
                  });
                }}
              >
                <span>
                  {lang.announceAgain}
                </span>
              </div>
            </div>
          )}
        </>
      )}
      {(+state.amount === 0 || !state.rumSymbol) && (
        <div
          className="text-gray-70 text-center text-16 leading-loose tracking-wide"
        >
          {lang.pleaseWaitAnouncePaidGroup}
        </div>
      )}
    </div>
  );
});
