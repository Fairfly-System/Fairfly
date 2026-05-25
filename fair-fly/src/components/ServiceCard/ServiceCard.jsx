import React from 'react'
import './service-card.css'

export default function ServiceCard({ icon, iconBg, title, desc }) {
  return (
    <article className="card">
      <div className="iconWrap"style={{ background: iconBg }}>
        {icon}
      </div>
      <h3 className="title">{title}</h3>
      <p className="desc">{desc}</p>
    </article>
  )
}
