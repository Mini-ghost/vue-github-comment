<template>
  <div id="app">
    <VueGitalk :options="options" />
  </div>
</template>

<script lang="ts">
import { Component, Vue } from 'vue-property-decorator';
import { VueGitalkOptions } from '@/types';

const options: VueGitalkOptions = Object.freeze<VueGitalkOptions>({
  clientID: 'b5b84cdf97fce6a0a716',
  clientSecret: '814c82b7f95514d43366ba56f8954dea97118eef',
  owner: 'Mini-ghost',
  repo: 'vue-github-comment',
  admin: ['Mini-ghost'],
  distractionFreeMode: true,
  createIssueManually: false,
  pagerDirection: 'last',
});

@Component<App>({
  components: {
    VueGitalk: () => import(/* webpackChunkName: "vue-gitlak" */ './VueGitalk.vue'),
  },
})
export default class App extends Vue {
  options: VueGitalkOptions = options
}
</script>

<style lang="scss">
html {
  background-color: #efefef;
}
#app {
  font-family: 微軟正黑體;
  max-width: 768px;
  width: 95%;
  margin: 0 auto;
}
</style>
