const tsConfigPaths = require('tsconfig-paths');
const path = require('path');

// Register tsconfig-paths with the compiled JavaScript
tsConfigPaths.register({
  baseUrl: path.join(__dirname, 'dist'),
  paths: {
    '@/*': ['*'],
    '@/config/*': ['config/*'],
    '@/services/*': ['services/*'],
    '@/controllers/*': ['controllers/*'],
    '@/middleware/*': ['middleware/*'],
    '@/types/*': ['types/*'],
    '@/utils/*': ['utils/*']
  }
}); 