const path = require("path");

module.exports = {
  publicPath: process.env.NODE_ENV === "production" ? "/" : "/",
  outputDir: path.resolve(__dirname, "../serverAdmin/public"),
  devServer: {
    proxy: {
      "/api": {
        target: "http://localhost:4000",
      },
    },
  },
};
