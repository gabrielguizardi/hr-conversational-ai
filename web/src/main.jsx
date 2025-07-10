import { StrictMode } from "react"
import { createRoot } from "react-dom/client"
import { createBrowserRouter, RouterProvider } from "react-router"

import { DefaultLayout } from "./layouts/default-layout"

import { Gemini } from "@/views/gemini"
import { JobVacancyList } from "@/views/job-vacancy-list"
import { JobVacancyCreate } from "@/views/job-vacancy-create"
import { JobVacancyShow } from "@/views/job-vacancy-show"
import { Meet } from "@/views/meet"

import GeminiLiveApiProvider from "@/providers/GeminiLiveApiProvider"

import "./index.css"

const router = createBrowserRouter([
  {
    path: "/",
    Component: DefaultLayout,
    children: [
      {
        index: true,
        Component: JobVacancyList,
      },
      {
        path: "job-vacancies/create",
        Component: JobVacancyCreate,
      },
      {
        path: "job-vacancies/:jobVacancyId/show",
        Component: JobVacancyShow,
      },
      {
        path: "meet/:jobCandidateId",
        Component: Meet,
      },
    ],
  },
])

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <GeminiLiveApiProvider>
      <RouterProvider router={router} />
    </GeminiLiveApiProvider>
  </StrictMode>
)
