<script lang="ts">
import Vue from 'vue';

export default Vue.extend({
  name: 'VtSvg',
  functional: true,
  props: {
    name: {
      type: String,
      required: true,
    },
    title: {
      type: String,
      default: null,
    },
  },
  render(h, context) {
    return h(
      'svg',
      {
        ...context.data,
        staticClass: 'gt-comment-tools__svg',
      },
      [

        h('title', context.props.title || context.props.name),
        h('use', {
          attrs: {
            'xlink:href': `#vt-svg-${context.props.name}`,
          },
        }),
      ],
    );
  },
});
</script>
