import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

/**
 * 开发环境自动注入 Mock 数据
 * @description 仅在开发模式下且 localStorage 无数据时注入，方便功能展示和测试
 */
if (import.meta.env.DEV) {
  const existingData = localStorage.getItem('ppl-training-app');
  if (!existingData || existingData === '{}') {
    import('./utils/mockData').then(({ injectMockData }) => {
      injectMockData();
    });
  }
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
