<template>
  <div
    class="gt-container"
    :class="isInputFocused && 'gt-container--focused'"
  >
    <!-- 載入畫面 -->
    <GtInit v-if="isIniting" />
    <!-- 主要畫面 -->
    <template v-else>
      <div
        v-if="axiosGitHub.isNoInit"
        class="gt-noissue"
      >
        <p>尚未找到相關的 Issue</p>
        <p>請聯絡 {{ admin }} 初始化 Issue</p>
        <GtButton
          v-if="!user"
          type="primary"
          @click="handleLogin"
        >
          使用 GitHub 登入
        </GtButton>
      </div>
      <template v-else>
        <div class="gt-meta">
          <a
            :href="issueUrl"
            class="gt-meta__href"
            target="_blank"
          >
            {{ commentsCount }} 筆評論
          </a>
          <GtButton
            v-if="user"
            class="gt--float-right"
            @click="handleLogout"
          >
            登出
          </GtButton>
        </div>
        <!-- 主控台 -->
        <div class="gt-header">
          <GtAvatar
            class="gt-header-avatar"
            :src="user && user.avatar_url"
            :alt="user && user.login"
          />
          <div class="gt-header-comment">
            <textarea
              v-show="!isPreview"
              ref="textarea"
              v-model="value"
              class="gt-header-textarea"
              placeholder="寫點什麼"
              :disabled="isCreating"
              :style="textareaFixStyle"
              @focus="handleCommentFocus"
              @blur="handleCommentBlur"
              @keydown.13="handleCommentKeyDown"
            />
            <div
              v-show="isPreview"
              class="gt-header-preview markdown-body"
              v-html="previewHtml"
            />
            <div class="gt-header-controls">
              <a
                class="gt-header-controls__tip gt--fz-14"
                href="https://guides.github.com/features/mastering-markdown/"
                target="_blank"
                rel="nofollow noopener noreferrer"
              >
                支援 Markdown 語法
              </a>
              <!--  -->
              <GtButton
                v-if="user"
                :is-loading="isCreating"
                type="primary"
                class="gt--float-right"
                @click.prevent="handleCommentCreate"
              >
                發佈
              </GtButton>
              <GtButton
                class="gt--float-right"
                @click="handleCommentPreview"
              >
                {{ isPreview ? '編輯' : '預覽' }}
              </GtButton>
              <GtButton
                v-if="!user"
                type="primary"
                class="gt--float-right"
                @click="handleLogin"
              >
                使用 GitHub 登入
              </GtButton>
            </div>
          </div>
        </div>
        <!-- 顯示區 -->
        <div class="gt-comments">
          <GtSvgMap />
          <!-- 回應區塊 -->
          <GtComment
            v-for="comment in comments"
            :key="comment.node_id"
            :comment="comment"
            :user="user"
            :admin="options.admin"
            @reply="handleCommentReply"
            @reaction="handleReaction"
          />
          <div class="gt-comments-ctrl">
            <GtButton
              v-if="!isLoadOver"
              :is-loading="isLoadMore"
              type="primary"
              @click="handleCommentLoad"
            >
              載入更多
            </GtButton>
          </div>
        </div>
      </template>
    </template>
  </div>
</template>

<script lang="ts">
import 'github-markdown-css/github-markdown.css';
import { Component, Prop, Vue } from 'vue-property-decorator';

import { VueGitalkOptions } from '@/types';
import AxiosGitHub, { CONST, ClientComments, ClientReactions } from '@/api';
import { IssueResponse, CommentsResponse } from '@/api/types';

import GtInit from '@/components/GtInit.vue';
import GtAvatar from '@/components/GtAvatar.vue';
import GtButton from '@/components/GtButton.vue';
import GtSvgMap from '@/components/svg/GtSvgMap.vue';
import GtComment from '@/components/GtComment.vue';

@Component<VueGitalk>({
  components: {
    GtInit,
    GtAvatar,
    GtButton,
    GtSvgMap,
    GtComment,
  },
  mounted() {
    const storedComment = window.localStorage.getItem(CONST.GT_COMMENT);
    if (storedComment) {
      this.value = decodeURIComponent(storedComment);
      window.localStorage.removeItem(CONST.GT_COMMENT);
    }
  },
})
export default class VueGitalk extends Vue {
  @Prop({ type: Object, required: true }) readonly options!: VueGitalkOptions

  setting: Required<VueGitalkOptions> = Object.freeze({
    id: window.location.href,
    number: -1,
    labels: ['vue-github-comment'],
    title: window.document.title,
    body: window.location.href,
    perPage: 10,
    pagerDirection: 'last',
    createIssueManually: false,
    distractionFreeMode: false,
    proxy: 'https://cors-anywhere.herokuapp.com/https://github.com/login/oauth/access_token',
    enableHotKey: true,
    // 合併 props
    ...this.options,
  })

  /**
   * AxiosGitHub instance
   */
  axiosGitHub: AxiosGitHub = new AxiosGitHub(this.setting)

  /**
   * 我還不知道這是什麼
   */

  issue: any = null

  /**
   * textarea 輸入內容
   */
  value: string = ''

  /**
   * 預覽內容
   */
  previewHtml: string = ''

  /**
   * textarea 使否被 focus
   * 在 options.distractionFreeMode === false 時，永遠為 false
   */
  isInputFocused: boolean = false

  /**
   * 是否為預覽模式
   */
  isPreview: boolean = false

  /**
   * 排序方式 評論排序方式
   */
  pagerDirection:
    VueGitalkOptions['pagerDirection'] = this.setting.pagerDirection

  /**
   * 管理者名單
   */
  get admin() {
    return this.options.admin.map((admin) => `@${admin}`).join(' ');
  }

  /**
   * 初始化中
   */
  get isIniting() {
    return this.axiosGitHub.isIniting;
  }

  /**
   * 回應總數
   */
  get commentsCount() {
    return this.axiosGitHub.commentsCount;
  }

  get issueUrl() {
    const { issue } = this.axiosGitHub;
    return issue && issue.html_url;
  }

  get user(): IssueResponse['user'] | null {
    return this.axiosGitHub.user;
  }

  get comments(): ClientComments[] {
    const comments = [...this.axiosGitHub.comments];
    if (this.setting.pagerDirection === 'last' && this.user) {
      comments.reverse();
    }
    return comments;
  }

  get isLoadOver() {
    return this.axiosGitHub.isLoadOver;
  }

  get isLoadMore() {
    return this.axiosGitHub.isLoadMore;
  }

  get isCreating() {
    return this.axiosGitHub.isCreating;
  }

  /**
   * 依照行數計算 textarea 修正高度
   */
  get textareaFixStyle() {
    const row = this.value.split('\n').length;
    return row > 5
      ? {
        height: `${Math.min(row * 18, 240)}px`,
      }
      : null;
  }

  /** 登入 */
  handleLogin() {
    if (this.user) { return; }
    window.localStorage.setItem(
      CONST.GT_COMMENT,
      encodeURIComponent(this.value),
    );
    this.axiosGitHub.login();
  }

  /** 登出 */
  handleLogout() {
    if (!this.user) { return; }
    this.axiosGitHub.logout();
    this.axiosGitHub = new AxiosGitHub(this.setting);
  }

  /** 建立 Issue */
  handleIssueCreate() {
    this.axiosGitHub.getIssueCreate();
  }

  handleCommentFocus() {
    const { distractionFreeMode } = this.setting;
    if (!distractionFreeMode) { return; }
    this.isInputFocused = true;
  }

  handleCommentBlur() {
    this.isInputFocused = false;
  }

  /**
   * 快捷鍵送出
   */
  handleCommentKeyDown(e: KeyboardEvent) {
    const { enableHotKey } = this.setting!;
    if (enableHotKey && (e.metaKey || e.ctrlKey)) {
      this.handleCommentCreate();
    }
  }

  /**
   * 預覽
   */
  handleCommentPreview() {
    const { value } = this;
    if (!this.isPreview) {
      this.axiosGitHub.getCommentPreview(value)
        .then((res) => { this.previewHtml = res; });
    }
    this.isPreview = !this.isPreview;
    this.$nextTick(() => {
      (this.$refs.textarea as HTMLTextAreaElement).focus();
    });
  }

  handleCommentCreate() {
    if (!this.value.length) {
      return;
    }
    this.isPreview = false;
    this.previewHtml = '';
    this.axiosGitHub.createComment(this.value)
      .then(() => { this.value = ''; });
  }

  /**
   * 回應指定回應
   */
  handleCommentReply(comment: CommentsResponse) {
    const { value } = this;
    const replyCommentBody = comment.body;
    let replyCommentArray = replyCommentBody.split('\n');
    replyCommentArray.unshift(`@${comment.user.login}`);
    replyCommentArray = replyCommentArray.map((t) => `> ${t}`);
    replyCommentArray.push('');
    replyCommentArray.push('');
    if (value) replyCommentArray.unshift('');
    this.value += replyCommentArray.join('\n');

    this.$nextTick(() => {
      (this.$refs.textarea as HTMLTextAreaElement).focus();
    });
  }

  /**
   * 載入更多留言
   */
  handleCommentLoad() {
    this.axiosGitHub.getCommentLoad();
  }

  /**
   * 表情回應
   */
  handleReaction(
    data: {
      content: keyof ClientReactions,
      comment: ClientComments
    },
  ) {
    if (!this.user) { return; }
    this.axiosGitHub.postReaction(data);
  }

  getInit() {
    this.axiosGitHub.getInit();
  }
}
</script>

<style lang="scss">
%__border-box {
  box-sizing: border-box
}
.gt {
  &-container {
    &:after {
      content: '';
      position: fixed;
      top: 0%;
      left: 0%;
      right: 0%;
      bottom: 100%;
      background-color: black;
      transition: opacity .3s;
      opacity: 0;
      z-index: -1;
    }
    @extend %__border-box;
    *, *::before, *:after {
      @extend %__border-box;
    }
    & a {
      color: #6190e8;
      text-decoration: none;
    }
    & button {
      font-size: inherit;
    }
    &--focused {
      &:after {
        bottom: 0%;
        opacity: .75;
        z-index: 9998;
      }
    }
    &#{&}--focused .gt-header-comment {
      z-index: 9999;
    }
  }
  &-noissue {
    text-align: center;
  }
  &-meta {
    margin: 1rem 0;
    padding: 1rem 0;
    border-bottom: 1px solid #e9e9e9;
  }
  &-header {
    display: flex;
    &-comment {
      flex-grow: 1;
      flex-shrink: 1;
      flex-basis: 0%;
      margin-left: .875rem;
      @media (min-width: 768px) {
        margin-left: 1rem;
      }
    }
    &-textarea {
      box-sizing: border-box;
      padding: 0.75rem;
      display: block;
      width: 100%;
      min-height: 5.125rem;
      max-height: 15rem;
      border-radius: 5px;
      border: 1px solid rgba(black, .1);
      word-wrap: break-word;
      resize: none;
      background-color: #f6f6f6;
      -webkit-appearance: none;
    }
    &-preview {
      box-sizing: border-box;
      padding: 0.75rem;
      border: 1px solid rgba(black, .1);
      background-color: #f6f6f6;
      border-radius: 5px;
      word-wrap: break-word;
      min-height: 5.125rem;
    }
    &-controls {
      margin-top: 0.75rem;
      &:before,
      &:after {
        content: '';
        display: table;
      }
      &:after {
        clear: both;
      }
      &__tip {
        display: none;
        @media (min-width: 480px) {
          display: inline-block;
        }
      }
    }
  }
  &-comments {
    margin-top: 1.25rem;
    &-ctrl {
      padding: 1.25rem 0;
      text-align: center;
    }
  }

  // 通用樣式
  &--float-right {
    float: right;
  }
  &--fz-14 {
    font-size: 0.875rem;
  }
}
</style>
