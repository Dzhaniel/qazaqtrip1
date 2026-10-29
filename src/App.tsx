import { lazy, Suspense, useEffect } from 'react';
import { BrowserRouter, Route, Routes, useLocation } from 'react-router-dom';
import Layout from './components/layout/Layout';
import PageLoader from './components/PageLoader';

const HomePage = lazy(() => import('./pages/HomePage'));
const CityOverview = lazy(() => import('./pages/city/CityOverview'));
const CitySights = lazy(() => import('./pages/city/CitySights'));
const CityHotels = lazy(() => import('./pages/city/CityHotels'));
const CityMap = lazy(() => import('./pages/city/CityMap'));
const CityPhrases = lazy(() => import('./pages/city/CityPhrases'));
const GuidePage = lazy(() => import('./pages/GuidePage'));
const AboutPage = lazy(() => import('./pages/AboutPage'));
const NotFoundPage = lazy(() => import('./pages/NotFoundPage'));

function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior });
  }, [pathname]);
  return null;
}

export default function App() {
  return (
    <BrowserRouter>
      <ScrollToTop />
      <Layout>
        <Suspense fallback={<PageLoader />}>
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/city/:cityId" element={<CityOverview />} />
            <Route path="/city/:cityId/sights" element={<CitySights />} />
            <Route path="/city/:cityId/hotels" element={<CityHotels />} />
            <Route path="/city/:cityId/map" element={<CityMap />} />
            <Route path="/city/:cityId/phrases" element={<CityPhrases />} />
            <Route path="/guide" element={<GuidePage />} />
            <Route path="/about" element={<AboutPage />} />
            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </Suspense>
      </Layout>
    </BrowserRouter>
  );
}
