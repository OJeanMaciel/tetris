import React from 'react'
import ReactDOM from 'react-dom/client'
import Tetris from './component/Tetris.tsx'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
  <div style={{marginBottom: '70px'}}>
    <h1>Tetris Game</h1>
    <Tetris />
  </div>
  </React.StrictMode>,
)
