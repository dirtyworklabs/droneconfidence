import { Suspense, lazy } from 'react'
import { Route, Routes } from 'react-router-dom'
import { Layout } from '@/components/layout/Layout'
import { ROUTES } from '@/lib/routes'

/**
 * The homepage ships in the initial bundle; everything else is split so the
 * first paint stays small. Sessions and Book are the two most likely next
 * navigations, so their chunks are deliberately tiny.
 */
import Home from '@/pages/Home'

const Sessions = lazy(() => import('@/pages/Sessions'))
const Locations = lazy(() => import('@/pages/Locations'))
const About = lazy(() => import('@/pages/About'))
const Faq = lazy(() => import('@/pages/Faq'))
const Book = lazy(() => import('@/pages/Book'))
const Contact = lazy(() => import('@/pages/Contact'))
const Privacy = lazy(() => import('@/pages/Privacy'))
const BookingPolicy = lazy(() => import('@/pages/BookingPolicy'))
const NotFound = lazy(() => import('@/pages/NotFound'))

/**
 * Route fallback. Deliberately quiet: chunks are small enough that a spinner
 * would flash more often than it would reassure. The reserved height keeps the
 * footer from jumping up the viewport mid-navigation.
 */
const RouteFallback = () => <div aria-hidden="true" className="min-h-[70vh] bg-canvas" />

const App = () => (
  <Routes>
    <Route element={<Layout />}>
      <Route path={ROUTES.home} element={<Home />} />
      <Route
        path={ROUTES.sessions}
        element={
          <Suspense fallback={<RouteFallback />}>
            <Sessions />
          </Suspense>
        }
      />
      <Route
        path={ROUTES.locations}
        element={
          <Suspense fallback={<RouteFallback />}>
            <Locations />
          </Suspense>
        }
      />
      <Route
        path={ROUTES.about}
        element={
          <Suspense fallback={<RouteFallback />}>
            <About />
          </Suspense>
        }
      />
      <Route
        path={ROUTES.faq}
        element={
          <Suspense fallback={<RouteFallback />}>
            <Faq />
          </Suspense>
        }
      />
      <Route
        path={ROUTES.book}
        element={
          <Suspense fallback={<RouteFallback />}>
            <Book />
          </Suspense>
        }
      />
      <Route
        path={ROUTES.contact}
        element={
          <Suspense fallback={<RouteFallback />}>
            <Contact />
          </Suspense>
        }
      />
      <Route
        path={ROUTES.privacy}
        element={
          <Suspense fallback={<RouteFallback />}>
            <Privacy />
          </Suspense>
        }
      />
      <Route
        path={ROUTES.bookingPolicy}
        element={
          <Suspense fallback={<RouteFallback />}>
            <BookingPolicy />
          </Suspense>
        }
      />
      <Route
        path="*"
        element={
          <Suspense fallback={<RouteFallback />}>
            <NotFound />
          </Suspense>
        }
      />
    </Route>
  </Routes>
)

export default App
