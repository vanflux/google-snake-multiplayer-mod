const { ProgressPlugin, DefinePlugin } = require("webpack");

module.exports = {
  plugins: [
    new DefinePlugin({
      DEFAULT_SERVER_URL: JSON.stringify(process.env.DEFAULT_SERVER_URL || 'ws://127.0.0.1:8443'),
    }),
    new ProgressPlugin(),
  ],
}
