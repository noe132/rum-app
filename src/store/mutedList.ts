import ElectronCurrentNodeStore from 'store/electronCurrentNodeStore';

const MUTED_LIST_STORE_KEY = 'mutedList';

interface IBlock {
  groupId: string
  publisher: string
  timestamp: number
}

export function createMutedListStore() {
  return {
    mutedList: [] as IBlock[],

    init() {
      this.mutedList = (ElectronCurrentNodeStore.getStore().get(MUTED_LIST_STORE_KEY) || []) as IBlock[];
    },

    mute(options: {
      groupId: string
      publisher: string
    }) {
      this.mutedList.push({
        groupId: options.groupId,
        publisher: options.publisher,
        timestamp: Date.now(),
      });
      ElectronCurrentNodeStore.getStore().set(MUTED_LIST_STORE_KEY, this.mutedList);
    },

    unmute(options: {
      groupId: string
      publisher: string
    }) {
      this.mutedList = this.mutedList.filter((muted) => muted.groupId !== options.groupId && muted.publisher !== options.publisher);
      ElectronCurrentNodeStore.getStore().set(MUTED_LIST_STORE_KEY, this.mutedList);
    },
  };
}
