<template>
  <div class="gt-avatar">
    <img
      class="gt-avatar__image"
      :src="src ? src + '&s=50' : defaultSrc"
      :alt="alt ? `@${alt}` : 'GitHub'"
      loading="lazy"
      @error=" src = defaultSrc"
    >
  </div>
</template>

<script lang="ts">
import { Component, Prop, Vue } from 'vue-property-decorator';

@Component<GtAvatar>({})
export default class GtAvatar extends Vue {
  @Prop({
    type: String,
    default: '//cdn.jsdelivr.net/npm/gitalk@1/src/assets/icon/github.svg',
  }) readonly defaultSrc!: string

  @Prop({ type: String, default: '' }) readonly src!: string
  @Prop({ type: String, default: '' }) readonly alt!: string
}
</script>

<style lang="scss">
.gt-avatar {
  display: inline-flex;
  width: 35px;
  height: 35px;
  border-radius: 3px;
  overflow: hidden;
  transition-property: width, height;
  transition-duration: .3s;
  @media (min-width: 768px) {
    width: 50px;
    height: 50px;
  }
  &__image {
    width: 100%;
    height: auto;
    object-fit: cover;
  }
}
</style>
