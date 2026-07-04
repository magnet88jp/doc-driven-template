<script setup lang="ts">
import type { Todo } from '~/types'

type TodoFilter = 'all' | 'active' | 'completed'

const newTodoTitle = ref('')
const todos = ref<Todo[]>([])
const selectedFilter = ref<TodoFilter>('all')
const isLoading = ref(true)
const errorMessage = ref('')
const pendingAction = ref<string | null>(null)

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

async function loadTodos() {
  isLoading.value = true
  errorMessage.value = ''

  try {
    todos.value = await $fetch<Todo[]>('/api/todos')
  } catch (error) {
    errorMessage.value = getTodoErrorMessage(error)
  } finally {
    isLoading.value = false
  }
}

async function addTodo() {
  const title = newTodoTitle.value.trim()

  if (!title) {
    return
  }

  pendingAction.value = 'add'
  errorMessage.value = ''

  try {
    const todo = await $fetch<Todo>('/api/todos', {
      method: 'POST',
      body: {
        title,
      },
    })

    todos.value = [todo, ...todos.value]
    newTodoTitle.value = ''
  } catch (error) {
    errorMessage.value = getTodoErrorMessage(error)
  } finally {
    pendingAction.value = null
  }
}

async function setTodoCompleted(todoId: string, completed: boolean) {
  pendingAction.value = todoId
  errorMessage.value = ''

  try {
    const todo = await $fetch<Todo>(`/api/todos/${todoId}`, {
      method: 'PATCH',
      body: {
        completed,
      },
    })

    todos.value = todos.value.map(item => item.id === todo.id ? todo : item)
  } catch (error) {
    errorMessage.value = getTodoErrorMessage(error)
  } finally {
    pendingAction.value = null
  }
}

async function removeTodo(todoId: string) {
  pendingAction.value = todoId
  errorMessage.value = ''

  try {
    await $fetch(`/api/todos/${todoId}`, {
      method: 'DELETE',
    })

    todos.value = todos.value.filter(todo => todo.id !== todoId)
  } catch (error) {
    errorMessage.value = getTodoErrorMessage(error)
  } finally {
    pendingAction.value = null
  }
}

function getTodoErrorMessage(error: unknown) {
  if (typeof error === 'object' && error && 'data' in error) {
    const data = (error as { data?: { message?: string, statusMessage?: string } }).data
    return data?.message || data?.statusMessage || 'Unable to update todos.'
  }

  return 'Unable to update todos.'
}

onMounted(() => {
  loadTodos()
})
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
            :loading="pendingAction === 'add'"
            :disabled="!newTodoTitle.trim() || isLoading"
            class="justify-center sm:w-auto"
          />
        </form>

        <UAlert
          v-if="errorMessage"
          color="error"
          variant="subtle"
          icon="i-lucide-circle-alert"
          title="Todo sync failed"
          :description="errorMessage"
          :actions="[{
            label: 'Retry',
            color: 'error',
            variant: 'soft',
            onClick: loadTodos,
          }]"
        />

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

        <div v-if="isLoading" class="rounded-lg border border-default px-4 py-12 text-center">
          <UIcon name="i-lucide-loader-circle" class="mx-auto size-10 animate-spin text-dimmed" />
          <p class="mt-3 text-sm font-medium text-highlighted">
            Loading todos
          </p>
          <p class="mt-1 text-sm text-muted">
            Fetching the latest list from the server.
          </p>
        </div>

        <div v-else-if="filteredTodos.length" class="divide-y divide-default rounded-lg border border-default">
          <div
            v-for="todo in filteredTodos"
            :key="todo.id"
            class="flex items-start gap-3 p-4"
          >
            <UCheckbox
              :model-value="todo.completed"
              :aria-label="todo.completed ? 'Mark todo as active' : 'Mark todo as completed'"
              :disabled="pendingAction === todo.id"
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
                :loading="pendingAction === todo.id"
                :disabled="pendingAction === todo.id"
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
