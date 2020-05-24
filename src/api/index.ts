/* eslint-disable camelcase */

import Axios, { AxiosInstance, AxiosRequestConfig } from 'axios';
import type {
  IssueResponse,
  TokenResponse,
  CommentsResponse,
  UserDetail,
} from '@/api/types';
import { transComment } from '@/api/utils';
import type { VueGitalkOptions } from '@/types';
import {
  getMetaContent,
  queryStringify,
  queryParse,
} from '@/utils';

import { getCommentsV4, mutationReaction } from '@/api/graphql';

export interface ClientComments {
  id: number
  node_id: string;
  user: ClientUser;
  created_at: string;
  html_url: string;
  body: string;
  body_html: string;
  reactions: ClientReactions;
}

export interface ClientUser {
  avatar_url: string
  login: string
  html_url: string
}

export interface ClientReactions {
  thumbs_up: ClientReactionsItem;
  thumbs_down: ClientReactionsItem;
  confused: ClientReactionsItem;
  eyes: ClientReactionsItem
  heart: ClientReactionsItem
  hooray: ClientReactionsItem
  laugh: ClientReactionsItem
  rocket: ClientReactionsItem
}

export type ClientReactionsKey =
  | 'thumbs_up'
  | 'thumbs_down'
  | 'confused'
  | 'eyes'
  | 'heart'
  | 'hooray'
  | 'laugh'
  | 'rocket'

export interface ClientReactionsItem {
  count: number
  viewerHasReacted?: boolean
}

export const enum CONST {
  GT_COMMENT = 'GT_COMMENT',
  GT_ACCESS_TOKEN = 'GT_ACCESS_TOKEN'
}

export default class AxiosGitHub {
  protected options!: Required<VueGitalkOptions>
  private static url: string = window.location.href

  /**
   * axios 本體
   */
  private axios: AxiosInstance = Axios.create({
    baseURL: 'https://api.github.com',
    headers: {
      Accept: 'application/json',
    },
  })

  /**
   * 送出的 Comments
   */

  private localComments: ClientComments[] = []

  /**
   * 使用者資料
   */
  public user: IssueResponse['user'] | null = null

  /**
   * 還不知道這是什麼
   */
  public cursor: string | null = null

  /**
   * 評論清單
   */
  public comments: ClientComments[] = []
  public issue: IssueResponse | null = null
  public page = 1

  /** 是否已經初始化 */
  public isNoInit = false
  /** 是否正在初始化 */
  public isIniting = true
  /** 是否正在載入留言 */
  public isLoadMore = false
  /** 是否正在新增回應 */
  public isCreating = false
  /** 是否已載入所有留言 */
  public isLoadOver = false
  /** issue 建立請求中 */
  public isIssueCreating = false

  constructor(options: Required<VueGitalkOptions>) {
    this.options = options;

    const query = queryParse();
    if (query.code) {
      const { origin, pathname, hash } = window.location;
      const { code } = query;
      delete query.code;
      const replacedUrl = origin + pathname + queryStringify(query) + hash;

      // 改寫路由紀錄
      window.history.replaceState(null, '', replacedUrl);

      // 取得 Token
      this.getToken(code);

      AxiosGitHub.url = replacedUrl;
    } else {
      this.getInit()
        .then(() => {})
        .catch((error: any) => {
          // this.setState({
          //   isIniting: false,
          //   isOccurError: true,
          //   errorMsg: formatErrorMsg(err),
          // });
        })
        .finally(() => { this.isIniting = false; });
    }
  }

  public static get accessToken() {
    return window.localStorage.getItem(CONST.GT_ACCESS_TOKEN) || undefined;
  }

  public static set accessToken(token) {
    if (!token) {
      window.localStorage.removeItem(CONST.GT_ACCESS_TOKEN);
      return;
    }
    window.localStorage.setItem(CONST.GT_ACCESS_TOKEN, token);
  }

  public get isAdmin() {
    const { admin } = this.options!;
    const { user } = this;
    return !!user && [...admin]
      .map((item) => item.toLowerCase())
      .indexOf(user.login.toLowerCase()) !== -1;
  }

  public get loginLink() {
    const githubOauthUrl = 'https://github.com/login/oauth/authorize';
    const { clientID } = this.options!;
    const query = {
      client_id: clientID,
      redirect_uri: window.location.href,
      scope: 'public_repo',
    };
    return `${githubOauthUrl}?${queryStringify(query)}`;
  }

  /**
   * 計算回應總數
   */
  public get commentsCount(): number {
    const { issue, localComments } = this;
    return (issue ? issue.comments : 0) + localComments.length;
  }

  /**
   * interceptors
   */
  private interceptors(this: this, config: AxiosRequestConfig) {
    return AxiosGitHub.accessToken
      ? {
        ...config,
        headers: {
          ...config.headers,
          Authorization: `bearer ${AxiosGitHub.accessToken}`,
        },
      }
      : config;
  }

  /**
   * 發出請求本體
   * */
  protected request() {
    this.axios.interceptors.request.use(this.interceptors.bind(this));
    return this.axios;
  }

  /**
   * 初始化
   */
  public getInit() {
    return this.getUserInfo()
      .then(() => this.getIssue())
      .then(() => this.getComments());
  }

  /**
   * 取得使用者資訊
   */
  public getUserInfo() {
    if (!AxiosGitHub.accessToken) {
      return new Promise((resolve) => resolve());
    }
    return this.request().get<UserDetail>('/user')
      .then(({ data }) => { this.user = data; });
  }

  /**
   * 取得對應的 Issue
   */
  private getIssue() {
    const { issue } = this;
    const { number } = this.options;

    // 防止重複呼叫
    if (issue) {
      return Promise.resolve(issue);
    }

    // 如果有設定編號以編號為主
    if (typeof number === 'number' && number > 0) {
      return this.getIssueById().then((res) => {
        if (!res) return this.getIssueByLabels();
        return res;
      });
    }
    return this.getIssueByLabels();
  }

  /**
   * 依照選定 options.id 撈取 Issue
   */
  private getIssueByLabels() {
    const {
      owner,
      repo,
      id,
      labels,
      clientID,
      clientSecret,
    } = this.options;
    let isNoInit = false;

    return this.request().get<IssueResponse[]>(
      `/repos/${owner}/${repo}/issues`,
      {
        auth: {
          username: clientID,
          password: clientSecret,
        },
        params: {
          labels: labels.concat(id).join(','),
          t: Date.now(),
        },
      },
    )
      .then(({ data }) => {
        if (!(data && data.length)) {
          // 如果有設定 createIssueManually === true
          // 並且為管理員
          if (!this.options.createIssueManually && this.isAdmin) {
            return this.createIssue();
          }
          isNoInit = true;
        } else {
          // eslint-disable-next-line prefer-destructuring
          this.issue = data[0];
        }

        this.isNoInit = isNoInit;
        return this.issue;
      });
  }

  /**
   * 依照選定 options.number 撈取 Issue
   * */
  public getIssueById() {
    const {
      owner,
      repo,
      number,
      clientID,
      clientSecret,
    } = this.options;

    return this.request().get<IssueResponse>(
      `/repos/${owner}/${repo}/issues/${number}`,
      {
        auth: {
          username: clientID,
          password: clientSecret,
        },
        params: {
          t: Date.now(),
        },
      },
    )
      .then(({ data }) => {
        if (data && data.number === number) {
          this.issue = data;
          this.isNoInit = false;
        }
        return this.issue;
      });
  }

  private getComments() {
    if (!this.issue) return Promise.reject();
    // Get comments via v4 graphql api,
    // login required and sorting feature is available
    if (AxiosGitHub.accessToken) return getCommentsV4.bind(this)();
    return this.getCommentsV3();
  }

  private getCommentsV3() {
    const { page } = this;
    const { clientID, clientSecret, perPage } = this.options;
    return this.getIssue()
      .then((issues) => {
        if (!issues) return Promise.reject();

        return this.request().get<CommentsResponse[]>(
          issues.comments_url,
          {
            headers: {
              Accept: 'application/vnd.github.v3.full+json,application/vnd.github.v3.html+json,application/vnd.github.squirrel-girl-preview',
            },
            auth: {
              username: clientID,
              password: clientSecret,
            },
            params: {
              per_page: perPage,
              page,
            },
          },
        )
          .then(({ data }) => {
            const { comments: oldComments, issue } = this;
            const comments = oldComments.concat(data.map(transComment));
            let isLoadOver = false;

            if (comments.length >= issue!.comments || data.length < perPage) {
              isLoadOver = true;
            }

            this.comments = comments;
            this.isLoadOver = isLoadOver;
            this.page = page + 1;

            return this.comments;
          });
      });
  }

  /**
   * 取得 Token
   */
  private getToken(code: string) {
    return this.request().post<TokenResponse>(
      this.options.proxy,
      {
        code,
        client_id: this.options.clientID,
        client_secret: this.options.clientSecret,
      },
    ).then(({ data }) => {
      if (data && data.access_token) {
        AxiosGitHub.accessToken = data.access_token;
        this.getInit()
          .then(() => { })
          .catch((error: any) => {
            // this.setState({
            //   isIniting: false,
            //   isOccurError: true,
            //   errorMsg: formatErrorMsg(err)
            // })
          })
          .finally(() => { this.isIniting = false; });
      } else {
        // no access_token
        // this.setState({
        //   isOccurError: true,
        //   errorMsg: formatErrorMsg(new Error('no access token'))
        // })
      }
    }).catch((error) => {
      //
    });
  }

  /**
   * 登入
   */
  public login() {
    window.location.href = this.loginLink;
  }

  /**
   * 登出
  */
  public logout() {
    this.user = null;
    AxiosGitHub.accessToken = undefined;
  }

  /**
   * 建立 issue
   */
  public createIssue() {
    const {
      owner,
      repo,
      title,
      body,
      id,
      labels,
    } = this.options;
    return this.request().post<IssueResponse>(
      `/repos/${owner}/${repo}/issues`,
      {
        title,
        labels: labels.concat(id),
        body: body || `
          ${AxiosGitHub.url} \n\n ${getMetaContent('description') || ''}
        `,
      },
    ).then(({ data }) => {
      this.issue = data;
      return this.issue;
    });
  }

  /**
   * 預覽回應內容
   */
  public getCommentPreview(comment: string) {
    if (!comment) {
      return Promise.resolve(comment);
    }
    return this.request().post<string>(
      '/markdown',
      {
        text: comment,
      },
    )
      .then((res) => res.data);
  }

  /**
   * 載入更多留言
   */
  public getCommentLoad() {
    if (this.isLoadMore) return Promise.resolve(true);
    this.isLoadMore = true;
    return this.getComments()
      .then(() => true)
      .catch(() => false)
      .finally(() => { this.isLoadMore = false; });
  }

  /**
   * 發送回應
   * @param comment
   */
  public createComment(comment: string) {
    this.isCreating = true;
    return this.getIssue()
      .then((issue) => {
        this.request().post<CommentsResponse>(
          issue!.comments_url,
          {
            body: comment,
          },
          {
            headers: {
              Accept: 'application/vnd.github.v3.html+json,application/vnd.github.squirrel-girl-preview',
            },
          },
        )
          .then(({ data }) => {
            const { pagerDirection } = this.options;
            const newComments = { ...transComment(data), body: comment };

            // 如果是 last 模式
            // 或是已經把所有頁數都展開
            // 就把評論合併進去
            if (
              pagerDirection === 'last'
              || this.issue!.comments <= this.comments.length
            ) {
              this.comments = [...this.comments, newComments];
            }

            this.localComments = [...this.localComments, newComments];

            this.isCreating = false;
          });
      });
  }

  /**
   * 建立 Issue
   */
  public getIssueCreate() {
    this.isIssueCreating = true;
    this.createIssue()
      .finally(() => {
        this.isIssueCreating = false;
        this.isNoInit = true;
      });
  }

  public postReaction(
    data: {
      content: keyof ClientReactions,
      comment: ClientComments
    },
  ) {
    if (!this.user) return;
    const { comment, content } = data;
    const contentObj = comment.reactions[content];
    const operationName = contentObj.viewerHasReacted
      ? 'RemoveReaction'
      : 'AddReaction';
    mutationReaction.bind(this)({
      node_id: comment.node_id,
      operationName,
      content,
    },
    () => {
      if (contentObj.viewerHasReacted as boolean) {
        contentObj.count -= 1;
      } else {
        contentObj.count += 1;
      }

      // 切換狀態
      contentObj.viewerHasReacted = !contentObj.viewerHasReacted;
    });
  }
}
