---
seo:
  title: Document Driven Monorepo
  description: AI Agent と人間が docs を介して合意しながら開発するためのドキュメント。
---

# Document Driven Monorepo

このドキュメントサイトは、AI Agent と人間が同じ前提を読んでから実装するための合意面です。

設計の理想形は `design` に置き、実際の運用手順は `operations` に置きます。現在の開発スコープ、理想設計との差分、タスク、受け入れ条件は `delivery` に置きます。

## 開発前に読む docs

- Current Scope: `docs/content/delivery/2.current-scope.md`
- Implementation Flow: `docs/content/delivery/3.implementation-flow.md`
- 対象 Task: `docs/content/delivery/scopes/**/tasks/*.md`

## ドキュメントの責務

- `design`: 目指す最終形、責務境界、アーキテクチャ。
- `operations`: 実際に繰り返す標準手順。
- `delivery`: 現在の開発判断、スコープ、タスク、受け入れ条件。

実装は docs で合意した範囲を対象にします。テーマやドメインを変える場合も、AI Agent が自由に仕様を作るのではなく、先に docs を更新してから実装します。
