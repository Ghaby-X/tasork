'use client';

interface MetricsProps {
  totalTasks: number;
  completedTasks: number;
  pendingTasks: number;
  inProgressTasks: number;
  overdueTasks: number;
}

export default function DashboardMetrics({
  totalTasks,
  completedTasks,
  pendingTasks,
  inProgressTasks,
  overdueTasks
}: MetricsProps) {
  const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
  
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      <div className="bg-white p-4 rounded-lg shadow-md border-l-4 border-primary">
        <h3 className="text-sm font-medium text-gray-500">Total Tasks</h3>
        <p className="text-2xl font-bold">{totalTasks}</p>
        <div className="mt-2 flex items-center text-sm">
          <span className="text-gray-600">Completion rate: {completionRate}%</span>
        </div>
      </div>
      
      <div className="bg-white p-4 rounded-lg shadow-md border-l-4 border-green-500">
        <h3 className="text-sm font-medium text-gray-500">Completed</h3>
        <p className="text-2xl font-bold">{completedTasks}</p>
        <div className="mt-2 flex items-center text-sm">
          <span className="text-green-600">{completionRate}% of all tasks</span>
        </div>
      </div>
      
      <div className="bg-white p-4 rounded-lg shadow-md border-l-4 border-blue-500">
        <h3 className="text-sm font-medium text-gray-500">In Progress</h3>
        <p className="text-2xl font-bold">{inProgressTasks}</p>
        <div className="mt-2 flex items-center text-sm">
          <span className="text-blue-600">{totalTasks > 0 ? Math.round((inProgressTasks / totalTasks) * 100) : 0}% of all tasks</span>
        </div>
      </div>
      
      <div className="bg-white p-4 rounded-lg shadow-md border-l-4 border-red-500">
        <h3 className="text-sm font-medium text-gray-500">Overdue</h3>
        <p className="text-2xl font-bold">{overdueTasks}</p>
        <div className="mt-2 flex items-center text-sm">
          <span className="text-red-600">{totalTasks > 0 ? Math.round((overdueTasks / totalTasks) * 100) : 0}% of all tasks</span>
        </div>
      </div>
    </div>
  );
}