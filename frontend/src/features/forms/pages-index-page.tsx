import { Link } from 'react-router-dom'

import { pageLinks } from './page-links'

export function PagesIndexPage() {
  return (
    <main className="page-canvas">
      <section className="form-sheet options-sheet">
        <h1 className="options-title">CargoNest Enterprise Forms</h1>
        <p className="options-subtitle">Open any module page from below.</p>

        <div className="options-grid">
          {pageLinks.map((page) => (
            <Link key={page.to} to={page.to} className="page-option">
              {page.label}
            </Link>
          ))}
        </div>
      </section>
    </main>
  )
}
