const path = require('path')

module.exports = {
  mode: 'development',
  entry: './src/app.ts',
  output: {
    filename: 'bundle.js',
    path: path.resolve(__dirname, 'dist'),
    publicPath: '/dist/',
  },
  devServer: {
    static: {
      directory: path.join(__dirname, '/'),
    },
  },

  // Enable sourcemaps for debugging webpack's output.
  devtool: 'source-map',

  resolve: {
    extensions: ['.webpack.js', '.web.js', '.ts', '.tsx', '.js', '.css'],
  },

  module: {
    rules: [
      { test: /\.tsx?$/, loader: 'ts-loader' },
      { test: /\.js$/, loader: 'source-map-loader' },
      {
        test: /\.css$/i,
        include: path.resolve(__dirname, 'src'),
        use: ['style-loader', 'css-loader', 'postcss-loader'],
      },
      { test: /\.(png|jpe?g|gif|jp2|webp)$/, type: 'asset/resource' },
    ],
  },
  optimization: {
    minimize: false,
  },
}
