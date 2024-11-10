const path = require('node:path');
const HtmlWebpackPlugin = require('html-webpack-plugin');

const generateHtmlPlugin = (filenameWithoutExtension) => new HtmlWebpackPlugin({
  filename: `${filenameWithoutExtension}.html`,
  template: `./src/${filenameWithoutExtension}.html`,

});

const populateHtmlPlugins = (pagesArray) => {
  const resultingPluginsArray = [];
  pagesArray.forEach((page) =>
    resultingPluginsArray.push(generateHtmlPlugin(page)));
  return resultingPluginsArray;
};

const pages = populateHtmlPlugins(['index']);

module.exports = {
  plugins: pages,
  output: {
    filename: 'main.js',
    path: path.resolve(__dirname, 'dist'),
    clean: true,
  },
  module: {
    rules: [
      {
        test: /\.css$/i,
        use: ['style-loader', 'css-loader'],
      },
      {
        test: /\.(png|svg|jpg|jpeg|gif)$/i,
        type: 'asset/resource',
      },
      {
        test: /\.(woff|woff2|eot|ttf|otf)$/i,
        type: 'asset/resource',
      },
      {
        test: /\.(?:js|mjs|cjs)$/,
        exclude: /node_modules/,
        use: {
          loader: 'babel-loader',
          options: {
            presets: [['@babel/preset-env', { targets: 'defaults' }]],
          },
        },
      },
    ],
  },
};
