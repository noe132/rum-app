import type { IContentItem } from 'rum-fullnode-sdk/dist/apis/content';
import { Store } from 'store';
import Database from 'hooks/useDatabase/database';
import { ContentStatus } from 'hooks/useDatabase/contentStatus';
import * as PostModel from 'hooks/useDatabase/models/posts';
import { PostType } from 'utils/contentDetector';
import { runInAction } from 'mobx';

interface IOptions {
  groupId: string
  objects: IContentItem[]
  store: Store
  database: Database
  isPendingObjects?: boolean
  clearEmptyTrx?: boolean
}

export default async (options: IOptions) => {
  const { database, groupId, objects, store } = options;
  const { latestStatusStore, relationStore, groupStore, activeGroupStore } = store;
  const latestStatus = latestStatusStore.map[groupId] || latestStatusStore.DEFAULT_LATEST_STATUS;

  const activeGroup = groupStore.map[activeGroupStore.id];
  const relations = relationStore.byGroupId.get(groupId) ?? [];
  const activeGroupMutedPublishers = activeGroup
    ? relations
      .filter((v) => v.from === activeGroup.user_pubkey && v.type === 'block' && !!v.value)
      .map((v) => v.to)
    : [];

  if (objects.length === 0) {
    return;
  }

  try {
    await database.transaction('rw', [database.posts], async () => {
      const items = objects.map((v) => ({
        content: v,
        activity: v.Data as any as PostType,
      }));
      const posts = await PostModel.bulkGet(
        database,
        items.map((v) => ({ id: v.activity.object.id, groupId })),
        { raw: true },
      );
      const postToPut: Array<PostModel.IDBPostRaw> = [];
      const postToAdd: Array<Omit<PostModel.IDBPostRaw, 'summary'>> = [];
      for (const item of items) {
        const id = item.activity.object.id;
        const existedPost = posts.find((v) => v.id === id);
        const dupePost = postToAdd.find((v) => v.id === id);
        if (dupePost) { continue; }
        if (existedPost) {
          const updateExistedPost = existedPost.status === ContentStatus.syncing
              && existedPost.publisher === item.content.SenderPubkey
              && existedPost.trxId === item.content.TrxId;
          if (updateExistedPost) {
            existedPost.status = ContentStatus.synced;
            postToPut.push(existedPost);

            if (activeGroupStore.id === existedPost.groupId && activeGroupStore.postMap[existedPost.id]) {
              activeGroupStore.markAsSynced(existedPost.id);
            } else {
              const cachedObject = activeGroupStore.getCachedObject(existedPost.groupId, existedPost.id);
              if (cachedObject) {
                runInAction(() => {
                  cachedObject.status = ContentStatus.synced;
                });
              }
            }
          }
          continue;
        }
        const images = item.activity.object.image
          ? [item.activity.object.image].flatMap((v) => v)
          : [];
        postToAdd.push({
          id,
          trxId: item.content.TrxId,
          name: item.activity.object.name ?? '',
          content: item.activity.object.content,
          timestamp: Number(item.content.TimeStamp),
          groupId,
          deleted: 0,
          history: [],
          publisher: item.content.SenderPubkey,
          status: ContentStatus.synced,
          images,
        });
      }
      const unreadCount = postToAdd.filter((v) => [
        v.timestamp > latestStatus.latestReadTimeStamp,
        !activeGroupMutedPublishers.includes(v.publisher),
      ].every((v) => !!v)).length;
      latestStatusStore.update(groupId, {
        unreadCount: latestStatus.unreadCount + unreadCount,
        latestPostTimeStamp: Math.max(latestStatus.latestPostTimeStamp, ...postToAdd.map((v) => v.timestamp)),
      });

      await PostModel.bulkAdd(database, postToAdd);
      await PostModel.bulkPut(database, postToPut);
    });
  } catch (e) {
    console.error(e);
  }
};
