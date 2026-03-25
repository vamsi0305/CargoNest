type PlaceholderPageProps = {
  title: string
  description: string
}

export function PlaceholderPage({ title, description }: PlaceholderPageProps) {
  return (
    <section className="panel">
      <div className="section-heading">
        <div>
          <p className="eyebrow">Coming next</p>
          <h2>{title}</h2>
        </div>
      </div>
      <p>{description}</p>
    </section>
  )
}
