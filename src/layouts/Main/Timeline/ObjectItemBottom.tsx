import React from 'react';
import { observer, useLocalObservable } from 'mobx-react-lite';
import { FaRegComment, FaComment } from 'react-icons/fa';
import { IDbDerivedObjectItem } from 'hooks/useDatabase/models/object';
import { RiThumbUpLine, RiThumbUpFill } from 'react-icons/ri';
import Comment from './Comment';
import ago from 'utils/ago';
import { useStore } from 'store';
import Fade from '@material-ui/core/Fade';
import useSubmitLike from 'hooks/useSubmitLike';
import { LikeType } from 'apis/content';
import classNames from 'classnames';
import ContentSyncStatus from 'components/ContentSyncStatus';
import openTransferModal from 'standaloneModals/wallet/openTransferModal';
import { BiDollarCircle } from 'react-icons/bi';
import { Tooltip } from '@material-ui/core';
import ObjectMenu from '../ObjectMenu';
import OpenObjectEditor from './OpenObjectEditor';
import useDeleteObject from 'hooks/useDeleteObject';

interface IProps {
  object: IDbDerivedObjectItem
  inObjectDetailModal?: boolean
}

export default observer((props: IProps) => {
  const { object } = props;
  const { modalStore, activeGroupStore } = useStore();
  const state = useLocalObservable(() => ({
    showComment: props.inObjectDetailModal || false,
  }));
  const { profileMap } = activeGroupStore;
  const profile = profileMap[object.Publisher] || object.Extra.user.profile;
  const liked = (object.Extra.likedCount || 0) > (object.Extra.dislikedCount || 0);
  const likeCount = (object.Summary.likeCount || 0) - (object.Summary.dislikeCount || 0);
  const submitLike = useSubmitLike();
  const deleteObject = useDeleteObject();

  return (
    <div>
      <div className="pl-12 ml-1 flex items-center text-gray-88 leading-none text-12">
        <div
          className="text-12 tracking-wide cursor-pointer mr-[20px] mt-[-1px] opacity-80"
          onClick={() => {
            modalStore.objectDetail.show({
              objectTrxId: object.TrxId,
            });
          }}
        >
          {ago(object.TimeStamp)}
        </div>
        <div
          className={classNames(
            {
              'text-gray-33': state.showComment,
            },
            'flex items-center p-2 mr-3 cursor-pointer tracking-wide hover:text-gray-33 mt-[-1px]',
          )}
          onClick={() => {
            if (props.inObjectDetailModal) {
              return;
            }
            state.showComment = !state.showComment;
          }}
          data-test-id="timeline-object-comment-button"
        >
          <div className="text-16 mr-[6px] opacity-90">
            {state.showComment ? (
              <FaComment className="text-black opacity-60" />
            ) : (
              <FaRegComment />
            )}
          </div>
          {object.Summary.commentCount ? (
            <span className="mr-1">{object.Summary.commentCount}</span>
          )
            : '评论'}
        </div>
        <div
          className={classNames(
            {
              'text-gray-33': liked,
            },
            'flex items-center p-2 mr-5 cursor-pointer tracking-wide hover:text-gray-33',
          )}
          onClick={() => {
            submitLike({
              type: liked ? LikeType.Dislike : LikeType.Like,
              objectTrxId: object.TrxId,
            });
          }}
        >
          <div className="text-16 mr-[6px] opacity-90">
            {liked ? (
              <RiThumbUpFill className="text-black opacity-60" />
            ) : (
              <RiThumbUpLine />
            )}
          </div>
          {likeCount ? (
            <span className="mr-1">{likeCount || ''}</span>
          )
            : '赞'}
        </div>
        <Tooltip
          enterDelay={1000}
          enterNextDelay={1000}
          placement="right"
          title="打赏"
          arrow
        >
          <div
            className={classNames({
              'text-amber-500': (object.Extra.transferCount || 0) > 0,
            }, 'cursor-pointer text-18 mt-[-1px] opacity-80 hover:text-amber-500 hover:opacity-100 mr-7')}
            onClick={() => {
              openTransferModal({
                name: profile.name || '',
                avatar: profile.avatar || '',
                pubkey: object.Extra.user.publisher || '',
                uuid: object.TrxId,
              });
            }}
          >
            <BiDollarCircle />
          </div>
        </Tooltip>
        <div className="mt-[1px]">
          <ContentSyncStatus
            trxId={object.TrxId}
            status={object.Status}
            SyncedComponent={() => (
              <div className="mt-[-3px]">
                <ObjectMenu
                  object={object}
                  onClickUpdateMenu={() => {
                    OpenObjectEditor(object);
                  }}
                  onClickDeleteMenu={() => {
                    deleteObject(object.TrxId);
                  }}
                />
              </div>
            )}
            alwaysShow
          />
        </div>
      </div>
      {state.showComment && (
        <Fade in={true} timeout={500}>
          <div className="mt-4 pb-2">
            <Comment
              object={object}
              inObjectDetailModal={props.inObjectDetailModal}
            />
          </div>
        </Fade>
      )}
    </div>
  );
});
