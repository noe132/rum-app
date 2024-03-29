import React from 'react';
import { observer, useLocalObservable } from 'mobx-react-lite';
import Dialog from 'components/Dialog';
import { useStore } from 'store';
import * as ProfileModel from 'hooks/useDatabase/models/profile';
import useDatabase from 'hooks/useDatabase';
import Button from 'components/Button';
import Avatar from 'components/Avatar';
import { ObjectsFilterType } from 'store/activeGroup';
import sleep from 'utils/sleep';
import { lang } from 'utils/lang';
import AuthApi, { AuthType } from 'apis/auth';
import { IoMdAdd } from 'react-icons/io';
import InputPublisherModal from './InputPublisherModal';
import useActiveGroup from 'store/selectors/useActiveGroup';

interface IProps {
  authType: AuthType
  open: boolean
  onClose: () => void
}

const AuthList = observer((props: IProps) => {
  const { activeGroupStore, confirmDialogStore, snackbarStore } = useStore();
  const activeGroup = useActiveGroup();
  const groupId = activeGroup.group_id;
  const database = useDatabase();
  const state = useLocalObservable(() => ({
    fetched: false,
    users: [] as ProfileModel.IDBProfile[],
    showInputPublisherModal: false,
    get publisherSet() {
      return new Set(this.users.map((user) => user.publisher));
    },
  }));

  React.useEffect(() => {
    (async () => {
      const list = await (props.authType === 'follow_dny_list' ? AuthApi.getDenyList(groupId) : AuthApi.getAllowList(groupId)) || [];
      state.users = await Promise.all(
        list.map(async (item) =>
          ProfileModel.get(database, {
            groupId,
            publisher: item.Pubkey,
            useFallback: true,
          })),
      );
      state.fetched = true;
    })();
  }, []);

  const goToUserPage = async (publisher: string) => {
    props.onClose();
    await sleep(300);
    activeGroupStore.setPostsFilter({
      type: ObjectsFilterType.SOMEONE,
      publisher,
    });
  };

  const add = async (publisher: string) => {
    await AuthApi.updateAuthList({
      group_id: groupId,
      type: props.authType === 'follow_dny_list' ? 'upd_dny_list' : 'upd_alw_list',
      config: {
        action: 'add',
        pubkey: publisher,
        trx_type: ['post'],
        memo: '',
      },
    });
    const user = await ProfileModel.get(database, {
      groupId,
      publisher,
      useFallback: true,
    });
    await sleep(2000);
    state.users.push(user);
    await sleep(200);
    snackbarStore.show({
      message: lang.added,
      duration: 1000,
    });
  };

  const remove = (publisher: string) => {
    confirmDialogStore.show({
      content: lang.confirmToRemove,
      okText: lang.yes,
      ok: async () => {
        confirmDialogStore.setLoading(true);
        await AuthApi.updateAuthList({
          group_id: groupId,
          type: props.authType === 'follow_dny_list' ? 'upd_dny_list' : 'upd_alw_list',
          config: {
            action: 'remove',
            pubkey: publisher,
            trx_type: ['post'],
            memo: '',
          },
        });
        await sleep(2000);
        state.users = state.users.filter((user) => user.publisher !== publisher);
        confirmDialogStore.hide();
        await sleep(200);
        snackbarStore.show({
          message: lang.removed,
          duration: 1000,
        });
      },
    });
  };

  return (
    <div className="bg-white rounded-0 p-8">
      <div className="w-74 h-90">
        <div className="text-18 font-bold text-gray-700 text-center relative">
          {props.authType === 'follow_dny_list' ? lang.manageDefaultWriteMember : lang.manageDefaultReadMember}
          <div className="flex justify-center absolute right-[-4px] top-[5px]">
            <div
              className="relative text-blue-400 text-13 flex items-center cursor-pointer"
              onClick={() => {
                state.showInputPublisherModal = true;
              }}
            >
              <IoMdAdd className="text-16 mr-[2px]" />{lang.add}
            </div>
          </div>
        </div>
        <div className="mt-3">
          {state.users.map((user) => (
            <div
              className="py-3 px-4 flex items-center justify-between border-b border-gray-ec"
              key={user.publisher}
            >
              <div
                className="relative pl-[46px] cursor-pointer py-1"
                onClick={() => {
                  goToUserPage(user.publisher);
                }}
              >
                <Avatar
                  className="absolute top-0 left-0 cursor-pointer"
                  avatar={user.avatar}
                  size={36}
                />
                <div className="pt-1 max-w-[90px]">
                  <div className='text-gray-88 font-bold text-14 truncate'>
                    {user.name}
                  </div>
                </div>
              </div>
              {activeGroup.owner_pubkey === user.publisher && (
                <div className="w-18 flex justify-end">
                  <Button
                    size="mini"
                    disabled
                  >
                    {lang.owner}
                  </Button>
                </div>
              )}
              {activeGroup.owner_pubkey !== user.publisher && (
                <div className="w-18 flex justify-end">
                  <Button
                    size="mini"
                    outline
                    onClick={() => {
                      remove(user.publisher);
                    }}
                  >
                    {lang.remove}
                  </Button>
                </div>
              )}
            </div>
          ))}
          {state.users.length === 0 && (
            <div className="py-28 text-center text-14 text-gray-400 opacity-80">
              {lang.empty(lang.members)}
            </div>
          )}
        </div>
      </div>
      <InputPublisherModal
        title={props.authType === 'follow_dny_list' ? lang.addDefaultWriteMember : lang.addDefaultReadMember}
        open={state.showInputPublisherModal}
        submit={async (publisher) => {
          if (publisher) {
            if (state.publisherSet.has(publisher)) {
              snackbarStore.show({
                message: lang.duplicateMember,
                type: 'error',
              });
              return;
            }
            await add(publisher);
          }
          state.showInputPublisherModal = false;
        }}
      />
    </div>
  );
});

export default observer((props: IProps) => (
  <Dialog
    open={props.open}
    onClose={() => props.onClose()}
    hideCloseButton
    transitionDuration={300}
  >
    <AuthList {...props} />
  </Dialog>
));
