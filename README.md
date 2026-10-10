# ToDo リスト

Next.js で作ったシンプルな ToDo リストです。タスクはブラウザの localStorage に保存されます。

公開版: https://shigehiroaki1114-coder.github.io/todo/

## 開発

```bash
npm install
npm run dev
```

http://localhost:3000 を開きます。

## デプロイ

`main` に push すると GitHub Actions（`.github/workflows/deploy.yml`）で静的ファイルを書き出し、GitHub Pages に公開されます。
