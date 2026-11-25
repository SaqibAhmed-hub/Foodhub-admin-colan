/** tone: neutral | success | warn | danger | info */
export default function Badge({ tone = 'neutral', children }) {
  return <span className={`badge ${tone === 'neutral' ? '' : `badge-${tone}`}`.trim()}>{children}</span>
}
