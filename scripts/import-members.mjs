/**
 * 会員一括インポートスクリプト
 *
 * 使い方:
 *   1. ExcelファイルをCSV（UTF-8）で保存
 *      「名前を付けて保存」→「CSV UTF-8（コンマ区切り）(*.csv)」
 *
 *   2. 環境変数を設定してスクリプトを実行
 *      KV_REST_API_URL=https://... KV_REST_API_TOKEN=... node scripts/import-members.mjs members.csv
 *
 *      または .env.local から読む場合:
 *      node --env-file=.env.local scripts/import-members.mjs members.csv
 *
 *   3. --dry-run オプションで実際には書き込まずに確認できます
 *      node --env-file=.env.local scripts/import-members.mjs members.csv --dry-run
 */

import { readFileSync } from "fs";
import { scryptSync, randomBytes } from "crypto";

// ── カラム定義（0始まり）──────────────────────────────────────
const COL_MEMBER_NO = 0;  // 会員No
const COL_NAME      = 1;  // 氏名
const COL_PASSWORD  = 9;  // パスワード
const COL_EXPIRY    = 12; // 有効期限切れ（値あり → 無効会員）

// ─────────────────────────────────────────────────────────────

function hashPassword(password) {
  const salt = randomBytes(16).toString("hex");
  const hash = scryptSync(String(password), salt, 64).toString("hex");
  return `${salt}:${hash}`;
}

/** シンプルなCSVパーサー（クォート対応） */
function parseCSV(content) {
  const lines = content.replace(/\r\n/g, "\n").replace(/\r/g, "\n").split("\n");
  return lines
    .filter((l) => l.trim())
    .map((line) => {
      const fields = [];
      let current = "";
      let inQuotes = false;
      for (const ch of line) {
        if (ch === '"') {
          inQuotes = !inQuotes;
        } else if (ch === "," && !inQuotes) {
          fields.push(current.trim());
          current = "";
        } else {
          current += ch;
        }
      }
      fields.push(current.trim());
      return fields;
    });
}

async function kvPipeline(commands) {
  const url = process.env.KV_REST_API_URL;
  const token = process.env.KV_REST_API_TOKEN;
  const res = await fetch(`${url}/pipeline`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(commands),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`KV pipeline failed: ${res.status} — ${text}`);
  }
  return res.json();
}

async function main() {
  const args = process.argv.slice(2);
  const filePath = args.find((a) => !a.startsWith("--"));
  const dryRun = args.includes("--dry-run");

  if (!filePath) {
    console.error("Usage: node scripts/import-members.mjs <file.csv> [--dry-run]");
    process.exit(1);
  }

  if (!dryRun && (!process.env.KV_REST_API_URL || !process.env.KV_REST_API_TOKEN)) {
    console.error("Error: KV_REST_API_URL と KV_REST_API_TOKEN を設定してください");
    process.exit(1);
  }

  // BOM 除去して読み込み
  const content = readFileSync(filePath, "utf-8").replace(/^\uFEFF/, "");
  const rows = parseCSV(content);

  // ヘッダー行をスキップ
  const dataRows = rows.slice(1).filter((r) => r[COL_MEMBER_NO]?.trim());

  console.log(`\n読み込み: ${dataRows.length} 行\n`);

  const commands = [];
  const memberNumbers = [];
  const skipped = [];
  const inactive = [];

  for (const row of dataRows) {
    const memberNumber = row[COL_MEMBER_NO]?.trim();
    const name = row[COL_NAME]?.trim();
    const password = row[COL_PASSWORD]?.trim();
    const expiry = row[COL_EXPIRY]?.trim();

    if (!memberNumber || !name) {
      skipped.push({ memberNumber: memberNumber || "(空)", reason: "会員Noまたは氏名が空" });
      continue;
    }
    if (!password) {
      skipped.push({ memberNumber, reason: "パスワードが空" });
      continue;
    }

    const active = !expiry;
    if (!active) inactive.push(memberNumber);

    const member = {
      memberNumber,
      name,
      passwordHash: hashPassword(password),
      joinedAt: new Date().toISOString(),
      active,
    };

    commands.push(["SET", `member:${memberNumber}`, JSON.stringify(member)]);
    memberNumbers.push(memberNumber);
  }

  if (memberNumbers.length > 0) {
    commands.push(["SADD", "member_list", ...memberNumbers]);
  }

  // 結果プレビュー
  console.log(`インポート対象: ${memberNumbers.length} 名`);
  if (inactive.length > 0) {
    console.log(`  うち無効（有効期限切れ）: ${inactive.length} 名 — ${inactive.slice(0, 5).join(", ")}${inactive.length > 5 ? " ..." : ""}`);
  }
  if (skipped.length > 0) {
    console.log(`スキップ: ${skipped.length} 件`);
    skipped.forEach((s) => console.log(`  ${s.memberNumber}: ${s.reason}`));
  }

  if (dryRun) {
    console.log("\n[dry-run] 書き込みはスキップしました。--dry-run を外すと実際に登録されます。");
    return;
  }

  // バッチ実行（100コマンドずつ）
  console.log("\nKVへ書き込み中...");
  const BATCH = 100;
  for (let i = 0; i < commands.length; i += BATCH) {
    await kvPipeline(commands.slice(i, i + BATCH));
    process.stdout.write(`  ${Math.min(i + BATCH, commands.length)} / ${commands.length} 完了\r`);
  }

  console.log(`\n\n完了！ ${memberNumbers.length} 名を登録しました。`);
}

main().catch((err) => {
  console.error("\nエラー:", err.message);
  process.exit(1);
});
