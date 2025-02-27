'use client';

import React, { useState } from 'react';
import {
  Card,
  CardHeader,
  CardBody,
  CardFooter,
  Avatar,
  Chip,
  Button,
  Textarea,
  User,
  Spinner,
} from '@nextui-org/react';
import {
  BookmarkIcon,
  ChatBubbleIcon,
  ThickArrowDownIcon,
  ThickArrowUpIcon,
} from '@radix-ui/react-icons';
import { useMutation, useQuery } from '@tanstack/react-query';
import { baseUrl , endpointPrefix } from '@/lib/fetcher';
import { usePathname } from 'next/navigation';
import { useSession } from 'next-auth/react';

// MOCK 타입
interface PostProps {
  postingId: number;
  authorName: string;
  avatar: string;
  title: string;
  contents: string;
  votecounts: number;
}

// MOCK 타입
interface CommentProps
  {
  commentId: number;
  commenterUuid: string;
  commenterName: string; // TODO: API정의서에 없어서 백에 요청 필요
  childCoount: number;
  parentId: string;
  contents: string;
  avatar: string;  // MEMO: 댓글 작성자 프로필이미지 넣을지 여부 상의 필요
  }

interface PostType {
  authorUuid: string;
  voteCount: number;
  contents: string;
  title: string;
  userVoteId: number;
  withImage: boolean;
}

interface CommentPost {
  postingId: number;
  parentId?: number;
  commenterUuid: string;
  contents: string;
}

// {
//   "data": [
//        {
//              "id": number {댓글 id},
//               "viewInfo": {
//                  "contents": string {댓글 내용},
//                  "parentId": number {원댓글 id, 원댓글이라면 null},
//                  "childCount": number {대댓글 갯수, 대댓글이라면 null},
//                  "commenterUuid: string {댓글 작성자 uuid}
//              }
//        }, ...
//    ]
//   "message": "성공",
//   "code": "S001"
// }

// `https://652c497bd0d1df5273ef56a5.mockapi.io/api/v1/post/${postId}/comments` 데이터패칭 되는것을 확인한 MOCK API 주소

function Comments({ params } : { params : { parentId?: number } }) {

  const session = useSession();
  const path = usePathname()
  const postingId = Number(path.split('/')[6])
  const Uuid = session.data?.user?.uuid as string;

  const fetchCommentPostMutation = useMutation<any, any, CommentPost>((commentPost) => {
      return fetch(
        `https://tubeplus1.duckdns.org/api/v1/board-service/comments`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(commentPost),
        }).then((res) => res.json());
    }, {
      onSuccess: () => {
      },
      onError: () => {
      },
    });

    const fetchPostContents = async () => {
      const res = await fetch(`https://tubeplus1.duckdns.org/api/v1/board-service/postings/${postingId}?user-uuid=${Uuid}`,
        {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' },
        },
      );
      if (!res.ok) {
        throw new Error('Network response was not ok');
      }
      return res.json();
    };
  
    const {
      data : postcontents,
      error : isErrorPost,
      isLoading : isLoadingPost,
    } = useQuery(['posts', postingId], fetchPostContents);

  const fetchComments = async (parentId?: number) => {
    let url = `https://tubeplus1.duckdns.org/api/v1/board-service/comments?posting-id=${postingId}`;
    if (parentId) {
      url += `&parent-id=${parentId}`; // 대댓글 조회를 위한 parentId 추가
    }
  
    const res = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
      },
    });
    if (!res.ok) {
      throw new Error('Network response was not ok');
    }
    return res.json();
  };
  
  const {
    data: comments,
    isLoading: isLoadingComments,
    isError: isErrorComments,
  } = useQuery(['comments', params.parentId], () => fetchComments(params.parentId));

  const variants = ['flat', 'faded', 'bordered', 'underlined'];
  const postStyle = {
    margin: '0 50px', // 좌우 여백을 50px로 설정
  };
  const [isCommentView, setCommentView] = useState(false);

  if (isLoadingPost) {
    return <Spinner size='lg'/>;
  }

  if (isErrorPost) {
    return <span>Error!</span>;
  }

  const commentPost: CommentPost = {
    postingId: postingId,
    parentId: params.parentId,
    commenterUuid: Uuid,
    contents: 'contents',
  };

  console.log(postcontents)
  console.log(comments)

  return (
    <>
    <div className="pl-40 pt-10 pb-5">

    {/* TODO: 게시물 컴포넌트는 키값을 통해 불러오는식으로만 구성할지 페이지에 전체 코드를 구성할지 여부 결정 */}
    <Card style={postStyle}> 
      <CardHeader>
        <div className='flex flex-nowrap gap-[700px]'>
        <div className='flex flex-nowrap gap-4'>
        <Avatar src={postcontents.avatar} />
          <Chip color='default'> {postcontents.authorName} </Chip>
          <Chip color='default'> {postcontents.title} </Chip>
        </div>

              <div className="flex flex-nowrap items-center gap-4">
                <button>
                  <ThickArrowUpIcon className="w-8 h-8" />
                </button>
                  <b>{postcontents.votecounts}</b>
                <button>
                  <ThickArrowDownIcon className="w-8 h-8" />
                </button>
              </div>
            </div>
          </CardHeader>

          <CardBody className="h-[150px]">
            <div className="flex flex-nowrap gap-4 pl-3 pt-3">
              {postcontents.contents}
            </div>
          </CardBody>

          <CardFooter>
            <div className="border-t-2 w-full">
              <div className="flex pt-5 flex-nowrap gap-x-3">
                <ChatBubbleIcon className="w-8 h-8" />
                <Chip color="default"> Comment Count </Chip>

                <BookmarkIcon className="w-8 h-8" />
                <Chip color="default"> BookMark Count </Chip>
              </div>
            </div>
          </CardFooter>

          {/* 하단부 댓글 컴포넌트 */}

          {/* <form onSubmit={handleSubmit}> */}

          <div className="flex flex-nowrap pt-5 pl-5 pr-5 border-t-5">
            <div className="flex flex-nowrap gap-x-2">
              <Avatar />
              <div className="w-full grid grid-cols-12 gap-4">
                {/* {variants.map((variant) => ( */}
                <Textarea
                  // key={variant}
                  variant={'underlined'}
                  label="Username"
                  labelPlacement="outside"
                  placeholder="Enter your Comments"
                  className="col-span-10 md:col-span-6 mb-6 md:mb-0"
                  name='contents'
                ></Textarea>

                <div className="pt-6 pr-5">
                  <Button color="primary">Comments</Button>
                </div>
              </div>
            </div>
          </div>

          <div className="flex flex-nowrap gap-3 pl-7 pb-5 pr-6">
            <ChatBubbleIcon className="w-8 h-8" />
            <Textarea
              isReadOnly
              label={
                <User
                  name="Jane Doe"
                  description="Product Designer"
                  avatarProps={{
                    src: 'https://i.pravatar.cc/150?u=a04258114e29026702d',
                  }}
                />
              }
              variant="bordered"
              labelPlacement="outside"
              placeholder="Enter your description"
              defaultValue="NextUI is a React UI library that provides a set of accessible, reusable, and beautiful components."
              className="max-w-full"
            />
          </div>

          <div className="pl-7 pb-5">
            <Button
              onClick={() => setCommentView(!isCommentView)}
              color="primary"
              variant="light"
              size="sm"
            >
              {isCommentView ? 'Hide Comments' : 'View Comments'}
            </Button>
          </div>

          {isCommentView && (
            <div className="pb-3">
              {/* 여기에 받아온 댓글 데이터를 출력하는 코드를 작성합니다. */}

              {comments &&
                comments.map((comment: CommentProps) => {
                  return (
                    <div key={comment.commentId} className="pl-10 pr-6 pb-4">
                      <User
                        name={`${comment.commenterName}`}
                        description="Product Designer"
                        avatarProps={{
                          src: `${comment.avatar}`,
                        }}
                      />
                      {/* <ChatBubbleIcon className='w-7 h-7'/> */}
                      <Textarea
                        isReadOnly
                        label=""
                        variant="bordered"
                        labelPlacement="outside"
                        // placeholder=
                        className="max-w-full"
                        defaultValue={`${comment.contents}`}
                      />
                    </div>
                  );
                })}
            </div>
          )}
          {/* </form> */}
        </Card>
      </div>
    </>
  );
}
export default Comments;