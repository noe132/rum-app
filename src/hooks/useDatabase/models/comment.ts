import type Database from 'hooks/useDatabase/database';
import { ContentStatus } from 'hooks/useDatabase/contentStatus';
import * as ProfileModel from 'hooks/useDatabase/models/profile';
import * as PostModel from 'hooks/useDatabase/models/posts';
import * as SummaryModel from 'hooks/useDatabase/models/summary';
import { bulkGetLikeStatus } from 'hooks/useDatabase/models/likeStatus';
import Dexie from 'dexie';

export interface IDBCommentRaw {
  id: string
  trxId: string
  groupId: string
  postId: string
  threadId: string
  replyTo: string
  name: string
  content: string
  images?: Array<{
    mediaType: string
    content: string
  }>
  deleted: 1 | 0
  history: Array<unknown>
  status: ContentStatus
  publisher: string
  timestamp: number
  summary: {
    hotCount: number
    commentCount: number
    likeCount: number
    dislikeCount: number
  }
}

export interface IDBComment extends IDBCommentRaw {
  extra: {
    user: ProfileModel.IDBProfile
    likeCount: number
    dislikeCount: number
    post: PostModel.IDBPost
    transferCount?: number
  }
}

export enum Order {
  asc,
  desc,
  hot,
}

export const DEFAULT_SUMMARY = {
  hotCount: 0,
  commentCount: 0,
  likeCount: 0,
  dislikeCount: 0,
};

export const bulkAdd = async (db: Database, comments: Omit<IDBCommentRaw, 'summary'>[]) => {
  const formattedComments = comments.map((comment) => ({
    ...comment,
    summary: DEFAULT_SUMMARY,
  }));
  await Promise.all([
    db.comments.bulkAdd(formattedComments),
  ]);
};

export const add = async (db: Database, comment: Omit<IDBCommentRaw, 'summary'>) => {
  await bulkAdd(db, [comment]);
};

interface BulkGet {
  (
    db: Database,
    data: Array<{ id: string, groupId: string }>,
    options: { raw: true, excludeDeleted?: boolean }
  ): Promise<Array<IDBCommentRaw>>
  (
    db: Database,
    data: Array<{ id: string, groupId: string }>,
    options?: { raw?: false, excludeDeleted?: boolean, noReplyComment?: boolean }
  ): Promise<Array<IDBComment>>
}

export const bulkGet: BulkGet = async (db, data, options): Promise<any> => {
  const comments = await db.comments
    .where(options?.excludeDeleted ? '[groupId+id+deleted]' : '[groupId+id]')
    .anyOf(data.map((v) => [
      v.groupId,
      v.id,
      ...options?.excludeDeleted ? [0] : [],
    ]))
    .toArray();
  return options?.raw
    ? comments
    : packComments(db, comments);
};

type GetCommentOptionCommon = { groupId: string, currentPublisher?: string, withObject?: boolean }
& ({ id: string } | { trxId: string });

interface GetComment {
  (db: Database, options: GetCommentOptionCommon & { raw: true }): Promise<IDBCommentRaw | null>
  (db: Database, options: GetCommentOptionCommon & { raw?: false }): Promise<IDBComment | null>
}

export const get: GetComment = async (db, options): Promise<any> => {
  const comment = await db.comments.get({
    groupId: options.groupId,
    ...'id' in options ? {
      id: options.id,
    } : {
      trxId: options.trxId,
    },
    deleted: 0,
  });
  if (!comment) {
    return null;
  }
  if (options.raw) {
    return comment;
  }
  const [result] = await packComments(db, [comment], {
    withObject: options.withObject,
    currentPublisher: options.currentPublisher,
  });
  return result;
};

export const put = async (db: Database, post: IDBComment | IDBCommentRaw) => {
  await bulkPut(db, [post]);
};

export const bulkPut = async (
  db: Database,
  posts: Array<IDBComment | IDBCommentRaw>,
) => {
  const normalizedPosts = posts.map((v) => {
    if ('extra' in v) {
      const { extra, ...u } = v;
      return u;
    }
    return v;
  });
  await db.comments.bulkPut(normalizedPosts);
};

export const list = async (
  db: Database,
  options: {
    GroupId: string
    postId: string
    limit: number
    currentPublisher?: string
    offset?: number
    order?: Order
  },
) => {
  const result = await db.transaction(
    'r',
    [
      db.posts,
      db.comments,
      db.counters,
      db.profiles,
      db.summary,
    ],
    async () => {
      let collection: Dexie.Collection<IDBCommentRaw, number>;
      if (options?.order === Order.desc) {
        collection = db.comments
          .where('[groupId+postId+timestamp]')
          .between(
            [options.GroupId, options.postId, Dexie.minKey],
            [options.GroupId, options.postId, Dexie.maxKey],
          )
          .reverse()
          .and((v) => !v.deleted);
      } else if (options?.order === Order.hot) {
        collection = db.comments
          .where('[groupId+postId+summary.hotCount]')
          .between(
            [options.GroupId, options.postId, Dexie.minKey],
            [options.GroupId, options.postId, Dexie.maxKey],
          )
          .reverse()
          .and((v) => !v.deleted);
      } else {
        collection = db.comments
          .where('[groupId+postId+deleted]')
          .equals([options.GroupId, options.postId, 0]);
      }
      const comments = await collection.toArray();
      if (comments.length === 0) {
        return [];
      }
      const result = await packComments(db, comments, {
        withSubComments: true,
        order: options.order,
        currentPublisher: options.currentPublisher,
      });

      return result;
    },
  );
  return result;
};

export const markedAsSynced = async (
  db: Database,
  data: { groupId: string, id: string },
) => {
  await db.comments.where(data).modify({
    Status: ContentStatus.synced,
  });
};

export const packComments = async (
  db: Database,
  comments: IDBCommentRaw[],
  options: {
    withSubComments?: boolean
    withObject?: boolean
    order?: Order
    currentPublisher?: string
    noReplyComment?: boolean
  } = {},
) => {
  const [users, posts, counterStatusList, transferCounts] = await Promise.all([
    ProfileModel.bulkGet(db, comments.map((comment) => ({
      groupId: comment.groupId,
      publisher: comment.publisher,
    }))),
    PostModel.bulkGet(db, comments.map((v) => ({ id: v.postId, groupId: v.groupId }))),
    options && options.currentPublisher
      ? bulkGetLikeStatus(db, comments.map((v) => ({
        groupId: v.groupId,
        objectId: v.id,
        publisher: options.currentPublisher!,
      })))
      : Promise.resolve([]),
    SummaryModel.getCounts(db, comments.map((comment) => ({
      GroupId: '',
      ObjectId: comment.id,
      ObjectType: SummaryModel.SummaryObjectType.transferCount,
    }))),
  ]);

  const items: Array<IDBComment> = await Promise.all(comments.map(async (comment, i) => {
    const user = users.find((v) => v.groupId === comment.groupId && v.publisher === comment.publisher)
      ?? await ProfileModel.getFallbackProfile(db, {
        groupId: comment.groupId,
        publisher: comment.publisher,
      });
    return {
      ...comment,
      extra: {
        user,
        transferCount: transferCounts[i] || 0,
        likeCount: options?.currentPublisher ? counterStatusList[i].likeCount : 0,
        dislikeCount: options?.currentPublisher ? counterStatusList[i].dislikeCount : 0,
        comments: [],
        post: posts.find((v) => v.id === comment.postId)!,
      },
    };
  }));

  return items;
};
