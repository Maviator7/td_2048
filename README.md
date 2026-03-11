# Merge Fortress 2048

2048 パズルとタワーディフェンスを組み合わせたブラウザゲームです。Vite + React で構成されています。

## 主な機能

- スライド操作でタイルを合体
- 手数制のターン進行
- Wave 制の敵出現と戦闘解決
- 役職システム
- ローカルランキング
- タイトル画面からの遊び方表示

## 画面構成

- タイトル画面
- ゲーム画面
- ランキング画面

ゲームオーバー時は現在のスコアをローカルランキングへ保存し、そのままランキング画面へ遷移します。

## ローカルランキング

ランキングはブラウザの `localStorage` に保存します。

- 保存キー: `merge-fortress-2048:local-rankings:v1`
- 保存件数: 上位 20 件
- 並び順: `score desc`, `wave desc`, `playedAt desc`

旧キー `merge-fortress-2048:local-rankings` を持っている場合は、初回読み込み時に新キーへ移行します。

## 開発

```bash
npm install
npm run dev
```

本番ビルド:

```bash
npm run build
```

Lint:

```bash
npm run lint
```

Test:

```bash
npm test
```

## デプロイ時セキュリティ設定

- `public/_headers` を追加済み（Cloudflare Pagesで有効）

設定済みヘッダー:

- `Content-Security-Policy`
- `X-Content-Type-Options: nosniff`
- `Referrer-Policy: strict-origin-when-cross-origin`
- `Strict-Transport-Security`
- `Permissions-Policy`

## 3rd Party スクリプト方針

- 現在、`Cloudflare Web Analytics` を使用
- 将来外部スクリプトを導入する場合は、バージョン固定 + `integrity`（SRI）+ `crossorigin="anonymous"` を必須にしてください

## CI

- GitHub Actions を追加済み: `.github/workflows/ci.yml`
- `npm ci` → `npm run lint` → `npm test` → `npm run build` を `push` / `pull_request` で実行

## Cloudflare Pages デプロイ

- Build command: `npm run build`
- Build output directory: `dist`
- セキュリティヘッダーは `public/_headers` がそのまま適用されます

## デバッグパネル

デバッグパネルはデフォルトで無効です。ローカル開発でも自動では表示されません。

表示したい場合だけ、起動またはビルド時に以下を指定してください。

```bash
VITE_ENABLE_DEBUG_PANEL=true
```

## 今後の拡張

- Cloudflare Pages + Functions + D1 を使ったオンラインランキング
- ランキング repository の `local` / `remote` 差し替え
- 戦闘解決ロジックのさらなる分離
