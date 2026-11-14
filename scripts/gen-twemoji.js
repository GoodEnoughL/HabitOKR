/**
 * 生成 Twemoji 本地素材与映射：
 *   1. 精选分类 emoji（运动/学习/植物/娱乐/日常/食物健康）
 *   2. 用 twemoji 计算每个 emoji 的素材文件名（处理 ZWJ / 变异选择符）
 *   3. 从 jsDelivr(GitHub 镜像) 下载 72x72 PNG 到 src/assets/twemoji/
 *   4. 生成 src/assets/twemoji/index.ts：charToIcon / emojiImage(require 映射) / EMOJI_GROUPS
 * 运行：node scripts/gen-twemoji.js
 */
const fs = require('fs');
const path = require('path');
const https = require('https');
const twemoji = require('twemoji');

const CDN_BASE = 'https://cdn.jsdelivr.net/gh/twitter/twemoji@v14.0.2/assets/72x72/';
const OUT_DIR = path.join(__dirname, '..', 'src', 'assets', 'twemoji');

const EMOJI_GROUPS = [
  {
    key: 'sports',
    label: '运动',
    emojis: [
      '⚽', '🏀', '🏈', '⚾', '🎾', '🏐', '🏉', '🎱', '🏓', '🏸',
      '🏒', '🏑', '🥏', '🥍', '🥊', '🥋', '⛹️', '🚴', '🏋️', '🤸',
      '🏃', '⛷️', '🎣', '🤾', '🤽', '🚣', '🧗', '🏇', '🤺', '🛹',
      '🛷', '⛸️', '🥅', '🏹', '🎽', '🏂',
    ],
  },
  {
    key: 'study',
    label: '学习',
    emojis: [
      '📚', '📖', '📝', '✏️', '📒', '📓', '📕', '📗', '📘', '📙',
      '📔', '🖊️', '🖋️', '✒️', '🖌️', '🎓', '💻', '🖥️', '⌨️', '🖱️',
      '💡', '🔍', '🔬', '🔭', '📐', '📏', '🧮', '🎨', '🧠', '📜',
      '🗂️', '🗃️', '📁',
    ],
  },
  {
    key: 'nature',
    label: '植物自然',
    emojis: [
      '🌱', '🌿', '☘️', '🍀', '🌳', '🌴', '🌲', '🌵', '🌻', '🌷',
      '🌹', '🌸', '🌼', '🌺', '🥀', '🍁', '🍂', '🍃', '🌾', '🎋',
      '🍄', '🌵', '🌲',
    ],
  },
  {
    key: 'fun',
    label: '娱乐游戏',
    emojis: [
      '🎮', '🎲', '🎯', '🎳', '🎸', '🎹', '🎷', '🎺', '🎻', '🥁',
      '🎤', '🎧', '🎬', '🎭', '🃏', '🧩', '🎨', '🎪', '🎠', '🎡',
      '🎢', '🎥', '📷', '🎞️', '📽️',
    ],
  },
  {
    key: 'daily',
    label: '日常',
    emojis: [
      '☀️', '🌙', '⭐', '🛌', '🧹', '🚿', '🛁', '🚽', '💤', '🧘',
      '💪', '❤️', '💧', '🔥', '💰', '✨', '🌟', '💫', '🌈', '⛅',
      '☔', '❄️', '⌛', '⏰', '📅', '🗓️', '🧺', '🧻', '🔑', '🚪',
    ],
  },
  {
    key: 'food',
    label: '食物健康',
    emojis: [
      '🍎', '🍊', '🍋', '🍌', '🍉', '🍇', '🍓', '🫐', '🥝', '🥑',
      '🥕', '🥦', '🌽', '🥚', '🍳', '🥗', '🍜', '🍱', '🍙', '🍣',
      '☕', '🍵', '🥛', '🍞', '🧀', '🍗', '🍤', '🍰', '🍩', '🍪',
    ],
  },
  {
    key: 'common',
    label: '常用',
    emojis: [
      '⚔️', '🎵', '🎶', '😴', '🙋', '🤝', '💬', '📈', '📊', '🦷',
      '🚶', '🏌️', '🏄', '🛹', '🧾', '🪴', '🪷', '🪻', '⭐', '✨',
      '💤', '🗓️',
    ],
  },
];

function iconOf(char) {
  let found = null;
  twemoji.parse(char, { callback: (icon) => { if (found === null) found = icon; } });
  return found;
}

function fetch(url) {
  return new Promise((resolve, reject) => {
    const req = https.get(url, (res) => {
      if (res.statusCode === 200) {
        const chunks = [];
        res.on('data', (c) => chunks.push(c));
        res.on('end', () => resolve(Buffer.concat(chunks)));
      } else {
        res.resume();
        reject(new Error(`HTTP ${res.statusCode} for ${url}`));
      }
    });
    req.on('error', reject);
    req.setTimeout(20000, () => { req.destroy(new Error('timeout')); });
  });
}

async function main() {
  fs.mkdirSync(OUT_DIR, { recursive: true });

  // 0. 去重：组内去重 + 跨组只保留首次出现（避免 React key 重复）
  const seen = new Set();
  const groups = EMOJI_GROUPS.map((g) => {
    const local = new Set();
    const emojis = [];
    for (const ch of g.emojis) {
      if (local.has(ch) || seen.has(ch)) continue;
      local.add(ch);
      seen.add(ch);
      emojis.push(ch);
    }
    return { ...g, emojis };
  }).filter((g) => g.emojis.length > 0);

  // 1. 收集 char -> icon
  const charToIcon = {};
  const allChars = [];
  for (const g of groups) {
    for (const ch of g.emojis) {
      if (!allChars.includes(ch)) allChars.push(ch);
      if (charToIcon[ch]) continue;
      const icon = iconOf(ch);
      if (icon) charToIcon[ch] = icon;
      else console.warn(`[warn] no icon resolved for ${JSON.stringify(ch)}`);
    }
  }

  // 去重 icon 列表
  const icons = [...new Set(Object.values(charToIcon))];
  console.log(`Downloading ${icons.length} twemoji assets...`);

  const failed = [];
  for (let i = 0; i < icons.length; i++) {
    const icon = icons[i];
    const outPath = path.join(OUT_DIR, `${icon}.png`);
    if (fs.existsSync(outPath)) {
      process.stdout.write(`\r[${i + 1}/${icons.length}] cached ${icon}.png        `);
      continue;
    }
    let url = `${CDN_BASE}${icon}.png`;
    let buf = null;
    try {
      buf = await fetch(url);
    } catch (e) {
      // 重试：去掉末尾 -fe0f
      if (icon.endsWith('-fe0f')) {
        const alt = icon.slice(0, -'-fe0f'.length);
        try {
          buf = await fetch(`${CDN_BASE}${alt}.png`);
          // 成功则用 alt 作为文件名
          if (buf) {
            for (const ch of Object.keys(charToIcon)) {
              if (charToIcon[ch] === icon) charToIcon[ch] = alt;
            }
            fs.writeFileSync(path.join(OUT_DIR, `${alt}.png`), buf);
          }
        } catch (e2) { /* fall through */ }
      }
    }
    if (buf) {
      fs.writeFileSync(outPath, buf);
      process.stdout.write(`\r[${i + 1}/${icons.length}] ${icon}.png        `);
    } else {
      failed.push(icon);
      console.warn(`\n[fail] could not download ${icon}`);
    }
    await new Promise((r) => setTimeout(r, 60));
  }
  process.stdout.write('\n');

  // 剔除失败项
  const okIcons = new Set(fs.readdirSync(OUT_DIR).filter((f) => f.endsWith('.png')).map((f) => f.slice(0, -4)));
  const finalCharToIcon = {};
  for (const [ch, icon] of Object.entries(charToIcon)) {
    if (okIcons.has(icon)) finalCharToIcon[ch] = icon;
    else console.warn(`[warn] missing asset, dropping ${JSON.stringify(ch)} (${icon})`);
  }

  const finalGroups = groups.map((g) => ({
    key: g.key,
    label: g.label,
    emojis: g.emojis.filter((ch) => finalCharToIcon[ch]),
  })).filter((g) => g.emojis.length > 0);

  const lines = [];
  lines.push('// AUTO-GENERATED by scripts/gen-twemoji.js — do not edit by hand.');
  lines.push('export interface EmojiGroup { key: string; label: string; emojis: string[] }');
  lines.push('');
  lines.push('export const charToIcon: Record<string, string> = {');
  for (const [ch, icon] of Object.entries(finalCharToIcon)) {
    lines.push(`  ${JSON.stringify(ch)}: ${JSON.stringify(icon)},`);
  }
  lines.push('};');
  lines.push('');
  lines.push('export const emojiImage: Record<string, any> = {');
  const used = new Set();
  for (const icon of Object.values(finalCharToIcon)) {
    if (used.has(icon)) continue;
    used.add(icon);
    lines.push(`  ${JSON.stringify(icon)}: require('./${icon}.png'),`);
  }
  lines.push('};');
  lines.push('');
  lines.push('export const EMOJI_GROUPS: EmojiGroup[] = ' + JSON.stringify(finalGroups, null, 2) + ';');
  lines.push('');
  lines.push(`export const emojiCount = ${Object.keys(finalCharToIcon).length};`);
  lines.push('');

  fs.writeFileSync(path.join(OUT_DIR, 'index.ts'), lines.join('\n'), 'utf8');
  console.log(`\nDone: ${Object.keys(finalCharToIcon).length} emoji across ${finalGroups.length} groups.`);
  if (failed.length) console.log(`Failed downloads: ${failed.join(', ')}`);
}

main().catch((e) => { console.error(e); process.exit(1); });
