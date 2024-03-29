import React from 'react';
import { createRoot } from 'react-dom/client';
import { action } from 'mobx';
import { observer, useLocalObservable } from 'mobx-react-lite';
import { Fade } from '@mui/material';
import { StoreProvider } from 'store';
import { ThemeRoot } from 'utils/theme';
import formatAmount from 'utils/formatAmount';
import Loading from 'components/Loading';
import MVMApi, { ICoin, INativeCoin } from 'apis/mvm';
import Navbar from './navbar';
import Balance from './balance';
import * as ethers from 'ethers';
import * as Contract from 'utils/contract';
import useActiveGroup from 'store/selectors/useActiveGroup';

export default () => {
  const div = document.createElement('div');
  document.body.append(div);
  const root = createRoot(div);
  const unmount = () => {
    root.unmount();
    div.remove();
  };
  root.render(
    <ThemeRoot>
      <StoreProvider>
        <MyWallet
          rs={() => {
            setTimeout(unmount, 3000);
          }}
        />
      </StoreProvider>
    </ThemeRoot>,
  );
};

interface Props {
  rs: () => unknown
}

const MyWallet = observer((props: Props) => {
  const activeGroup = useActiveGroup();
  const state = useLocalObservable(() => ({
    open: true,
    fetched: false,
    coins: [] as Array<ICoin | INativeCoin>,
    balanceMap: {} as Record<string, string>,
  }));

  const handleClose = action(() => {
    props.rs();
    state.open = false;
  });

  const fetchBalance = action(async () => {
    try {
      const { data } = await MVMApi.coins();
      const coins = Object.values(data);
      const balances = await Promise.all(coins.map(async (coin) => {
        if (coin.rumSymbol === 'RUM') {
          const balanceWEI = await Contract.provider.getBalance(activeGroup.user_eth_addr);
          return ethers.utils.formatEther(balanceWEI);
        }
        const contract = new ethers.Contract(coin.rumAddress, Contract.RUM_ERC20_ABI, Contract.provider);
        const balance = await contract.balanceOf(activeGroup.user_eth_addr);
        return ethers.utils.formatEther(balance);
      }));
      for (const [index, coin] of coins.entries()) {
        state.balanceMap[coin.rumSymbol] = formatAmount(balances[index]);
      }
      state.coins = coins.sort((a, b) => Number(state.balanceMap[b.rumSymbol] || 0) * Number(b.price_usd) - Number(state.balanceMap[a.rumSymbol] || 0) * Number(a.price_usd));
      state.fetched = true;
    } catch (err) {
      console.log(err);
    }
  });

  const manualFetchBalance = () => {
    state.fetched = false;
    fetchBalance();
  };

  React.useEffect(() => {
    fetchBalance();
    const timer = setInterval(fetchBalance, 10000);

    return () => {
      clearInterval(timer);
    };
  }, []);

  return (
    <Fade
      in={state.open}
      timeout={500}
      mountOnEnter
      unmountOnExit
    >
      <div
        className="flex flex-col items-stretch fixed inset-0 top-[40px] bg-gray-f7 z-50"
        data-test-id="my-wallet-modal"
      >
        <Navbar fetchBalance={manualFetchBalance} groupName={activeGroup.group_name} coins={state.coins} balanceMap={state.balanceMap} onClose={handleClose} />

        <div className="w-[960px] mx-auto mt-10">
          {!state.fetched && (
            <div className="pt-40 flex justify-center">
              <Loading />
            </div>
          )}
          {state.fetched && (
            <Balance coins={state.coins} balanceMap={state.balanceMap} />
          )}
          {state.fetched && (
            <div className="mt-16 text-gray-400 opacity-60 text-12">
              <div className="flex items-center justify-center">
                钱包地址: {activeGroup.user_eth_addr}
              </div>
            </div>
          )}

        </div>
      </div>
    </Fade>
  );
});
