import { deleteTodo, validateTodoId } from '../../utils/todos-dynamodb'

export default eventHandler(async (event) => {
  const todoId = validateTodoId(event.context.params?.id)
  await deleteTodo(todoId)

  return {
    ok: true,
  }
})
