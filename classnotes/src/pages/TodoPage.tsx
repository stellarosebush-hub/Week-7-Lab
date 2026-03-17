import React, { useEffect, useMemo, useState } from 'react'
import type { Class, Task } from '../types'

interface TodoPageProps {
  classes: Class[]
}

const STATUS_OPTIONS: Task['status'][] = ['Not Started', 'In Progress', 'Done']

function ProgressBar({ progress }: { progress: number }) {
  return (
    <div className="min-w-36">
      <div className="h-2.5 w-full bg-sky-100 rounded-full overflow-hidden border border-sky-200">
        <div
          className="h-full bg-sky-500 transition-all"
          style={{ width: `${progress}%` }}
        />
      </div>
      <div className="text-xs text-gray-500 mt-1">{progress}%</div>
    </div>
  )
}

export default function TodoPage({ classes }: TodoPageProps) {
  const [tasks, setTasks] = useState<Task[]>([])
  const [newTaskTitle, setNewTaskTitle] = useState('')
  const [newTaskClassId, setNewTaskClassId] = useState<number | ''>('')
  const [newTaskDueDate, setNewTaskDueDate] = useState('')
  const [createError, setCreateError] = useState('')

  useEffect(() => {
    window.api.listTasks().then(setTasks)
  }, [])

  useEffect(() => {
    if (classes.length === 0) {
      setNewTaskClassId('')
      return
    }

    setNewTaskClassId((current) => {
      if (current !== '' && classes.some((item) => item.id === current)) {
        return current
      }
      return classes[0].id
    })
  }, [classes])

  const classMap = useMemo(() => {
    return new Map(classes.map((item) => [item.id, item]))
  }, [classes])

  const overallProgress = useMemo(() => {
    if (tasks.length === 0) return 0
    const total = tasks.reduce((sum, task) => sum + task.progress, 0)
    return Math.round(total / tasks.length)
  }, [tasks])

  const completedCount = tasks.filter((task) => task.status === 'Done').length
  const canCreateTask = classes.length > 0 && Boolean(newTaskTitle.trim()) && newTaskClassId !== ''

  const refreshTasks = async () => {
    const latest = await window.api.listTasks()
    setTasks(latest)
  }

  const handleCreateTask = async () => {
    if (!newTaskTitle.trim()) {
      setCreateError('Enter a task title.')
      return
    }
    if (newTaskClassId === '') {
      setCreateError('Select a class for the task.')
      return
    }
    setCreateError('')
    await window.api.createTask({
      classId: Number(newTaskClassId),
      title: newTaskTitle.trim(),
      dueDate: newTaskDueDate || null
    })
    setNewTaskTitle('')
    setNewTaskDueDate('')
    await refreshTasks()
  }

  const handleUpdateTask = async (task: Task, patch: Partial<Task>) => {
    const nextProgress = patch.progress ?? task.progress
    const nextStatus = patch.status ?? (nextProgress >= 100 ? 'Done' : nextProgress > 0 ? 'In Progress' : 'Not Started')

    const updated = await window.api.updateTask({
      id: task.id,
      classId: patch.class_id ?? task.class_id,
      title: patch.title ?? task.title,
      dueDate: patch.due_date ?? task.due_date,
      progress: Math.max(0, Math.min(100, nextProgress)),
      status: nextStatus
    })

    setTasks((prev) => prev.map((item) => (item.id === updated.id ? updated : item)))
  }

  const handleDeleteTask = async (id: number) => {
    await window.api.deleteTask(id)
    setTasks((prev) => prev.filter((task) => task.id !== id))
  }

  return (
    <div className="h-full overflow-y-auto px-10 py-8">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">To-Do List</h1>
          <p className="text-sm text-gray-500 mt-1">
            Track tasks with visible class names, optional due dates, and progress bars.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-3 mb-8">
          <div className="bg-white border border-gray-200 rounded-xl p-4">
            <p className="text-xs uppercase tracking-wider text-gray-400 mb-1">Tasks Completed</p>
            <p className="text-2xl font-semibold text-gray-900">{completedCount} / {tasks.length}</p>
          </div>
          <div className="bg-white border border-gray-200 rounded-xl p-4">
            <p className="text-xs uppercase tracking-wider text-gray-400 mb-1">Average Progress</p>
            <p className="text-2xl font-semibold text-gray-900">{overallProgress}%</p>
          </div>
          <div className="bg-white border border-gray-200 rounded-xl p-4">
            <p className="text-xs uppercase tracking-wider text-gray-400 mb-2">Progress Bar</p>
            <ProgressBar progress={overallProgress} />
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-xl p-4 mb-6">
          <h2 className="text-sm font-semibold text-gray-800 mb-4">Add Task</h2>
          <div className="grid gap-3 md:grid-cols-[1.6fr_1fr_1fr_auto]">
            <input
              value={newTaskTitle}
              onChange={(e) => {
                setNewTaskTitle(e.target.value)
                if (createError) setCreateError('')
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && canCreateTask) {
                  void handleCreateTask()
                }
              }}
              placeholder="Task title"
              className="px-3 py-2 rounded-md border border-gray-200 bg-white text-sm outline-none focus:border-sky-300"
            />
            <select
              value={newTaskClassId}
              onChange={(e) => {
                setNewTaskClassId(e.target.value ? Number(e.target.value) : '')
                if (createError) setCreateError('')
              }}
              className="px-3 py-2 rounded-md border border-gray-200 bg-white text-sm outline-none focus:border-sky-300"
            >
              <option value="">Select class</option>
              {classes.map((cls) => (
                <option key={cls.id} value={cls.id}>{cls.name}</option>
              ))}
            </select>
            <input
              type="date"
              value={newTaskDueDate}
              onChange={(e) => {
                setNewTaskDueDate(e.target.value)
                if (createError) setCreateError('')
              }}
              className="px-3 py-2 rounded-md border border-gray-200 bg-white text-sm outline-none focus:border-sky-300"
            />
            <button
              onClick={handleCreateTask}
              disabled={!canCreateTask}
              className="px-4 py-2 rounded-md bg-sky-600 text-white text-sm hover:bg-sky-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Add
            </button>
          </div>
          {classes.length === 0 && (
            <p className="text-xs text-gray-400 mt-3">Create at least one class before adding tasks.</p>
          )}
          {classes.length > 0 && !createError && !canCreateTask && (
            <p className="text-xs text-gray-400 mt-3">Add a title to create a task. Due date is optional.</p>
          )}
          {createError && (
            <p className="text-xs text-red-500 mt-3">{createError}</p>
          )}
        </div>

        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[920px]">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr className="text-left text-xs uppercase tracking-wider text-gray-500">
                  <th className="px-4 py-3">Class Name</th>
                  <th className="px-4 py-3">To Do Item</th>
                  <th className="px-4 py-3">Due Date</th>
                  <th className="px-4 py-3">Progress</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {tasks.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-4 py-8 text-center text-sm text-gray-400">
                      No tasks yet. Add your first to-do item above.
                    </td>
                  </tr>
                )}
                {tasks.map((task) => {
                  const cls = classMap.get(task.class_id)
                  return (
                    <tr key={task.id} className="border-b border-gray-100 last:border-b-0 align-top">
                      <td className="px-4 py-3">
                        <select
                          value={task.class_id}
                          onChange={(e) => handleUpdateTask(task, { class_id: Number(e.target.value) })}
                          className="w-full px-2 py-1.5 rounded-md border border-gray-200 bg-white text-sm outline-none focus:border-sky-300"
                        >
                          {classes.map((item) => (
                            <option key={item.id} value={item.id}>{item.name}</option>
                          ))}
                        </select>
                        {cls && (
                          <p className="text-xs text-gray-400 mt-1">{cls.icon} {cls.name}</p>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <input
                          value={task.title}
                          onChange={(e) => handleUpdateTask(task, { title: e.target.value })}
                          className="w-full px-2 py-1.5 rounded-md border border-gray-200 bg-white text-sm outline-none focus:border-sky-300"
                        />
                      </td>
                      <td className="px-4 py-3">
                        <input
                          type="date"
                          value={task.due_date ?? ''}
                          onChange={(e) => handleUpdateTask(task, { due_date: e.target.value || null })}
                          className="px-2 py-1.5 rounded-md border border-gray-200 bg-white text-sm outline-none focus:border-sky-300"
                        />
                      </td>
                      <td className="px-4 py-3">
                        <input
                          type="range"
                          min="0"
                          max="100"
                          step="10"
                          value={task.progress}
                          onChange={(e) => handleUpdateTask(task, { progress: Number(e.target.value) })}
                          className="w-full accent-sky-600 mb-2"
                        />
                        <ProgressBar progress={task.progress} />
                      </td>
                      <td className="px-4 py-3">
                        <select
                          value={task.status}
                          onChange={(e) => handleUpdateTask(task, { status: e.target.value as Task['status'] })}
                          className="px-2 py-1.5 rounded-md border border-gray-200 bg-white text-sm outline-none focus:border-sky-300"
                        >
                          {STATUS_OPTIONS.map((option) => (
                            <option key={option} value={option}>{option}</option>
                          ))}
                        </select>
                      </td>
                      <td className="px-4 py-3">
                        <button
                          onClick={() => handleDeleteTask(task.id)}
                          className="text-sm text-red-500 hover:text-red-600"
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}
