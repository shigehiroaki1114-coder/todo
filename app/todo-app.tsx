"use client";

import { useEffect, useRef, useState, useSyncExternalStore, type FormEvent, type KeyboardEvent } from "react";
import {
  addTodo,
  clearDone,
  getServerSnapshot,
  getSnapshot,
  removeTodo,
  setAllDone,
  subscribe,
  updateTodo,
  type Todo,
} from "./todo-store";

type Filter = "all" | "active" | "done";

const FILTERS: { value: Filter; label: string }[] = [
  { value: "all", label: "すべて" },
  { value: "active", label: "未完了" },
  { value: "done", label: "完了" },
];

// 日本語入力の変換確定の Enter かどうか
function isImeEnter(e: KeyboardEvent<HTMLInputElement>) {
  return e.nativeEvent.isComposing || e.keyCode === 229;
}

export default function TodoApp() {
  const todos = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  const [filter, setFilter] = useState<Filter>("all");
  const [draft, setDraft] = useState("");

  const remaining = todos.filter((t) => !t.done).length;
  const visible = todos.filter((t) =>
    filter === "active" ? !t.done : filter === "done" ? t.done : true,
  );

  function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const text = draft.trim();
    if (!text) return;
    addTodo(text);
    setDraft("");
  }

  return (
    <main className="app">
      <h1>ToDo</h1>

      <form className="new-form" autoComplete="off" onSubmit={handleSubmit}>
        <input
          type="text"
          placeholder="やることを入力して Enter"
          aria-label="新しいタスク"
          maxLength={200}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          // Safari では変換確定の Enter でフォームが送信されてしまうのを防ぐ
          onKeyDown={(e) => {
            if (e.key === "Enter" && isImeEnter(e)) e.preventDefault();
          }}
        />
        <button type="submit">追加</button>
      </form>

      {todos.length > 0 && (
        <>
          <section className="main">
            <label className="toggle-all">
              <input
                type="checkbox"
                checked={remaining === 0}
                onChange={(e) => setAllDone(e.target.checked)}
              />{" "}
              すべて完了にする
            </label>
            <ul className="list">
              {visible.map((todo) => (
                <TodoItem key={todo.id} todo={todo} />
              ))}
              {visible.length === 0 && <li className="empty">該当するタスクはありません</li>}
            </ul>
          </section>

          <footer className="footer">
            <span>残り {remaining} 件</span>
            <nav className="filters" aria-label="表示の切り替え">
              {FILTERS.map((f) => (
                <button
                  key={f.value}
                  type="button"
                  className={filter === f.value ? "selected" : undefined}
                  aria-pressed={filter === f.value}
                  onClick={() => setFilter(f.value)}
                >
                  {f.label}
                </button>
              ))}
            </nav>
            {remaining < todos.length && (
              <button type="button" className="link" onClick={clearDone}>
                完了済みを削除
              </button>
            )}
          </footer>
        </>
      )}

      <p className="hint">ダブルクリックまたは ✎ で編集（Enter で確定、Esc で取消）</p>
    </main>
  );
}

function TodoItem({ todo }: { todo: Todo }) {
  const [editText, setEditText] = useState<string | null>(null);
  // Enter と blur が両方起きても一度だけ処理する
  const finished = useRef(false);
  const editRef = useRef<HTMLInputElement>(null);
  const isEditing = editText !== null;

  // 編集欄を開いたらフォーカスし、カーソルを末尾に置く
  useEffect(() => {
    const el = editRef.current;
    if (!isEditing || !el) return;
    el.focus();
    el.setSelectionRange(el.value.length, el.value.length);
  }, [isEditing]);

  function startEdit() {
    finished.current = false;
    setEditText(todo.text);
  }

  function finish(commit: boolean) {
    if (finished.current || editText === null) return;
    finished.current = true;
    if (commit) {
      const text = editText.trim();
      if (text) updateTodo(todo.id, { text });
      else removeTodo(todo.id); // 空にしたら削除
    }
    setEditText(null);
  }

  if (editText !== null) {
    return (
      <li className="item editing">
        <input
          type="text"
          ref={editRef}
          className="edit"
          aria-label="タスクを編集"
          maxLength={200}
          value={editText}
          onChange={(e) => setEditText(e.target.value)}
          onKeyDown={(e) => {
            if (isImeEnter(e)) return;
            if (e.key === "Enter") finish(true);
            else if (e.key === "Escape") finish(false);
          }}
          onBlur={() => finish(true)}
        />
      </li>
    );
  }

  return (
    <li className={todo.done ? "item done" : "item"}>
      <input
        type="checkbox"
        checked={todo.done}
        aria-label={`「${todo.text}」を完了にする`}
        onChange={(e) => updateTodo(todo.id, { done: e.target.checked })}
      />
      <span className="text" onDoubleClick={startEdit}>
        {todo.text}
      </span>
      <button type="button" className="icon" aria-label={`「${todo.text}」を編集`} onClick={startEdit}>
        ✎
      </button>
      <button
        type="button"
        className="icon delete"
        aria-label={`「${todo.text}」を削除`}
        onClick={() => removeTodo(todo.id)}
      >
        ×
      </button>
    </li>
  );
}
