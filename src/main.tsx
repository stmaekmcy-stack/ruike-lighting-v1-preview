import { StrictMode } from 'react'
import { createRoot, hydrateRoot } from 'react-dom/client'
import App from './App'
import KnowledgePage from './KnowledgePage'
import { knowledgePages } from './content/pages'
import './styles.css'
import './knowledge.css'

const path = window.location.pathname.slice(import.meta.env.BASE_URL.length).replace(/\/$/, '')
const page = knowledgePages.find((item) => item.slug === path)
const app = (
  <StrictMode>
    {page ? <KnowledgePage page={page} /> : <App />}
  </StrictMode>
)
const root = document.getElementById('root')!
if (root.hasChildNodes()) hydrateRoot(root, app)
else createRoot(root).render(app)
