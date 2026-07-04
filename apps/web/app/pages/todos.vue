<script setup lang="ts">
type TodoFilter = 'all' | 'active' | 'completed'

interface Todo {
  id: number
  title: string
  completed: boolean
}

const newTodoTitle = ref('')
const todos = ref<Todo[]>([])
const selectedFilter = ref<TodoFilter>('all')
const nextTodoId = ref(1)

const filterItems = [{
  label: 'All',
  value: 'all',
}, {
  label: 'Active',
  value: 'active',
}, {
  label: 'Completed',
  value: 'completed',
}]

const activeCount = computed(() => todos.value.filter(todo => !todo.completed).length)
const completedCount = computed(() => todos.value.filter(todo => todo.completed).length)

const filteredTodos = computed(() => {
  if (selectedFilter.value === 'active') {
    return todos.value.filter(todo => !todo.completed)
  }

  if (selectedFilter.value === 'completed') {
    return todos.value.filter(todo => todo.completed)
  }

  return todos.value
})

function addTodo() {
  const title = newTodoTitle.value.trim()

  if (!title) {
    return
  }

  todos.value.unshift({
    id: nextTodoId.value++,
    title,
    completed: false,
  })
  newTodoTitle.value = ''
}

function setTodoCompleted(todoId: number, completed: boolean) {
  const todo = todos.value.find(item => item.id === todoId)

  if (todo) {
    todo.completed = completed
  }
}

function removeTodo(todoId: number) {
  todos.value = todos.value.filter(todo => todo.id !== todoId)
}
</script>

<template>
  <UDashboardPanel id="todos">
    <template #header>
      <UDashboardNavbar title="Todos">
        <template #leading>
          <UDashboardSidebarCollapse />
        </template>

        <template #trailing>
          <UBadge :label="todos.length" variant="subtle" />
        </template>
      </UDashboardNavbar>
    </template>

    <template #body>
      <div class="mx-auto flex w-full max-w-4xl flex-col gap-6">
        <form class="flex flex-col gap-2 sm:flex-row" @submit.prevent="addTodo">
          <UInput
            v-model="newTodoTitle"
            autofocus
            icon="i-lucide-list-plus"
            placeholder="Add a todo..."
            aria-label="Todo title"
            class="min-w-0 flex-1"
          />
          <UButton
            type="submit"
            icon="i-lucide-plus"
            label="Add"
            :disabled="!newTodoTitle.trim()"
            class="justify-center sm:w-auto"
          />
        </form>

        <div class="grid gap-3 sm:grid-cols-2">
          <div class="rounded-lg border border-default bg-muted/30 p-4">
            <div class="flex items-center justify-between gap-3">
              <span class="text-sm font-medium text-muted">Active</span>
              <UIcon name="i-lucide-circle" class="size-4 text-dimmed" />
            </div>
            <p class="mt-2 text-2xl font-semibold text-highlighted">
              {{ activeCount }}
            </p>
          </div>

          <div class="rounded-lg border border-default bg-muted/30 p-4">
            <div class="flex items-center justify-between gap-3">
              <span class="text-sm font-medium text-muted">Completed</span>
              <UIcon name="i-lucide-circle-check" class="size-4 text-dimmed" />
            </div>
            <p class="mt-2 text-2xl font-semibold text-highlighted">
              {{ completedCount }}
            </p>
          </div>
        </div>

        <div class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <UTabs
            v-model="selectedFilter"
            :items="filterItems"
            :content="false"
            size="xs"
            class="w-full sm:w-auto"
          />

          <p class="text-sm text-muted">
            Showing {{ filteredTodos.length }} of {{ todos.length }}
          </p>
        </div>

        <div v-if="filteredTodos.length" class="divide-y divide-default rounded-lg border border-default">
          <div
            v-for="todo in filteredTodos"
            :key="todo.id"
            class="flex items-start gap-3 p-4"
          >
            <UCheckbox
              :model-value="todo.completed"
              :aria-label="todo.completed ? 'Mark todo as active' : 'Mark todo as completed'"
              class="mt-0.5"
              @update:model-value="setTodoCompleted(todo.id, $event === true)"
            />

            <p
              class="min-w-0 flex-1 break-words text-sm font-medium"
              :class="todo.completed ? 'text-muted line-through' : 'text-highlighted'"
            >
              {{ todo.title }}
            </p>

            <UTooltip text="Delete todo">
              <UButton
                color="neutral"
                variant="ghost"
                icon="i-lucide-trash-2"
                square
                aria-label="Delete todo"
                @click="removeTodo(todo.id)"
              />
            </UTooltip>
          </div>
        </div>

        <div v-else class="rounded-lg border border-dashed border-default px-4 py-12 text-center">
          <UIcon name="i-lucide-list-checks" class="mx-auto size-10 text-dimmed" />
          <p class="mt-3 text-sm font-medium text-highlighted">
            No todos to show
          </p>
          <p class="mt-1 text-sm text-muted">
            Add a todo or switch filters to review another list.
          </p>
        </div>
      </div>
    </template>
  </UDashboardPanel>
</template>
