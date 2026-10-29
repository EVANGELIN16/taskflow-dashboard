
import {
  createApi,
  fetchBaseQuery,
} from "@reduxjs/toolkit/query/react";

import type {
  Task,
  TaskInput,
  UpdateTaskInput,
} from "../types/task";

// Production: Render backend URL from Vercel environment variable
// Development: Use the local Vite proxy
const API_URL = "";

export const taskApi = createApi({
  reducerPath: "taskApi",

  baseQuery: fetchBaseQuery({
    baseUrl: `${API_URL}/api/`,
    credentials: "include",
  }),

  tagTypes: ["Tasks"],

  endpoints: (builder) => ({
    // GET all tasks
    getTasks: builder.query<Task[], void>({
      query: () => "tasks",
      providesTags: ["Tasks"],
    }),

    // GET task by ID
    getTaskById: builder.query<Task, number>({
      query: (id) => `tasks/${id}`,
      providesTags: ["Tasks"],
    }),

    // POST create task
    addTask: builder.mutation<Task, TaskInput>({
      query: (task) => ({
        url: "tasks",
        method: "POST",
        body: task,
      }),
      invalidatesTags: ["Tasks"],
    }),

    // PUT update task
    updateTask: builder.mutation<Task, UpdateTaskInput>({
      query: ({ id, ...task }) => ({
        url: `tasks/${id}`,
        method: "PUT",
        body: task,
      }),
      invalidatesTags: ["Tasks"],
    }),

    // DELETE task
    deleteTask: builder.mutation<void, number>({
      query: (id) => ({
        url: `tasks/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["Tasks"],
    }),
  }),
});

export const {
  useGetTasksQuery,
  useGetTaskByIdQuery,
  useAddTaskMutation,
  useUpdateTaskMutation,
  useDeleteTaskMutation,
} = taskApi;
