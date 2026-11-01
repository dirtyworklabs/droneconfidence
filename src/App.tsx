import { Suspense, lazy } from 'react'
import { Route, Routes } from 'react-router-dom'
import { BRAND_ICON } from '@shared/brand'
import { Layout } from '@/components/layout/Layout'
import { usePageTracking } from '@/lib/pageTracking'
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
const Blog = lazy(() => import('@/pages/Blog'))
const BlogPost = lazy(() => import('@/pages/BlogPost'))
const Book = lazy(() => import('@/pages/Book'))
const Contact = lazy(() => import('@/pages/Contact'))
const Privacy = lazy(() => import('@/pages/Privacy'))
const BookingPolicy = lazy(() => import('@/pages/BookingPolicy'))
const BookingConfirmed = lazy(() => import('@/pages/BookingConfirmed'))
const NotFound = lazy(() => import('@/pages/NotFound'))

/**
 * Local-only email preview page.
 *
 * This page and route are only included while running Vite in development
 * mode. Production builds do not expose /email-preview.
 */
const EmailPreview = import.meta.env.DEV
  ? lazy(() => import('@/pages/EmailPreview'))
  : null

/**
 * The owner dashboard is split out separately and deliberately sits outside the
 * marketing layout — it has no site navigation, no footer and no place in the
 * public information architecture.
 */
const AdminLogin = lazy(() => import('@/pages/AdminLogin'))
const Admin = lazy(() => import('@/pages/Admin'))

/**
 * Route fallback. Deliberately quiet: chunks are small enough that a spinner
 * would flash more often than it would reassure, so the brand icon only fades
 * in if a load is genuinely slow. The reserved height keeps the footer from
 * jumping up the viewport mid-navigation.
 */
const RouteFallback = () => (
  <div
    aria-hidden="true"
    className="grid min-h-[70vh] place-items-center bg-canvas"
  >
    <img
      src={BRAND_ICON.src}
      width={BRAND_ICON.width}
      height={BRAND_ICON.height}
      alt=""
      className="size-12 animate-brand-settle"
    />
  </div>
)

/**
 * First-party page-view tracking, mounted once above the route tree so one
 * navigation produces one event rather than one per render. Renders nothing,
 * blocks no route, and skips the /admin surfaces.
 */
const PageViewTracker = () => {
  usePageTracking()
  return null
}

const App = () => (
  <>
    <PageViewTracker />

    <Routes>
      <Route element={<Layout />}>
        <Route
          path={ROUTES.home}
          element={<Home />}
        />

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
          path={ROUTES.blog}
          element={
            <Suspense fallback={<RouteFallback />}>
              <Blog />
            </Suspense>
          }
        />

        <Route
          path={ROUTES.blogPost}
          element={
            <Suspense fallback={<RouteFallback />}>
              <BlogPost />
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
          path={ROUTES.bookingConfirmed}
          element={
            <Suspense fallback={<RouteFallback />}>
              <BookingConfirmed />
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

      {import.meta.env.DEV && EmailPreview ? (
        <Route
          path="/email-preview"
          element={
            <Suspense fallback={<RouteFallback />}>
              <EmailPreview />
            </Suspense>
          }
        />
      ) : null}

      <Route
        path={ROUTES.adminLogin}
        element={
          <Suspense fallback={<RouteFallback />}>
            <AdminLogin />
          </Suspense>
        }
      />

      <Route
        path={ROUTES.admin}
        element={
          <Suspense fallback={<RouteFallback />}>
            <Admin />
          </Suspense>
        }
      />
    </Routes>
  </>
)

export default App