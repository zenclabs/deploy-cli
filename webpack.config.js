const path = require("path");

const UglifyJsPlugin = require("uglifyjs-webpack-plugin");

module.exports = {
  entry: "./src/main.ts",
  devtool: "source-map",
  target: "node",
  node: {
    __dirname: true
  },
  module: {
    rules: [
      {
        test: /\.ts$/,
        use: "ts-loader",
        exclude: /node_modules/
      },
      {
        test: /\.js$/,
        use: ["remove-hashbag-loader"]
      }
    ]
  },
  resolveLoader: {
    alias: {
      "remove-hashbag-loader": path.join(
        __dirname,
        "./loaders/remove-hashbag-loader"
      )
    }
  },
  resolve: {
    extensions: [".ts", ".js"]
  },
  plugins: [
    new UglifyJsPlugin({
      sourceMap: true
    })
  ],
  output: {
    filename: "bundle.js",
    path: path.resolve(__dirname, "dist")
  }
};
