<template>
  <button
    class="gt__btn"
    :class="styleClass"
    v-on="$listeners"
  >
    <span>
      <slot />
    </span>

    <GtLoading
      v-if="isLoading"
      size="0.75rem"
      fill="#ffffff"
    />
  </button>
</template>

<script lang="ts">
import { Component, Prop, Vue } from 'vue-property-decorator';
import GtLoading from '@/components/svg/GtLoading.vue';

@Component<GtButton>({
  components: {
    GtLoading,
  },
})
export default class GtButton extends Vue {
  @Prop({ type: Boolean, default: false }) readonly isLoading!: boolean
  @Prop({ type: String, default: 'default' }) readonly type!: string

  get styleClass() {
    return `gt__btn--${this.type}`;
  }
}
</script>
<style lang="scss">
.gt__btn {
  display: inline-block;
  margin-left: 0.5rem;
  padding: .325rem .875rem;
  border: 1px solid #6190e8;
  border-radius: 3px;
  background-color: transparent;
  color: #6190e8;
  line-height: 1;
  cursor: pointer;
  user-select: none;
  &--primary {
    background-color: #6190e8;
    color: #fff;
  }
  & span {
    font-size: .75rem;
    vertical-align: middle;
    display: inline-block;
    margin: 0 2.5px;
  }
}
</style>
