/**
 * 会員一括インポートスクリプト
 *
 * 使い方:
 *   node --env-file=.env.local scripts/import-members.mjs members.csv [オプション]
 *
 * オプション:
 *   --encoding=shift_jis   文字コード指定（デフォルト: utf-8）
 *                          ExcelのデフォルトCSVはShift-JIS。
 *                          Excelで「CSV UTF-8（コンマ区切り）」保存なら不要。
 *   --dry-run              書き込まずに結果を確認
 *
 * 例:
 *   # Shift-JIS ファイルをdry-runで確認
 *   node --env-file=.env.local scripts/import-members.mjs members.csv --encoding=shift_jis --dry-run
 *
 *   # 本番実行
 *   node --env-file=.env.local scripts/import-members.mjs members.csv --encoding=shift_jis
 *
 * パスワードの決定ルール（優先順）:
 *   1. パスワード列 (col9) に値あり → そのまま使用
 *   2. 生年月日列 (col8) に値あり → YYYYMMDD形式に変換して使用
 *   3. 上記両方とも空 → 会員Noを初期パスワードとして設定（要変更）
 *
 * 有効/無効の判定:
 *   「有効」のみ → active: true
 *   「期限切れ」「期限切れ・退会」→ active: false
 */

import { readFileSync } from "fs";
import { scryptSync, randomBytes } from "crypto";

// ── カラム定義（0始まり）──────────────────────────────────────
const COL_MEMBER_NO = 0;  // 会員No
const COL_NAME      = 1;  // 氏名
const COL_BIRTHDAY  = 8;  // 生年月日 (YYYY/MM/DD)
const COL_PASSWORD  = 9;  // パスワード (YYYYMMDD形式が多い)
const COL_STATUS    = 12; // 有効/期限切れ

// ─────────────────────────────────────────────────────────────

function hashPassword(password) {
  const salt = randomBytes(16).toString("hex");
  const hash = scryptSync(String(password), salt, 64).toString("hex");
  return `${salt}:${hash}`;
}

function decodeFile(buf, encoding) {
  const enc = encoding.toLowerCase().replace(/[-_]/g, "");
  if (enc === "shiftjis" || enc === "sjis" || enc === "cp932") {
    try {
      return new TextDecoder("shift_jis").decode(buf);
    } catch {
      // fallback: some Node builds use different name
      return new TextDecoder("x-sjis").decode(buf);
    }
  }
  const str = buf.toString("utf-8");
  return str.startsWith("\uFEFF") ? str.slice(1) : str; // strip BOM
}

/** シンプルなCSVパーサー（クォート対応） */
function parseCSV(content) {
  const lines = content
    .replace(/\r\n/g, "\n")
    .replace(/\r/g, "\n")
    .split("\n");
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

/** 生年月日 "YYYY/MM/DD" → "YYYYMMDD" */
function birthdayToPassword(bdStr) {
  if (!bdStr) return null;
  const p = bdStr.replace(/\//g, "").trim();
  return p.length === 8 ? p : null;
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
  const encodingArg = args.find((a) => a.startsWith("--encoding="));
  const encoding = encodingArg ? encodingArg.split("=")[1] : "utf-8";

  if (!filePath) {
    console.error(
      "Usage: node scripts/import-members.mjs <file.csv> [--dry-run] [--encoding=shift_jis]"
    );
    process.exit(1);
  }

  if (!dryRun && (!process.env.KV_REST_API_URL || !process.env.KV_REST_API_TOKEN)) {
    console.error("Error: KV_REST_API_URL と KV_REST_API_TOKEN を設定してください");
    process.exit(1);
  }

  // ファイル読み込み・デコード
  const buf = readFileSync(filePath);
  const content = decodeFile(buf, encoding);
  const rows = parseCSV(content);

  // ヘッダー行を探す（「会員No」を含む行）
  let headerRow = -1;
  for (let i = 0; i < Math.min(rows.length, 5); i++) {
    if (rows[i].some((c) => c.includes("会員") || c.includes("会員No"))) {
      headerRow = i;
      break;
    }
  }
  const dataStart = headerRow >= 0 ? headerRow + 1 : 2; // 見つからなければ2行目からとみなす

  console.log(`\nヘッダー行: ${headerRow + 1}行目、データ開始: ${dataStart + 1}行目`);

  // データ行抽出（会員Noが数字のみの行のみ）
  const dataRows = rows.slice(dataStart).filter((r) => {
    const no = r[COL_MEMBER_NO]?.trim();
    const name = r[COL_NAME]?.trim();
    return no && name && /^\d+$/.test(no);
  });

  console.log(`対象行数: ${dataRows.length} 件\n`);

  const commands = [];
  const memberNumbers = [];
  const results = { active: 0, inactive: 0, skipped: 0 };
  const pwSources = { csv: 0, birthday: 0, memberNo: 0 };
  const memberNoDefaultPw = []; // 会員Noをパスワードにした人

  for (const row of dataRows) {
    const memberNumber = row[COL_MEMBER_NO]?.trim();
    const name = row[COL_NAME]?.trim();
    const birthday = row[COL_BIRTHDAY]?.trim();
    const passwordRaw = row[COL_PASSWORD]?.trim();
    const statusRaw = row[COL_STATUS]?.trim() ?? "";

    if (!memberNumber || !name) {
      results.skipped++;
      continue;
    }

    // パスワード決定
    let password;
    if (passwordRaw) {
      password = passwordRaw;
      pwSources.csv++;
    } else {
      const bdPw = birthdayToPassword(birthday);
      if (bdPw) {
        password = bdPw;
        pwSources.birthday++;
      } else {
        password = memberNumber;
        pwSources.memberNo++;
        memberNoDefaultPw.push(memberNumber);
      }
    }

    // 有効判定: 「有効」を含み「期限切れ」を含まない場合のみ active
    const active = statusRaw.includes("有効") && !statusRaw.includes("期限切れ");
    if (active) results.active++;
    else results.inactive++;

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

  // ── サマリー表示 ──────────────────────────────────────────
  console.log("─".repeat(50));
  console.log(`登録予定:  ${memberNumbers.length} 名`);
  console.log(`  有効:    ${results.active} 名`);
  console.log(`  無効:    ${results.inactive} 名`);
  console.log(`  スキップ: ${results.skipped} 件`);
  console.log("");
  console.log("パスワード設定内訳:");
  console.log(`  CSVのパスワード欄から: ${pwSources.csv} 名`);
  console.log(`  生年月日から生成:     ${pwSources.birthday} 名`);
  console.log(`  会員No（初期PW）:     ${pwSources.memberNo} 名 ← 要パスワード変更`);
  if (memberNoDefaultPw.length > 0) {
    console.log(`    対象会員No: ${memberNoDefaultPw.join(", ")}`);
  }
  console.log("─".repeat(50));

  if (dryRun) {
    console.log(
      "\n[dry-run] 書き込みはスキップしました。--dry-run を外すと実際に登録されます。"
    );
    return;
  }

  // ── KVへ書き込み ─────────────────────────────────────────
  console.log("\nKVへ書き込み中...");
  const BATCH = 100;
  for (let i = 0; i < commands.length; i += BATCH) {
    await kvPipeline(commands.slice(i, i + BATCH));
    const done = Math.min(i + BATCH, commands.length);
    process.stdout.write(`  ${done} / ${commands.length} 完了\r`);
  }

  console.log(`\n\n✓ 完了！ ${memberNumbers.length} 名を登録しました。`);
  if (memberNoDefaultPw.length > 0) {
    console.log(
      `\n⚠ 会員Noをパスワードに設定した ${memberNoDefaultPw.length} 名は、`
      + "\n  ログイン後にパスワードを変更するよう案内してください。"
    );
  }
}

main().catch((err) => {
  console.error("\nエラー:", err.message);
  process.exit(1);
});
