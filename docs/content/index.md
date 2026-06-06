---
seo:
  title: Document Driven Monorepo
  description: AI Agent と人間が docs を介して合意しながら開発するためのドキュメント。
---

::u-page-hero
---
orientation: horizontal
---
#title
Document Driven Monorepo

#description
このドキュメントサイトは、AI Agent と人間が同じ前提を読んでから実装するための合意面です。

設計の理想形は `design` に置き、実際の運用手順は `operations` に置きます。現在の開発スコープ、理想設計との差分、タスク、受け入れ条件は `delivery` に置きます。

#links
  :::u-button
  ---
  to: /design/overview/vision
  size: xl
  trailing-icon: i-lucide-arrow-right
  ---
  設計思想を読む
  :::

  :::u-button
  ---
  to: /operations/overview
  color: neutral
  variant: outline
  size: xl
  icon: i-lucide-activity
  ---
  オペレーションを見る
  :::

  :::u-button
  ---
  to: /delivery/current-scope
  color: neutral
  variant: outline
  size: xl
  icon: i-lucide-list-checks
  ---
  開発計画を見る
  :::
::

::u-page-section
#title
開発前に読む docs

#features
  :::u-page-feature
  ---
  icon: i-lucide-compass
  to: /design/overview/vision
  ---
  #title
  Current Scope

  #description
  `docs/content/delivery/2.current-scope.md`
  :::

  :::u-page-feature
  ---
  icon: i-lucide-compass
  to: /design/overview/vision
  ---
  #title
  Implementation Flow

  #description
  `docs/content/delivery/3.implementation-flow.md`
  :::

  :::u-page-feature
  ---
  icon: i-lucide-compass
  to: /design/overview/vision
  ---
  #title
  対象 Task

  #description
  `docs/content/delivery/scopes/**/tasks/*.md`
  :::
::


::u-page-section
#title
ドキュメントの責務

#description
実装は docs で合意した範囲を対象にします。テーマやドメインを変える場合も、AI Agent が自由に仕様を作るのではなく、先に docs を更新してから実装します。

#features
  :::u-page-feature
  ---
  icon: i-lucide-compass
  to: /design/overview/vision
  ---
  #title
  design

  #description
  目指す最終形、責務境界、アーキテクチャ。
  :::

  :::u-page-feature
  ---
  icon: i-lucide-compass
  to: /design/overview/vision
  ---
  #title
  operations

  #description
  実際に繰り返す標準手順。
  :::

  :::u-page-feature
  ---
  icon: i-lucide-compass
  to: /design/overview/vision
  ---
  #title
  delivery

  #description
  現在の開発判断、スコープ、タスク、受け入れ条件。
  :::
::

::u-page-section
#title
Documentation Map

#features
  :::u-page-feature
  ---
  icon: i-lucide-compass
  to: /design/overview/vision
  ---
  #title
  Overview

  #description
  投資対象、時間軸、期待モデル、設計原則、AIの役割を定義します。
  :::

  :::u-page-feature
  ---
  icon: i-lucide-layers
  to: /design/architecture/layer-model
  ---
  #title
  Architecture

  #description
  apps/web、apps/batch、infra、Docs、Layer1-5、責務分離、データフローを整理します。
  :::

  :::u-page-feature
  ---
  icon: i-lucide-database
  to: /design/data-design/dynamodb
  ---
  #title
  Data Design

  #description
  DynamoDB PK/SK、Parquet partition、シグナルスキーマを運用前提で定義します。
  :::

  :::u-page-feature
  ---
  icon: i-lucide-cpu
  to: /design/batch-analysis/duckdb-vectorbt
  ---
  #title
  Batch Analysis

  #description
  apps/batchのLambda実装、J-Quants取得、S3保存、DuckDB/vectorbt分析、SAM運用を扱います。
  :::

  :::u-page-feature
  ---
  icon: i-lucide-server
  to: /design/web-api/nuxt-server-api
  ---
  #title
  Web API

  #description
  Nuxt server/api と apps/batch Python Lambda の境界、表示用API、Amplify実行環境を定義します。
  :::

  :::u-page-feature
  ---
  icon: i-lucide-route
  to: /operations/overview
  ---
  #title
  Operations

  #description
  初期登録、日次運用、週次/月次確認、障害対応をタイミング別に整理します。
  :::

  :::u-page-feature
  ---
  icon: i-lucide-route
  to: /delivery/development-roadmap
  ---
  #title
  Roadmap

  #description
  開発済み、現在開発中、将来開発予定のスコープを整理します。
  :::

  :::u-page-feature
  ---
  icon: i-lucide-list-checks
  to: /delivery/current-scope
  ---
  #title
  Delivery

  #description
  現在スコープ、完了済みスコープ、タスク仕様、検証ログを設計思想から分けて管理します。
  :::
::
