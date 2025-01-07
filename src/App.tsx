import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import SnakeGame from './components/SnakeGame';

const App = () => {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<SnakeGame />} />
      </Routes>
    </Router>
  );
};

export default App;