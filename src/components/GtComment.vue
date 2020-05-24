<template>
  <div
    class="gt-comment"
    :class="isAdmin ? 'gt-comment--admin' : 'gt-comment--customer'"
  >
    <GtAvatar
      :src="comment.user.avatar_url"
      :alt="comment.user.login"
    />
    <div class="gt-comment-content">
      <div class="gt-comment-header gt--fz-14">
        <!-- 評論人帳號 -->
        <a
          class="gt-comment-username"
          :href="comment.user.html_url"
          target="_blank"
          rel="nofollow noopener noreferrer"
        >
          {{ comment.user.login }}
        </a>
        <span class="gt-comment-date">
          {{ comment.created_at.replace(/\T|\Z/g, ' ') }}
        </span>
        <a
          v-if="enableEdit"
          class="gt-comment-edit gt--float-right"
          :href="comment.html_url"
          target="_blank"
          rel="nofollow noopener noreferrer"
        >
          編輯
        </a>
      </div>
      <div
        class="gt-comment-body markdown-body"
        v-html="comment.body_html"
      />
      <div class="gt-comment-footer gt--fz-14">
        <!-- https://developer.github.com/v3/reactions/ -->
        <span class="gt-comment-tools">
          <button
            class="gt-comment-tools__item"
            @click="() => emitReactions('heart')"
          >
            <GtSvg name="heart" />
            <span>
              {{ reactions.heart.count }}
            </span>
          </button>
          <button
            class="gt-comment-tools__item"
            @click="() => emitReactions('thumbs_up')"
          >
            <GtSvg name="thumbs_up" />
            <span>
              {{ reactions.thumbs_up.count }}
            </span>
          </button>
          <button
            class="gt-comment-tools__item"
            @click="() => emitReactions('thumbs_down')"
          >
            <GtSvg name="thumbs_down" />
            <span>
              {{ reactions.thumbs_down.count }}
            </span>
          </button>
          <button
            class="gt-comment-tools__item gt--float-right"
            @click="emitCommentReply"
          >
            <!-- 回應 -->
            <GtSvg name="reply" />
          </button>
        </span>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { Component, Prop, Vue } from 'vue-property-decorator';
import { IssueResponse } from '@/api/types';
import { ClientComments, ClientReactions } from '@/api';

import GtAvatar from './GtAvatar.vue';
import GtSvg from './svg/GtSvg.vue';

@Component<GtComment>({
  components: {
    GtAvatar,
    GtSvg,
  },
})
export default class GtComment extends Vue {
  @Prop({ type: Array, default: () => [] }) readonly admin!: string[]
  @Prop({ type: Object, required: true }) readonly comment!: ClientComments
  @Prop({ type: Object, default: () => null }) readonly user!: IssueResponse['user']

  get isAdmin() {
    return [...this.admin]
      .map((item) => item.toLowerCase())
      .indexOf(this.comment.user.login.toLowerCase()) !== -1;
  }

  /**
   * 可否編輯，
   * 登入使用者與該篇回應作者相同才可以修改
   */
  get enableEdit() {
    const { user, comment } = this;
    return user && comment.user.login === user.login;
  }

  get reactions() {
    return this.comment.reactions;
  }

  emitCommentReply() {
    this.$emit('reply', this.comment);
  }

  emitReactions(content: keyof ClientReactions) {
    // 如果沒登入就停止動作
    if (!this.user) { return; }
    this.$emit('reaction', {
      comment: this.comment,
      content,
    });
  }
}
</script>

<style lang="scss">
.gt-comment {
  display: flex;
  padding: .625rem 0;
  &-content {
    flex: 1;
    margin-left: .875rem;
    border-radius: 3px;
    overflow: auto;
    @media (min-width: 768px) {
      margin-left: 1rem;
    }
    &:hover {
      outline: 1px solid #f6f9fe
    }
  }
  &-header,
  &-body,
  &-footer {
    padding: .75rem 1rem;
  }
  &-header {
    border-bottom: 1px solid #e0f0ff;
  }
  &-body {
    word-wrap: break-word;
    & pre {
      overflow: auto;
    }
  }
  &-footer {
    border-top: 1px solid #e0f0ff;
  }
  &-tools {
    &__item {
      background-color: transparent;
      border: none;
    }
    &__item {
      display: inline-block;
      color: #6190e8;
      cursor: pointer;
      & svg,
      & span {
        display: inline-block;
        vertical-align: middle;
        margin: 0 1.25px;
      }
    }
    &__svg {
      fill: #6190e8;
      width: .875rem;
      height: .875rem;
    }
  }
  &-date {
    margin-left: 5px;
    color: #8f8f8f;
  }

  &--admin &-content {
    background-color: #f1f8ff;
  }
  &--customer &-content {
    background-color: #f6f8fa;
  }
}
</style>
