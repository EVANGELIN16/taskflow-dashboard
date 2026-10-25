import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";

import type { Project, ProjectInput } from "../types/project";

export const projectApi = createApi({
  reducerPath: "projectApi",

  baseQuery: fetchBaseQuery({
    baseUrl: "http://localhost:5000/api/",
    credentials: "include",
  }),

  tagTypes: ["Projects"],

  endpoints: (builder) => ({
    getProjects: builder.query<Project[], void>({
      query: () => "projects",
      providesTags: ["Projects"],
    }),

    addProject: builder.mutation<Project, ProjectInput>({
      query: (project) => ({
        url: "projects",
        method: "POST",
        body: project,
      }),
      invalidatesTags: ["Projects"],
    }),

    updateProject: builder.mutation<Project, Project>({
      query: (project) => ({
        url: `projects/${project.id}`,
        method: "PUT",
        body: {
          name: project.name,
          status: project.status,
        },
      }),
      invalidatesTags: ["Projects"],
    }),

    deleteProject: builder.mutation<void, number>({
      query: (id) => ({
        url: `projects/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["Projects"],
    }),
  }),
});

export const {
  useGetProjectsQuery,
  useAddProjectMutation,
  useUpdateProjectMutation,
  useDeleteProjectMutation,
} = projectApi;
