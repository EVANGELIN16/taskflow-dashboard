
import {
  createApi,
  fetchBaseQuery,
} from "@reduxjs/toolkit/query/react";

import type {
  Project,
  ProjectInput,
} from "../types/project";

// Render backend URL in production.
// Locally, requests continue through the Vite proxy.
const API_URL = "";

export const projectApi = createApi({
  reducerPath: "projectApi",

  baseQuery: fetchBaseQuery({
    baseUrl: `${API_URL}/api/`,
    credentials: "include",
  }),

  tagTypes: ["Projects"],

  endpoints: (builder) => ({
    // GET all projects belonging to the logged-in user
    getProjects: builder.query<Project[], void>({
      query: () => "projects",
      providesTags: ["Projects"],
    }),

    // POST create a project
    addProject: builder.mutation<Project, ProjectInput>({
      query: (project) => ({
        url: "projects",
        method: "POST",
        body: project,
      }),
      invalidatesTags: ["Projects"],
    }),

    // PUT update an existing project
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

    // DELETE a project
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
