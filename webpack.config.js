const path = require('path');

module.exports = {
  target: 'node',
  mode: 'production',
  entry: './src_server/server.js', 
  output: {
    filename: 'server.js',
    path: path.resolve(__dirname, 'build_server'),
  },
};