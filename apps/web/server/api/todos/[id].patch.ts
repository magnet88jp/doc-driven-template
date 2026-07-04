import { updateTodoCompleted, validateTodoCompleted, validateTodoId } from '../../utils/todos-dynamodb'

export default eventHandler(async (event) => {
  const todoId = validateTodoId(event.context.params?.id)
  const body = await readBody<{ completed?: unknown }>(event)

  return updateTodoCompleted(todoId, validateTodoCompleted(body?.completed))
})
