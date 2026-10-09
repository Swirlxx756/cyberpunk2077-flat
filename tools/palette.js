#!/usr/bin/env node
/**
 * palette.js —— 打印主题当前配色使用情况，改色前后用它核对。
 *
 * 用法：
 *   node tools/palette.js             # 概览
 *   node tools/palette.js --ui        # 只看 UI 配色
 *   node tools/palette.js --syntax    # 只看语法高亮
 *   node tools/palette.js --find #37EBF3   # 查看某个颜色被用在哪
 */

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const THEME = path.join(ROOT, 'themes', 'cyberpunk2077-color-theme.json');

const strip = (s) => s.replace(/^\s*\/\/.*$/gm, '');
const theme = JSON.parse(strip(fs.readFileSync(THEME, 'utf8')));

const args = process.argv.slice(2);
const findArg = args.find((a) => a.startsWith('--find'));
const only = args.includes('--ui') ? 'ui' : args.includes('--syntax') ? 'syntax' : 'all';

const uiTheme = theme.colors || {};
const tokens = theme.tokenColors || [];

if (findArg) {
  const target = findArg.split('=')[1] || findArg.split(' ')[1];
  const q = target.trim().toUpperCase();
  console.log(`颜色 ${q} 的使用位置：\n`);
  console.log('[UI colors]');
  for (const [k, v] of Object.entries(uiTheme)) {
    if (String(v).toUpperCase().startsWith(q)) console.log(`  ${k}: ${v}`);
  }
  console.log('\n[tokenColors]');
  for (const t of tokens) {
    const f = t.settings && t.settings.foreground;
    if (f && String(f).toUpperCase().startsWith(q)) {
      console.log(`  ${t.name || JSON.stringify(t.scope)}: ${f}`);
    }
  }
  process.exit(0);
}

const count = (obj) => {
  const m = {};
  for (const v of Object.values(obj)) {
    if (typeof v === 'string' && v.startsWith('#')) {
      const base = v.slice(0, 7).toUpperCase();
      m[base] = m[base] || { total: 0, variants: new Set() };
      m[base].total += 1;
      if (v.length > 7) m[base].variants.add(v.toUpperCase());
    }
  }
  return m;
};

const print = (title, map) => {
  console.log(`\n${title}`);
  Object.entries(map)
    .sort((a, b) => b[1].total - a[1].total)
    .slice(0, 15)
    .forEach(([hex, info]) => {
      const extra = info.variants.size ? `  (+${info.variants.size} 个半透明变体)` : '';
      console.log(`  ${hex}  ×${String(info.total).padStart(2)}${extra}`);
    });
};

if (only !== 'syntax') {
  print('[UI 界面配色 top]', count(uiTheme));
}
if (only !== 'ui') {
  const tokenMap = {};
  for (const t of tokens) {
    const f = t.settings && t.settings.foreground;
    if (f) {
      const base = f.slice(0, 7).toUpperCase();
      tokenMap[base] = tokenMap[base] || { total: 0, variants: new Set() };
      tokenMap[base].total += 1;
    }
  }
  print('[语法高亮配色 top]', tokenMap);
}
console.log(`\n  colors 共 ${Object.keys(uiTheme).length} 项，tokenColors 共 ${tokens.length} 项`);
