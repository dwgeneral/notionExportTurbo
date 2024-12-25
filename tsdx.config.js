module.exports = {
  rollup(config, options) {
    if (options.format === 'cjs') {
      config.output = {
        ...config.output,
        banner: '#!/usr/bin/env node\n',
      };
    }
    return config;
  },
};
