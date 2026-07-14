import { RouterProvider, createBrowserRouter } from 'react-router-dom'
import { routes } from './router'

// v7_relativeSplatPath is a data-router future flag (createBrowserRouter);
// v7_startTransition is a RouterProvider flag — they live in different places.
const router = createBrowserRouter(routes, {
  future: {
    v7_relativeSplatPath: true,
  },
})

export function App() {
  return <RouterProvider router={router} future={{ v7_startTransition: true }} />
}
