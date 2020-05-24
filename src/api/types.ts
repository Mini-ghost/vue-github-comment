/* eslint-disable camelcase */

export interface IssueResponse {
  url: string;
  repository_url: string;
  labels_url: string;
  comments_url: string;
  events_url: string;
  html_url: string;
  id: number;
  node_id: string;
  number: number;
  title: string;
  user: User;
  labels: Label[];
  state: string;
  locked: boolean;
  assignee: any;
  assignees: any[];
  milestone: any;
  comments: number;
  created_at: string;
  updated_at: string;
  closed_at: any;
  author_association: string;
  body: string;
  closed_by: any;
}

/**
 * 使用者資訊
 * */
export interface User {
  login: string;
  id: number;
  node_id: string;
  avatar_url: string;
  gravatar_id: string;
  url: string;
  html_url: string;
  followers_url: string;
  following_url: string;
  gists_url: string;
  starred_url: string;
  subscriptions_url: string;
  organizations_url: string;
  repos_url: string;
  events_url: string;
  received_events_url: string;
  type: string;
  site_admin: boolean;
}

/**
 * 詳細使用者資訊
 */
export interface UserDetail extends User {
  name: string;
  company: string | null;
  blog: string | null;
  location: string | null;
  email: string | null;
  hireable: string | null;
  bio: string | null;
  public_repos: number;
  public_gists: number;
  followers: number;
  following: number;
  created_at: string;
  updated_at: string;
}

export interface Label {
  id: number;
  node_id: string;
  url: string;
  name: string;
  color: string;
  default: boolean;
  description: any;
}

/**
 * 令牌資訊
 * */
export interface TokenResponse {
  access_token: string;
  token_type: string;
  scope: string;
}

/**
 * 發送評論回應
 * */
export interface CommentsResponse {
  url: string;
  html_url: string;
  issue_url: string;
  id: number;
  node_id: string;
  user: User;
  created_at: string;
  updated_at: string;
  author_association: string;
  body_html: string;
  body_text: string;
  body: string;
  reactions: Reactions;
}

export interface Reactions {
  '+1': number;
  '-1': number;
  confused: number;
  eyes: number
  heart: number
  hooray: number
  laugh: number
  rocket: number
  // 這兩個用不到
  // total_count: number
  // url: string
}


// graphql types
export interface Issue {
  title: string;
  url: string;
  bodyHTML: string;
  createdAt: string;
  comments: Comments;
}

export interface Comments {
  totalCount: number;
  pageInfo: PageInfo;
  nodes: CommentsItem[];
}

export interface PageInfo {
  hasNextPage: boolean;
  hasPreviousPage: boolean;
  startCursor: string;
  endCursor: string;
}

export interface CommentsItem {
  id: string;
  databaseId: number;
  author: Author;
  bodyHTML: string;
  body: string;
  createdAt: string;
  /**
   * 使用者回饋
   * https://developer.github.com/v4/object/reactiongroup/
   */
  reactionGroups: ReactionGroup[];
}

export interface Author {
  avatarUrl: string;
  login: string;
  url: string;
}

export interface ReactionGroup {
  users: {
    totalCount: number;
  }
  content: string;
  viewerHasReacted: boolean;
}
