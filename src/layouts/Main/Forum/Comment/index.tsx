import React from 'react';
import { observer, useLocalObservable } from 'mobx-react-lite';
import Comments from './Comments';
import { useStore } from 'store';
import Editor from 'components/Editor';
import useDatabase from 'hooks/useDatabase';
import { IDBPost } from 'hooks/useDatabase/models/posts';
import * as CommentModel from 'hooks/useDatabase/models/comment';
import useSubmitComment from 'hooks/useSubmitComment';
import useSelectComment from 'hooks/useSelectComment';
import sleep from 'utils/sleep';
import { Fade } from '@mui/material';
import Loading from 'components/Loading';
import classNames from 'classnames';
import type { IDBComment } from 'hooks/useDatabase/models/comment';
import useActiveGroup from 'store/selectors/useActiveGroup';
import { lang } from 'utils/lang';
import { ISubmitObjectPayload } from 'hooks/useSubmitPost';
import IconReply from 'assets/reply.svg';

export interface ISelectedCommentOptions {
  comment: IDBComment
  scrollBlock: 'center' | 'start' | 'end'
  disabledHighlight?: boolean
}

interface IProps {
  post: IDBPost
  inObjectDetailModal?: boolean
  selectedCommentOptions?: ISelectedCommentOptions
  showInTop?: boolean
}

export default observer((props: IProps) => {
  const { commentStore, activeGroupStore } = useStore();
  const { commentsGroupMap } = commentStore;
  const activeGroup = useActiveGroup();
  const { post } = props;
  const comments = commentsGroupMap[post.id] || [];
  const draftKey = `COMMENT_DRAFT_${post.id}`;
  const state = useLocalObservable(() => ({
    value: localStorage.getItem(draftKey) || '',
    loading: false,
    order: CommentModel.Order.hot,
  }));
  const database = useDatabase();
  const submitComment = useSubmitComment();
  const selectComment = useSelectComment();

  React.useEffect(() => {
    (async () => {
      state.loading = true;
      await sleep(400);
      const comments = await CommentModel.list(database, {
        GroupId: activeGroupStore.id,
        postId: post.id,
        limit: 999,
        order: state.order,
        currentPublisher: activeGroup.user_pubkey,
      });
      commentStore.updateComments(comments);
      state.loading = false;
      const { selectedCommentOptions } = props;
      if (
        props.inObjectDetailModal
        && selectedCommentOptions
        && comments.length > 0
      ) {
        await sleep(10);
        selectComment(selectedCommentOptions.comment.id, {
          scrollBlock: selectedCommentOptions.scrollBlock,
          disabledHighlight: selectedCommentOptions.disabledHighlight,
          inObjectDetailModal: true,
        });
      } else if (props.showInTop) {
        await sleep(10);
        const commentsArea = document.querySelector('#comment-section');
        if (commentsArea) {
          commentsArea.scrollIntoView({
            block: 'start',
            behavior: 'smooth',
          });
        }
      }
    })();
  }, [state.order]);

  const submit = async (data: ISubmitObjectPayload) => {
    try {
      const comment = await submitComment({
        postId: post.id,
        content: data.content,
        image: data.image,
      }, {
        head: true,
      });
      if (comment) {
        selectComment(comment.id, {
          inObjectDetailModal: props.inObjectDetailModal,
        });
      }
      return true;
    } catch (_) {
      return false;
    }
  };

  const renderMain = () => {
    if (state.loading) {
      return (
        <Fade in={true} timeout={300}>
          <div className={props.inObjectDetailModal ? 'py-8' : 'py-2'}>
            <Loading />
          </div>
        </Fade>
      );
    }

    return (
      <div className="comment" id="comment-section">
        <div className="mt-[14px]">
          <div className="h-3 bg-gray-f7" />
          <div className="pt-6 py-5 px-8">
            <Editor
              editorKey={`comment_${post.id}`}
              profile={activeGroupStore.profile}
              minRows={2}
              placeholder={lang.publishYourComment}
              submit={submit}
              smallSize
              buttonClassName="transform scale-90"
              hideButtonDefault
              enabledImage
              imagesClassName='ml-12'
            />
          </div>
        </div>
        {comments.length > 0 && (
          <div className="h-3 bg-gray-f7" />
        )}
        {comments.length > 0 && (
          <div className="bg-white h-[50px] w-full flex items-center">
            <div
              className={classNames({
                'border-black text-black': state.order !== CommentModel.Order.desc,
                'border-transparent text-gray-9c': state.order === CommentModel.Order.desc,
              }, 'border-t-[5px] h-full w-37 flex items-center justify-center text-16 font-medium cursor-pointer')}
              onClick={() => {
                state.order = CommentModel.Order.hot;
              }}
            >
              {lang.hot}
            </div>
            <div
              className={classNames({
                'border-black text-black': state.order === CommentModel.Order.desc,
                'border-transparent text-gray-9c': state.order !== CommentModel.Order.desc,
              }, 'border-t-[5px] h-full w-37 flex items-center justify-center text-16 font-medium cursor-pointer')}
              onClick={() => {
                state.order = CommentModel.Order.desc;
              }}
            >
              {lang.latest}
            </div>
            <div className="grow flex items-center justify-end mr-5">
              <img className="mr-2" src={IconReply} alt="" />
              <span className="text-black text-16">{comments ? comments.length : 0}</span>
            </div>
          </div>
        )}
        {comments.length > 0 && (
          <div id="comments" className="mt-2.5">
            <Comments
              comments={comments}
              post={post}
              inObjectDetailModal={props.inObjectDetailModal}
              selectedComment={props.selectedCommentOptions?.comment}
            />
          </div>
        )}
      </div>
    );
  };

  return renderMain();
});
