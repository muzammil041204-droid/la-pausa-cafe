import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Route, Routes } from 'react-router-dom'
import { MenuProvider } from './lib/store'
import Menu from './pages/Menu'
import Admin from './pages/Admin'
import './index.css'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <MenuProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/admin/*" element={<Admin />} />
          <Route path="*" element={<Menu />} />
        </Routes>
      </BrowserRouter>
    </MenuProvider>
  </StrictMode>,
)
