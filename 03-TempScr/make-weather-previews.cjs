const fs = require('fs');
const path = require('path');

const root = 'C:/Users/mypra/Desktop/VibeCoding指南/skills测评项目/03-鹈鹕自行车测试';
const src = path.join(root, 'deepseekv4.1flash-10月5日-鹈鹕白天骑自行车动画.html');
const outDir = path.join(root, '02-TempFiles', 'pelican-shots');

const base = fs.readFileSync(src, 'utf8');

['sunny', 'cloudy', 'rainy'].forEach(function (weather) {
  let html = base.replace('data-weather="sunny"', 'data-weather="' + weather + '"');
  html = html.replace(
    'window.setInterval(function () {',
    'if (false) window.setInterval(function () {'
  );
  fs.writeFileSync(path.join(outDir, 'preview-' + weather + '.html'), html, 'utf8');
});

console.log('previews written');
