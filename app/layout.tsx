import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "ToDo リスト",
  description: "シンプルな ToDo リスト",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="ja">
      <body>{children}</body>
    </html>
  );
}
