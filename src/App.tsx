// src/App.tsx
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AppLayout } from './components/ui/AppLayout';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<AppLayout />} />
      </Routes>
    </Router>
  );
}

export default App;
