import { useEffect, useState } from 'react'

import { FormPageHeader, FormSheet } from './common'
import { fetchOverview } from './api'

type OverviewItem = {
  id: number
  form_type: string
  created_at: string
  title: string
}

export function OverviewPage() {
  const [items, setItems] = useState<OverviewItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let isMounted = true

    fetchOverview()
      .then((records) => {
        if (!isMounted) return
        setItems(records)
        setError(null)
      })
      .catch(() => {
        if (!isMounted) return
        setError('Unable to load overview records.')
      })
      .finally(() => {
        if (!isMounted) return
        setLoading(false)
      })

    return () => {
      isMounted = false
    }
  }, [])

  return (
    <main className="page-canvas">
      <FormPageHeader title="OVERVIEW" />
      <FormSheet>
        {loading && <p className="form-message">Loading saved records...</p>}
        {error && <p className="form-message form-message--error">{error}</p>}

        {!loading && !error && items.length === 0 && (
          <p className="form-message">No saved forms yet.</p>
        )}

        {!loading && !error && items.length > 0 && (
          <div className="table-wrap">
            <table className="plain-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>FORM TYPE</th>
                  <th>TITLE</th>
                  <th>CREATED AT</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item) => (
                  <tr key={item.id}>
                    <td>{item.id}</td>
                    <td>{item.form_type}</td>
                    <td>{item.title}</td>
                    <td>{new Date(item.created_at).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </FormSheet>
    </main>
  )
}
