import postcssImport from 'postcss-import';
import postcssNesting from 'postcss-nesting';
import autoprefixer from 'autoprefixer';
import cssnano from 'cssnano';

/** @type {import('postcss-load-config').Config} */
export default {
  plugins: [
    postcssImport(),
    postcssNesting(),
    autoprefixer(),
    ...(process.env.NODE_ENV === 'production' ? [cssnano({ preset: 'default' })] : [])
  ]
};
