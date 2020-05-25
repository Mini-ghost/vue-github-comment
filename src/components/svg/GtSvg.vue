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
            // 修正過時語法
            // https://developer.mozilla.org/en-US/docs/Web/SVG/Attribute/xlink:href#use
            href: `#vt-svg-${context.props.name}`,
          },
        }),
      ],
    );
  },
});
</script>
