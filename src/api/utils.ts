/* eslint-disable import/prefer-default-export */

import type { ClientReactions, ClientComments } from '.';
import type { Reactions, CommentsResponse } from './types';

export function transReactions(reactions: Reactions): ClientReactions {
  return {
    thumbs_up: { count: reactions['+1'] },
    thumbs_down: { count: reactions['-1'] },
    confused: { count: reactions.confused },
    eyes: { count: reactions.eyes },
    heart: { count: reactions.heart },
    hooray: { count: reactions.hooray },
    laugh: { count: reactions.laugh },
    rocket: { count: reactions.rocket },
  };
}

export function transComment(comment: CommentsResponse): ClientComments {
  return {
    html_url: comment.html_url,
    id: comment.id,
    node_id: comment.node_id,
    user: {
      avatar_url: comment.user.avatar_url,
      login: comment.user.login,
      html_url: comment.user.html_url,
    },
    created_at: comment.created_at,
    body_html: comment.body_html,
    body: comment.body,
    reactions: transReactions(comment.reactions),
  };
}
