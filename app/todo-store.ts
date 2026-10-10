// localStorage に保存する ToDo の状態。useSyncExternalStore から購読する
export type Todo = { id: string; text: string; done: boolean };

const STORAGE_KEY = "todo-app.items";
const EMPTY: Todo[] = [];

let todos: Todo[] | null = null;
const listeners = new Set<() => void>();

function newId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

function read(): Todo[] {
  try {
    const data: unknown = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "null");
    if (!Array.isArray(data)) return [];
    return data
      .filter((t) => t && typeof t.text === "string")
      .map((t) => ({
        id: typeof t.id === "string" ? t.id : newId(),
        text: t.text,
        done: Boolean(t.done),
      }));
  } catch {
    return [];
  }
}

function notify() {
  listeners.forEach((listener) => listener());
}

export function subscribe(listener: () => void) {
  listeners.add(listener);
  // 別タブでの変更を反映する
  const onStorage = (e: StorageEvent) => {
    if (e.key !== STORAGE_KEY) return;
    todos = read();
    notify();
  };
  window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(listener);
    window.removeEventListener("storage", onStorage);
  };
}

export function getSnapshot(): Todo[] {
  if (todos === null) todos = read();
  return todos;
}

export function getServerSnapshot(): Todo[] {
  return EMPTY;
}

function setTodos(next: Todo[]) {
  todos = next;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch {
    // 保存できない環境（プライベートモード等）では画面上だけで動かす
  }
  notify();
}

export function addTodo(text: string) {
  setTodos([...getSnapshot(), { id: newId(), text, done: false }]);
}

export function updateTodo(id: string, change: Partial<Omit<Todo, "id">>) {
  setTodos(getSnapshot().map((t) => (t.id === id ? { ...t, ...change } : t)));
}

export function removeTodo(id: string) {
  setTodos(getSnapshot().filter((t) => t.id !== id));
}

export function setAllDone(done: boolean) {
  setTodos(getSnapshot().map((t) => ({ ...t, done })));
}

export function clearDone() {
  setTodos(getSnapshot().filter((t) => !t.done));
}
