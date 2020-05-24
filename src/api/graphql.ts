/* eslint-disable import/no-duplicates */
/* eslint-disable camelcase */
import type { VueGitalkOptions } from '@/types';
import type AxiosGitHub from '@/api';
import type { ClientComments, ClientReactions } from '@/api';
import type { Issue } from '@/api/types';

export interface Variables {
  owner: string;
  repo: string;
  id: number;
  pageSize: number;
  cursor: any
}

export const defaultAuthor = {
  avatarUrl: '//avatars1.githubusercontent.com/u/29697133?s=50',
  login: 'null',
  url: '',
};

export const queryComments = (
  vars: Variables,
  pagerDirection: Required<VueGitalkOptions>['pagerDirection'],
) => {
  const variables = JSON.parse(JSON.stringify(vars));
  const cursorDirection = pagerDirection === 'last' ? 'before' : 'after';
  const query = `
    getIssueAndComments(
      $owner: String!,
      $repo: String!,
      $id: Int!,
      $cursor: String,
      $pageSize: Int!
    ) {
      repository(owner: $owner, name: $repo) {
        issue(number: $id) {
          title
          url
          bodyHTML
          createdAt
          comments(${pagerDirection}: $pageSize, ${cursorDirection}: $cursor) {
            totalCount
            pageInfo {
              ${pagerDirection === 'last' ? 'hasPreviousPage' : 'hasNextPage'}
              ${cursorDirection === 'before' ? 'startCursor' : 'endCursor'}
            }
            nodes {
              id
              databaseId
              author {
                avatarUrl
                login
                url
              }
              bodyHTML
              body
              createdAt
              reactionGroups {
                viewerHasReacted
                users (first: 0) {
                  totalCount
                }
                content
              }
            }
          }
        }
      }
    }
  `;

  if (variables.cursor === null) {
    delete variables.cursor;
  }

  return {
    operationName: 'getIssueAndComments',
    query: `query ${query}`,
    variables,
  };
};

const enum ReactionContent {
  CONFUSED = 'confused',
  EYES = 'eyes',
  HEART = 'heart',
  HOORAY = 'hooray',
  LAUGH = 'laugh',
  ROCKET = 'rocket',
  THUMBS_DOWN = 'thumbs_down',
  THUMBS_UP = 'thumbs_up',
}

export function getCommentsV4(this: AxiosGitHub) {
  const { issue, cursor, comments: oldComments } = this;
  const {
    owner,
    repo,
    perPage,
    pagerDirection,
  } = this.options;

  return this.request().post<{ data: { repository: { issue: Issue } } }>(
    '/graphql',
    queryComments(
      {
        owner,
        repo,
        id: issue!.number,
        pageSize: perPage,
        cursor,
      },
      pagerDirection,
    ),
  ).then((res) => {
    const data = res.data.data.repository.issue.comments;
    const { hasPreviousPage, hasNextPage } = data.pageInfo;
    const items: ClientComments[] = data.nodes.map((node) => {
      const author = node.author || defaultAuthor;

      const reactions = {} as ClientReactions;

      // eslint-disable-next-line no-plusplus
      for (let i = 0, l = node.reactionGroups.length; i < l; i++) {
        const react = node.reactionGroups[i];
        const key = react.content.toLocaleLowerCase();
        reactions[key as keyof ClientReactions] = {
          count: react.users.totalCount,
          viewerHasReacted: react.viewerHasReacted,
        };
      }

      return {
        html_url:
          `https://github.com/${owner}/${repo}/issues/${issue!.number}#issuecomment-${node.databaseId}`,
        id: node.databaseId,
        node_id: node.id,
        user: {
          avatar_url: author.avatarUrl,
          login: author.login,
          html_url: author.url,
        },
        created_at: node.createdAt,
        body: node.body,
        body_html: node.bodyHTML,
        reactions,
      };
    });

    const comments = pagerDirection === 'last'
      ? [...items, ...oldComments]
      : [...oldComments, ...items];

    const isLoadOver = hasPreviousPage === false || hasNextPage === false;

    this.comments = comments;
    this.isLoadOver = isLoadOver;
    this.cursor = data.pageInfo.startCursor || data.pageInfo.endCursor;

    return this.comments;
  });
}

export interface ReactionQLOptions {
  node_id: ClientComments['node_id'];
  operationName: string;
  content: string;
}


const mutationQL = (options: ReactionQLOptions) => ({
  operationName: options.operationName,
  query: `
  mutation ${options.operationName} {
    ${options.operationName.replace(/^./, (s) => s.toLocaleLowerCase())} (
      input: {
        subjectId: "${options.node_id}",
        content: ${options.content.toLocaleUpperCase()}
      }
    ) {
      reaction {
        content
      }
    }
  }
  `,
});

export interface MutationReactionResponce {
  addReaction: AddReaction
}

export interface AddReaction {
  reaction: Reaction
}

export interface Reaction {
  content: string
}

export function mutationReaction(
  this: AxiosGitHub,
  options: ReactionQLOptions,
  callback: Function,
) {
  this.request().post<{ data: MutationReactionResponce }>(
    '/graphql',
    mutationQL(options),
  )
    .then(({ data: { data } }) => { callback(); });
}
