import { ILikeItem, LikeType } from 'apis/content';
import { Store } from 'store';
import Database from 'hooks/useDatabase/database';
import * as LikeModel from 'hooks/useDatabase/models/like';
import * as ObjectModel from 'hooks/useDatabase/models/object';
import * as CommentModel from 'hooks/useDatabase/models/comment';
import { ContentStatus } from 'hooks/useDatabase/contentStatus';
import * as NotificationModel from 'hooks/useDatabase/models/notification';
import useSyncNotificationUnreadCount from 'hooks/useSyncNotificationUnreadCount';
import { keyBy } from 'lodash';
import { runInAction } from 'mobx';

interface IOptions {
  groupId: string
  objects: ILikeItem[]
  store: Store
  database: Database
}

export default async (options: IOptions) => {
  const { database, groupId, objects, store } = options;
  const { groupStore, activeGroupStore, commentStore } = store;
  const likes = objects;

  if (likes.length === 0) {
    return;
  }

  const db = database;

  await database.transaction(
    'rw',
    [
      database.likes,
      database.objects,
      database.comments,
      database.summary,
      database.comments,
      database.notifications,
      database.latestStatus,
    ],
    async () => {
      const activeGroup = groupStore.map[groupId] || {};
      const myPublicKey = (activeGroup || {}).user_pubkey;
      const trxIds = likes.map((like) => like.TrxId);
      const existLikes = await LikeModel.bulkGet(db, trxIds);
      const existLikeMap = keyBy(existLikes, (like) => like.TrxId);
      const likesToAdd = [] as LikeModel.IDbLikeItem[];
      const likesToPut = [] as LikeModel.IDbLikeItem[];

      for (const like of likes) {
        const existLike = existLikeMap[like.TrxId];

        if (existLike && existLike.Status !== ContentStatus.syncing) {
          continue;
        }

        if (existLike) {
          likesToPut.push({
            ...existLike,
            Status: ContentStatus.synced,
          });
        } else {
          likesToAdd.push({
            ...like,
            Content: {
              objectTrxId: like.Content.id,
              type: like.Content.type,
            },
            GroupId: groupId,
            Status: ContentStatus.synced,
          });
        }
      }

      if (likesToAdd.length > 0) {
        await LikeModel.bulkAdd(db, likesToAdd);
      }
      if (likesToPut.length > 0) {
        await LikeModel.bulkPut(db, likesToPut);
      }

      runInAction(() => {
        for (const like of likesToAdd) {
          const value = like.Content.type === LikeType.Like ? 1 : -1;
          const isMyself = activeGroup.user_pubkey === like.Publisher;
          if (activeGroupStore.id === groupId) {
            const object = activeGroupStore.objectMap[like.Content.objectTrxId];
            if (object) {
              object.likeCount = (object.likeCount || 0) + value;
              object.Extra.liked = isMyself && value === -1 ? false : object.Extra.liked;
            } else {
              const comment = commentStore.map[like.Content.objectTrxId];
              if (comment) {
                comment.likeCount = (comment.likeCount || 0) + value;
                comment.Extra.liked = isMyself && value === -1 ? false : comment.Extra.liked;
              }
            }
          } else {
            const object = activeGroupStore.getCachedObject(groupId, like.Content.objectTrxId);
            if (object) {
              object.likeCount = (object.likeCount || 0) + value;
              object.Extra.liked = isMyself && value === -1 ? false : object.Extra.liked;
            }
          }
        }
      });

      const [existObject, existComment] = await Promise.all([
        ObjectModel.checkExistForPublisher(db, {
          GroupId: groupId,
          Publisher: myPublicKey,
        }),
        CommentModel.checkExistForPublisher(db, {
          GroupId: groupId,
          Publisher: myPublicKey,
        }),
      ]);
      const shouldHandleNotification = existObject || existComment;
      if (shouldHandleNotification) {
        await tryHandleNotification(db, {
          store,
          groupId,
          likes: likesToAdd,
          myPublicKey,
        });
      }
    },
  );
};

const tryHandleNotification = async (db: Database, options: {
  store: Store
  groupId: string
  likes: LikeModel.IDbLikeItem[]
  myPublicKey: string
}) => {
  const { store, groupId, myPublicKey, likes } = options;
  const syncNotificationUnreadCount = useSyncNotificationUnreadCount(db, store);
  const likeMap = keyBy(likes, (like) => like.Content.objectTrxId);
  const trxIds = likes.filter((like) => like.Publisher !== myPublicKey && like.Content.type === LikeType.Like).map((like) => like.Content.objectTrxId);
  const [objects, comments] = await Promise.all([
    ObjectModel.bulkGet(db, trxIds, { raw: true }),
    CommentModel.bulkGet(db, trxIds),
  ]);
  const notifications = [];
  for (const object of objects) {
    if (object && object.Publisher === myPublicKey) {
      notifications.push({
        GroupId: object.GroupId,
        ObjectTrxId: object.TrxId,
        fromPublisher: likeMap[object.TrxId].Publisher,
        Type: NotificationModel.NotificationType.objectLike,
        Status: NotificationModel.NotificationStatus.unread,
      });
    }
  }
  for (const comment of comments) {
    if (comment && comment.Publisher === myPublicKey) {
      notifications.push({
        GroupId: comment.GroupId,
        ObjectTrxId: comment.TrxId,
        fromPublisher: likeMap[comment.TrxId].Publisher,
        Type: NotificationModel.NotificationType.commentLike,
        Status: NotificationModel.NotificationStatus.unread,
      });
    }
  }

  if (notifications.length > 0) {
    for (const notification of notifications) {
      await NotificationModel.create(db, notification);
    }
    await syncNotificationUnreadCount(groupId);
  }
};