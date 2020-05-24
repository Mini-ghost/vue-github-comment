<template>
  <div class="gt-initing">
    <GtLoading />
    <p class="gt-initing__text">
      載入中
    </p>
  </div>
</template>
<script lang="ts">
import Vue from 'vue';
import GtLoading from '@/components/svg/GtLoading.vue';

export default Vue.extend({
  name: 'GtInit',
  components: {
    GtLoading,
  },
});
</script>
<style lang="scss">
.gt {
  &-initing {
    text-align: center;
  }
}
</style>
