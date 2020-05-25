import React, { useEffect, useState, useRef } from 'react'
import {
  View, Text, StyleSheet, TextInput, Button
} from 'react-native'

import { API, graphqlOperation } from 'aws-amplify'
import { createTodo } from './src/graphql/mutations'
import { listTodos } from './src/graphql/queries'
import { onCreateTodo } from './src/graphql/subscriptions'

const initialState = { name: '', description: '' }

const Todo = () => {
  const [formState, setFormState] = useState(initialState)
  const [todos, setTodos] = useState([])
  const latestUpdateTodos = useRef(null);

  useEffect(() => {
    fetchTodos(),
    reloadTodo()
  }, [])

  function setInput(key, value) {
    setFormState({ ...formState, [key]: value })
  }

  function updateTodos(event) {
    const todo = event.value.data.onCreateTodo;
    setTodos([...todos, todo])
  }
  latestUpdateTodos.current = updateTodos;

  async function fetchTodos() {
    try {
      const todoData = await API.graphql(graphqlOperation(listTodos))
      const todos = todoData.data.listTodos.items
      setTodos(todos)
    } catch (err) { console.log('error fetching todos') }
  }

  function reloadTodo() {
    const subscription = API.graphql(
      graphqlOperation(onCreateTodo)
    ).subscribe({
      next: (event) => {
        if (event) {
          latestUpdateTodos.current(event);
        }
      }
    });
  }

  async function addTodo() {
    try {
      const todo = { ...formState }
      setFormState(initialState)
      await API.graphql(graphqlOperation(createTodo, { input: todo }))
    } catch (err) {
      console.log('error creating todo:', err)
    }
  }

  return (
    <View style={styles.container}>
      <TextInput
        onChangeText={val => setInput('name', val)}
        style={styles.input}
        value={formState.name}
        placeholder="Name"
      />
      <TextInput
        onChangeText={val => setInput('description', val)}
        style={styles.input}
        value={formState.description}
        placeholder="Description"
      />
      <Button title="Create Todo" onPress={addTodo} />
      {
        todos.map((todo, index) => (
          <View key={todo.id ? todo.id : index} style={styles.todo}>
            <Text style={styles.todoName}>{todo.name}</Text>
            <Text> - {todo.description}</Text>
          </View>
        ))
      }
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', padding: 20 },
  todo: { marginBottom: 15 },
  input: { height: 50, backgroundColor: '#ddd', marginBottom: 10, padding: 8 },
  todoName: { fontSize: 18, fontWeight: 900 }
})

export default Todo