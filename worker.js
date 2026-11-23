/**
 * ZakFlow is a static single-page app: every route is a hash route, so the
 * Worker only has to serve the built files (and the SPA fallback for paths).
 */
export default {
  async fetch(request, env) {
    return env.ASSETS.fetch(request);
  },
};
