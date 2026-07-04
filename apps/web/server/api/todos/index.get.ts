import { listTodos } from '../../utils/todos-dynamodb'

export default eventHandler(async () => {
  return listTodos()
})
