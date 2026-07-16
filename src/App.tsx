import { HashRouter, Route, Routes } from 'react-router-dom';
import { Shell } from './components/layout/Shell';
import { Library } from './pages/Library';
import { BookDetail } from './pages/BookDetail';
import { Pendings } from './pages/Pendings';
import { Search } from './pages/Search';
import { Data } from './pages/Data';
import { Focus } from './pages/Focus';

export function App() {
  return (
    <HashRouter>
      <Routes>
        <Route element={<Shell />}>
          <Route path="/" element={<Library />} />
          <Route path="/libro/:id" element={<BookDetail />} />
          <Route path="/pendientes" element={<Pendings />} />
          <Route path="/buscar" element={<Search />} />
          <Route path="/enfoque" element={<Focus />} />
          <Route path="/datos" element={<Data />} />
        </Route>
      </Routes>
    </HashRouter>
  );
}
