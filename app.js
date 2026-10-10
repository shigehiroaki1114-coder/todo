'use strict';

const STORAGE_KEY = 'todo-app.items';

const form = document.getElementById('new-form');
const input = document.getElementById('new-input');
const main = document.getElementById('main');
const list = document.getElementById('list');
const toggleAll = document.getElementById('toggle-all');
const footer = document.getElementById('footer');
const count = document.getElementById('count');
const clearDone = document.getElementById('clear-done');
const filterButtons = document.querySelectorAll('[data-filter]');

let todos = load();
let filter = 'all';

function load() {
  try {
    const data = JSON.parse(localStorage.getItem(STORAGE_KEY));
    if (!Array.isArray(data)) return [];
    return data
      .filter(t => t && typeof t.text === 'string')
      .map(t => ({ text: t.text, done: Boolean(t.done) }));
  } catch {
    return [];
  }
}

function save() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(todos));
  } catch {
    // 保存できない環境（プライベートモード等）では画面上だけで動かす
  }
}

// 状態を変更して保存・再描画する
function update(change) {
  change();
  save();
  render();
}

function remove(todo) {
  todos = todos.filter(t => t !== todo);
}

// 日本語入力の変換確定の Enter かどうか
function isImeEnter(e) {
  return e.isComposing || e.keyCode === 229;
}

function visibleTodos() {
  if (filter === 'active') return todos.filter(t => !t.done);
  if (filter === 'done') return todos.filter(t => t.done);
  return todos;
}

function render() {
  const items = visibleTodos();
  list.replaceChildren(...items.map(renderItem));
  if (items.length === 0 && todos.length > 0) {
    const empty = document.createElement('li');
    empty.className = 'empty';
    empty.textContent = '該当するタスクはありません';
    list.append(empty);
  }

  const remaining = todos.filter(t => !t.done).length;
  main.hidden = todos.length === 0;
  footer.hidden = todos.length === 0;
  toggleAll.checked = todos.length > 0 && remaining === 0;
  count.textContent = `残り ${remaining} 件`;
  clearDone.hidden = remaining === todos.length;
  filterButtons.forEach(b => {
    const selected = b.dataset.filter === filter;
    b.classList.toggle('selected', selected);
    b.setAttribute('aria-pressed', String(selected));
  });
}

function renderItem(todo) {
  const li = document.createElement('li');
  li.className = todo.done ? 'item done' : 'item';

  const check = document.createElement('input');
  check.type = 'checkbox';
  check.checked = todo.done;
  check.setAttribute('aria-label', `「${todo.text}」を完了にする`);
  check.addEventListener('change', () => update(() => { todo.done = check.checked; }));

  const label = document.createElement('span');
  label.className = 'text';
  label.textContent = todo.text;
  label.addEventListener('dblclick', () => startEdit(li, todo));

  const edit = document.createElement('button');
  edit.type = 'button';
  edit.className = 'icon';
  edit.textContent = '✎';
  edit.setAttribute('aria-label', `「${todo.text}」を編集`);
  edit.addEventListener('click', () => startEdit(li, todo));

  const del = document.createElement('button');
  del.type = 'button';
  del.className = 'icon delete';
  del.textContent = '×';
  del.setAttribute('aria-label', `「${todo.text}」を削除`);
  del.addEventListener('click', () => update(() => remove(todo)));

  li.append(check, label, edit, del);
  return li;
}

function startEdit(li, todo) {
  const field = document.createElement('input');
  field.type = 'text';
  field.className = 'edit';
  field.value = todo.text;
  field.maxLength = 200;
  field.setAttribute('aria-label', 'タスクを編集');

  // Enter と blur が両方起きても一度だけ処理する
  let finished = false;
  const finish = commit => {
    if (finished) return;
    finished = true;
    if (!commit) {
      render();
      return;
    }
    const text = field.value.trim();
    update(() => {
      if (text) todo.text = text;
      else remove(todo); // 空にしたら削除
    });
  };

  field.addEventListener('keydown', e => {
    if (isImeEnter(e)) return;
    if (e.key === 'Enter') finish(true);
    else if (e.key === 'Escape') finish(false);
  });
  field.addEventListener('blur', () => finish(true));

  li.classList.add('editing');
  li.replaceChildren(field);
  field.focus();
  field.setSelectionRange(field.value.length, field.value.length);
}

// Safari では変換確定の Enter でフォームが送信されてしまうのを防ぐ
input.addEventListener('keydown', e => {
  if (e.key === 'Enter' && isImeEnter(e)) e.preventDefault();
});

form.addEventListener('submit', e => {
  e.preventDefault();
  const text = input.value.trim();
  if (!text) return;
  update(() => todos.push({ text, done: false }));
  input.value = '';
});

toggleAll.addEventListener('change', () => update(() => {
  todos.forEach(t => { t.done = toggleAll.checked; });
}));

clearDone.addEventListener('click', () => update(() => {
  todos = todos.filter(t => !t.done);
}));

filterButtons.forEach(b => b.addEventListener('click', () => {
  filter = b.dataset.filter;
  render();
}));

render();
