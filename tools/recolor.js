#!/usr/bin/env node
/**
 * recolor.js —— Cyberpunk 2077 主题批量换色工具
 *
 * 背景：主题文件 themes/cyberpunk2077-color-theme.json 是 JSONC（含 // 注释），
 * 不能直接 JSON.parse，所以这里用文本替换的方式改色，从而完整保留注释与缩进。
 *
 * 用法：
 *   node tools/recolor.js                 # 按 tools/recolor-map.json 替换
 *   node tools/recolor.js --dry           # 只预览会改哪些行，不写文件
 *   node tools/recolor.js --exact         # 只替换完全一致的颜色（默认会把 #RRGGBBAA 一并换掉）
 *   node tools/recolor.js --section=colors        # 只改 UI 配色
 *   node tools/recolor.js --section=tokenColors   # 只改语法高亮
 *
 * 建议：改之前先 git commit 一次，改完用 git diff 复核。
 */

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const THEME = path.join(ROOT, 'themes', 'cyberpunk2077-color-theme.json');
const MAP = path.join(__dirname, 'recolor-map.json');

const args = process.argv.slice(2);
const dry = args.includes('--dry');
const exact = args.includes('--exact');
const sectionArg = args.find((a) => a.startsWith('--section='));
const section = sectionArg ? sectionArg.split('=')[1] : 'all';

if (!['all', 'colors', 'tokenColors'].includes(section)) {
  console.error('section 只支持 all | colors | tokenColors');
  process.exit(1);
}

if (!fs.existsSync(MAP)) {
  console.error('缺少映射文件 tools/recolor-map.json，请参考注释新建一个');
  process.exit(1);
}

/** 读取映射表，忽略 "_comment" 之类的说明字段 */
const rawMap = JSON.parse(
  fs.readFileSync(MAP, 'utf8').replace(/^\s*\/\/.*$/gm, '')
);
const colorMap = Object.entries(rawMap).filter(([k]) => k.startsWith('#'));

if (colorMap.length === 0) {
  console.error('映射表里没有找到任何 "#旧色": "#新色" 条目');
  process.exit(1);
}

console.log('待替换的颜色映射：');
for (const [from, to] of colorMap) console.log(`  ${from}  ->  ${to}`);
console.log(`范围：${section}${exact ? '（精确匹配）' : '（含透明度变体）'}\n`);

const source = fs.readFileSync(THEME, 'utf8');
const lines = source.split('\n');

/** 判断当前行属于哪个区块：用于 --section 过滤 */
let current = 'header';
const output = lines.map((line) => {
  const trimmed = line.trim();
  if (trimmed.startsWith('"colors"')) current = 'colors';
  else if (trimmed.startsWith('"tokenColors"')) current = 'tokenColors';

  // 注释行原样保留
  if (/^\s*\/\//.test(line)) return line;

  if (section !== 'all' && current !== section) return line;

  let result = line;
  for (const [from, to] of colorMap) {
    // 精确匹配：完整替换 hex（6 位或 8 位）
    const exactRe = new RegExp(`"${from}([0-9a-fA-F]{2})?"`, 'gi');
    // 前缀匹配：6 位 key 时连透明度后缀一起换，保留原 alpha
    const prefixRe = new RegExp(`"${from}([0-9a-fA-F]{2})?"`, 'gi');

    result = result.replace(exact ? exactRe : prefixRe, (m, alpha) => {
      return `"${to}${(!exact && alpha) || (exact && alpha) ? alpha : ''}"`;
    });
  }
  return result;
});

// 统计改动
const changed = [];
output.forEach((line, i) => {
  if (line !== lines[i]) changed.push({ n: i + 1, before: lines[i].trim(), after: line.trim() });
});

console.log(`共命中 ${changed.length} 行：`);
for (const c of changed.slice(0, 40)) {
  console.log(`  L${c.n}\n    - ${c.before}\n    + ${c.after}`);
}
if (changed.length > 40) console.log(`  ...（还有 ${changed.length - 40} 行）`);

if (dry) {
  console.log('\n[dry-run] 未写入文件');
} else if (changed.length > 0) {
  fs.writeFileSync(THEME, output.join('\n'), 'utf8');
  console.log(`\n已写入 ${path.relative(ROOT, THEME)}，请在 VS Code 里重载窗口查看效果`);
} else {
  console.log('\n没有发生任何替换');
}
