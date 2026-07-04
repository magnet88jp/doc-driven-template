import {
  DeleteItemCommand,
  DynamoDBClient,
  PutItemCommand,
  ScanCommand,
  UpdateItemCommand,
} from '@aws-sdk/client-dynamodb'
import type { Todo } from '~/types'

interface TodoItem {
  id?: { S?: string }
  title?: { S?: string }
  completed?: { BOOL?: boolean }
  createdAt?: { S?: string }
  updatedAt?: { S?: string }
}

let client: DynamoDBClient | undefined

function getTodoConfig() {
  const config = useRuntimeConfig()
  const tableName = config.todoTableName || getEnv('TODO_TABLE_NAME')
  const region = config.awsRegion || getEnv('AWS_REGION') || getEnv('AWS_DEFAULT_REGION')

  if (!tableName || !region) {
    throw createError({
      statusCode: 500,
      statusMessage: 'ToDo persistence is not configured.',
      data: {
        code: 'TODO_CONFIG_MISSING',
      },
    })
  }

  return { tableName, region }
}

function getEnv(name: string) {
  const runtime = globalThis as typeof globalThis & {
    process?: {
      env?: Record<string, string | undefined>
    }
  }

  return runtime.process?.env?.[name]
}

function getClient(region: string) {
  if (!client) {
    client = new DynamoDBClient({ region })
  }

  return client
}

function fromItem(item: TodoItem): Todo {
  return {
    id: item.id?.S || '',
    title: item.title?.S || '',
    completed: item.completed?.BOOL || false,
    createdAt: item.createdAt?.S || '',
    updatedAt: item.updatedAt?.S || '',
  }
}

function todoKey(todoId: string) {
  return {
    id: {
      S: todoId,
    },
  }
}

export function validateTodoTitle(value: unknown) {
  if (typeof value !== 'string') {
    throw createError({
      statusCode: 400,
      statusMessage: 'ToDo title is required.',
      data: {
        code: 'TODO_TITLE_REQUIRED',
      },
    })
  }

  const title = value.trim()

  if (!title) {
    throw createError({
      statusCode: 400,
      statusMessage: 'ToDo title is required.',
      data: {
        code: 'TODO_TITLE_REQUIRED',
      },
    })
  }

  return title
}

export function validateTodoCompleted(value: unknown) {
  if (typeof value !== 'boolean') {
    throw createError({
      statusCode: 400,
      statusMessage: 'ToDo completion state is required.',
      data: {
        code: 'TODO_COMPLETED_REQUIRED',
      },
    })
  }

  return value
}

export function validateTodoId(value: string | undefined) {
  if (!value) {
    throw createError({
      statusCode: 400,
      statusMessage: 'ToDo id is required.',
      data: {
        code: 'TODO_ID_REQUIRED',
      },
    })
  }

  return value
}

export async function listTodos() {
  const { tableName, region } = getTodoConfig()
  const response = await getClient(region).send(new ScanCommand({
    TableName: tableName,
  }))

  return (response.Items || [])
    .map(item => fromItem(item))
    .filter(todo => todo.id && todo.title)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
}

export async function createTodo(title: string) {
  const { tableName, region } = getTodoConfig()
  const now = new Date().toISOString()
  const todo: Todo = {
    id: crypto.randomUUID(),
    title,
    completed: false,
    createdAt: now,
    updatedAt: now,
  }

  await getClient(region).send(new PutItemCommand({
    TableName: tableName,
    Item: {
      id: { S: todo.id },
      title: { S: todo.title },
      completed: { BOOL: todo.completed },
      createdAt: { S: todo.createdAt },
      updatedAt: { S: todo.updatedAt },
    },
    ConditionExpression: 'attribute_not_exists(id)',
  }))

  return todo
}

export async function updateTodoCompleted(todoId: string, completed: boolean) {
  const { tableName, region } = getTodoConfig()
  const now = new Date().toISOString()
  const response = await getClient(region).send(new UpdateItemCommand({
    TableName: tableName,
    Key: todoKey(todoId),
    UpdateExpression: 'SET completed = :completed, updatedAt = :updatedAt',
    ConditionExpression: 'attribute_exists(id)',
    ExpressionAttributeValues: {
      ':completed': { BOOL: completed },
      ':updatedAt': { S: now },
    },
    ReturnValues: 'ALL_NEW',
  }))

  return fromItem(response.Attributes || {})
}

export async function deleteTodo(todoId: string) {
  const { tableName, region } = getTodoConfig()
  await getClient(region).send(new DeleteItemCommand({
    TableName: tableName,
    Key: todoKey(todoId),
    ConditionExpression: 'attribute_exists(id)',
  }))
}
