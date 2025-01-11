import { HashRouter, Routes, Route } from 'react-router-dom'
import SnakeGame from './components/SnakeGame'

function App() {
  return (
    <HashRouter>
      <Routes>
        <Route path="/" element={<SnakeGame />} />
      </Routes>
    </HashRouter>
  )
}

export default App