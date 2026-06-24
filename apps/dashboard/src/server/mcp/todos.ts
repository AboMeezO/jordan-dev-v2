export type Todo = {
  id: number
  title: string
}

const todos: Todo[] = [
  {
    id: 1,
    title: 'Buy groceries',
  },
]

let subscribers: ((todos: Todo[]) => void)[] = []

export function getTodos(): Todo[] {
  return todos
}

export function addTodo(title: string) {
  todos.push({ id: todos.length + 1, title })
  notifySubscribers()
}

export function subscribeToTodos(callback: (todos: Todo[]) => void) {
  subscribers.push(callback)
  callback(todos)
  return () => {
    subscribers = subscribers.filter((cb) => cb !== callback)
  }
}

function notifySubscribers() {
  for (const cb of subscribers) {
    try {
      cb(todos)
    } catch {}
  }
}
