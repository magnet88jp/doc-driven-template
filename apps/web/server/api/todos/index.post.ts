import { createTodo, validateTodoTitle } from '../../utils/todos-dynamodb'

export default eventHandler(async (event) => {
  const body = await readBody<{ title?: unknown }>(event)
  return createTodo(validateTodoTitle(body?.title))
})
