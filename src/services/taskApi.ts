import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";

import type { Task, TaskInput, UpdateTaskInput } from "../types/task";

export const taskApi = createApi({
  reducerPath: "taskApi",

  baseQuery: fetchBaseQuery({
    baseUrl: "http://localhost:5000/api/",
    credentials: "include",
  }),

  tagTypes: ["Tasks"],

  endpoints: (builder) => ({
    getTasks: builder.query<Task[], void>({
      query: () => "tasks",
      providesTags: ["Tasks"],
    }),

    getTaskById: builder.query<Task, number>({
      query: (id) => `tasks/${id}`,
      providesTags: ["Tasks"],
    }),

    addTask: builder.mutation<Task, TaskInput>({
      query: (task) => ({
        url: "tasks",
        method: "POST",
        body: task,
      }),
      invalidatesTags: ["Tasks"],
    }),

    updateTask: builder.mutation<Task, UpdateTaskInput>({
      query: ({ id, ...task }) => ({
        url: `tasks/${id}`,
        method: "PUT",
        body: task,
      }),
      invalidatesTags: ["Tasks"],
    }),

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
