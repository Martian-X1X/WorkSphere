import { useParams } from 'react-router-dom'

export default function ProjectDetailPage() {
  const { projectId } = useParams()
  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-surface-50">Project Detail</h1>
        <p className="text-surface-400 mt-1 text-sm">
          Project ID: {projectId} — Coming Day 43
        </p>
      </div>
      <div className="card text-center py-16">
        <p className="text-surface-500">Task list for this project — Day 43</p>
      </div>
    </div>
  )
}