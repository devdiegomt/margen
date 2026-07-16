import { HashRouter, Route, Routes } from 'react-router-dom';
import { Shell } from './components/layout/Shell';
import { Library } from './pages/Library';
import { BookDetail } from './pages/BookDetail';
import { Pendings } from './pages/Pendings';

export function App() {
  return (
    <HashRouter>
      <Routes>
        <Route element={<Shell />}>
          <Route path="/" element={<Library />} />
          <Route path="/libro/:id" element={<BookDetail />} />
          <Route path="/pendientes" element={<Pendings />} />
        </Route>
      </Routes>
    </HashRouter>
  );
}
