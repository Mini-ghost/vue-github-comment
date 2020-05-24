
<script lang="ts">
import Vue from 'vue';

export default Vue.extend({
  name: 'GtLoading',
  functional: true,
  props: {
    tag: {
      type: String,
      default: 'span',
    },
    fill: {
      type: String,
      default: '#808080',
    },
    size: {
      type: String,
      default: '40px',
    },
  },
  render(h, context) {
    let { staticClass } = context.data;
    staticClass = `${staticClass ? `${staticClass} gt-loading` : 'gt-loading'}`;
    return h(
      context.props.tag,
      {
        ...context.data,
        staticClass,
      },
      [
        h(
          'svg',
          {
            attrs: {
              xmlns: 'http://www.w3.org/2000/svg',
              width: context.props.size,
              height: context.props.size,
              viewBox: '0 0 50 50',
            },
          },
          [
            h(
              'path',
              {
                attrs: {
                  fill: context.props.fill,
                  d: 'M25.251,6.461c-10.318,0-18.683,8.365-18.683,18.683h4.068c0-8.071,6.543-14.615,14.615-14.615V6.461z',
                },
              },
              [
                h(
                  'animateTransform',
                  {
                    attrs: {
                      attributeName: 'transform',
                      type: 'rotate',
                      from: '0 25 25',
                      to: '360 25 25',
                      dur: '0.6s',
                      repeatCount: 'indefinite',
                    },
                  },
                ),
              ],
            ),
          ],
        ),
      ],
    );
  },
});
</script>
