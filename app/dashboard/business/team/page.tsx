'use client';

import { useState, useEffect } from 'react';
import { AIAnalysisButton } from '@/components/ai/AIAnalysisButton';

export default function TeamPage() {
  const [activeTab, setActiveTab] = useState('members');
  const [loading, setLoading] = useState(true);

  // Team Members state
  const [teamMembers, setTeamMembers] = useState<any[]>([]);
  const [showInviteMemberModal, setShowInviteMemberModal] = useState(false);

  // Tasks state
  const [tasks, setTasks] = useState<any[]>([]);
  const [taskSummary, setTaskSummary] = useState<any>(null);
  const [showCreateTaskModal, setShowCreateTaskModal] = useState(false);
  const [taskFilters, setTaskFilters] = useState({
    assignedTo: 'all',
    status: 'all',
    priority: 'all',
  });

  // Activity Feed state
  const [activities, setActivities] = useState<any[]>([]);

  // Analytics state
  const [analytics, setAnalytics] = useState<any>(null);
  const [aiAnalysis, setAiAnalysis] = useState<any>(null);

  // Invite member form
  const [inviteForm, setInviteForm] = useState({
    email: '',
    role: 'member',
    department: '',
    title: '',
  });

  // Create task form
  const [taskForm, setTaskForm] = useState({
    title: '',
    description: '',
    assignedTo: '',
    priority: 'medium',
    dueDate: '',
    linkedSection: '',
  });

  useEffect(() => {
    fetchData();
  }, [activeTab, taskFilters]);

  const fetchData = async () => {
    try {
      setLoading(true);

      if (activeTab === 'members') {
        const response = await fetch('/api/business/team/members');
        const data = await response.json();
        if (data.success) {
          setTeamMembers(data.members || []);
        }
      } else if (activeTab === 'tasks') {
        const params = new URLSearchParams({
          assignedTo: taskFilters.assignedTo,
          status: taskFilters.status,
          priority: taskFilters.priority,
        });
        const response = await fetch(`/api/business/team/tasks?${params}`);
        const data = await response.json();
        if (data.success) {
          setTasks(data.tasks || []);
          setTaskSummary(data.summary);
        }
      } else if (activeTab === 'activity') {
        const response = await fetch('/api/business/team/activity?limit=50');
        const data = await response.json();
        if (data.success) {
          setActivities(data.activities || []);
        }
      } else if (activeTab === 'analytics') {
        const response = await fetch('/api/business/team/analytics?dateRange=30');
        const data = await response.json();
        if (data.success) {
          setAnalytics(data);
        }
      }
    } catch (error) {
      console.error('Error fetching data:', error);
      alert('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const handleInviteMember = async () => {
    if (!inviteForm.email) {
      alert('Please enter an email address');
      return;
    }

    try {
      const response = await fetch('/api/business/team/members', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(inviteForm),
      });

      const data = await response.json();

      if (data.success) {
        alert('Team member invited successfully!');
        setShowInviteMemberModal(false);
        setInviteForm({ email: '', role: 'member', department: '', title: '' });
        fetchData();
      } else {
        alert(`Error: ${data.error}`);
      }
    } catch (error) {
      console.error('Error inviting member:', error);
      alert('Failed to invite member');
    }
  };

  const handleCreateTask = async () => {
    if (!taskForm.title) {
      alert('Please enter a task title');
      return;
    }

    try {
      const response = await fetch('/api/business/team/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(taskForm),
      });

      const data = await response.json();

      if (data.success) {
        alert('Task created successfully!');
        setShowCreateTaskModal(false);
        setTaskForm({
          title: '',
          description: '',
          assignedTo: '',
          priority: 'medium',
          dueDate: '',
          linkedSection: '',
        });
        fetchData();
      } else {
        alert(`Error: ${data.error}`);
      }
    } catch (error) {
      console.error('Error creating task:', error);
      alert('Failed to create task');
    }
  };

  const handleUpdateTaskStatus = async (taskId: string, newStatus: string) => {
    try {
      const response = await fetch(`/api/business/team/tasks/${taskId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });

      const data = await response.json();

      if (data.success) {
        fetchData();
      } else {
        alert(`Error: ${data.error}`);
      }
    } catch (error) {
      console.error('Error updating task:', error);
      alert('Failed to update task');
    }
  };

  if (loading && activeTab !== 'analytics') {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-black p-8 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-600 border-t-transparent mx-auto mb-4"></div>
          <div className="text-lg text-gray-600 dark:text-gray-400">Loading Team Hub...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-black p-6">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Team & Collaboration Hub</h1>
            <p className="text-gray-600 dark:text-gray-400 mt-2">
              Manage your team, assign tasks, and collaborate effectively
            </p>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
          <div className="flex border-b border-gray-200 dark:border-gray-700">
            <button
              onClick={() => setActiveTab('members')}
              className={`px-6 py-3 font-medium ${
                activeTab === 'members'
                  ? 'border-b-2 border-blue-600 text-blue-600'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              Team Members
            </button>
            <button
              onClick={() => setActiveTab('tasks')}
              className={`px-6 py-3 font-medium ${
                activeTab === 'tasks'
                  ? 'border-b-2 border-blue-600 text-blue-600'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              Tasks
            </button>
            <button
              onClick={() => setActiveTab('activity')}
              className={`px-6 py-3 font-medium ${
                activeTab === 'activity'
                  ? 'border-b-2 border-blue-600 text-blue-600'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              Activity Feed
            </button>
            <button
              onClick={() => setActiveTab('analytics')}
              className={`px-6 py-3 font-medium ${
                activeTab === 'analytics'
                  ? 'border-b-2 border-blue-600 text-blue-600'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              Analytics
            </button>
          </div>

          {/* Tab Content */}
          <div className="p-6">
            {/* Team Members Tab */}
            {activeTab === 'members' && (
              <div className="space-y-6">
                <div className="flex justify-between items-center">
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Team Members</h2>
                  <button
                    onClick={() => setShowInviteMemberModal(true)}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  >
                    + Invite Member
                  </button>
                </div>

                <div className="space-y-3">
                  {teamMembers.length === 0 ? (
                    <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                      No team members yet. Start by inviting your first team member!
                    </div>
                  ) : (
                    teamMembers.map((member: any) => (
                      <div
                        key={member.id}
                        className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 border border-gray-200 dark:border-gray-600"
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="flex items-center gap-2">
                              <h3 className="font-semibold text-gray-900 dark:text-white">
                                {member.userName || member.userEmail}
                              </h3>
                              <span className={`px-2 py-1 text-xs rounded ${
                                member.role === 'owner'
                                  ? 'bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-200'
                                  : member.role === 'admin'
                                  ? 'bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200'
                                  : 'bg-gray-100 dark:bg-gray-600 text-gray-800 dark:text-gray-200'
                              }`}>
                                {member.role}
                              </span>
                              {member.status === 'pending_invitation' && (
                                <span className="px-2 py-1 text-xs rounded bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200">
                                  Pending
                                </span>
                              )}
                            </div>
                            <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                              {member.department && `${member.department}`}
                              {member.title && ` • ${member.title}`}
                              {member.joinedAt && ` • Joined ${new Date(member.joinedAt).toLocaleDateString()}`}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}

            {/* Tasks Tab */}
            {activeTab === 'tasks' && (
              <div className="space-y-6">
                <div className="flex justify-between items-center">
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Team Tasks</h2>
                  <button
                    onClick={() => setShowCreateTaskModal(true)}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  >
                    + Create Task
                  </button>
                </div>

                {/* Filters */}
                <div className="flex gap-4">
                  <select
                    value={taskFilters.assignedTo}
                    onChange={(e) => setTaskFilters({ ...taskFilters, assignedTo: e.target.value })}
                    className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  >
                    <option value="all">All Assignees</option>
                    <option value="me">My Tasks</option>
                    {teamMembers.map((m: any) => (
                      <option key={m.userId} value={m.userId}>{m.userName}</option>
                    ))}
                  </select>
                  <select
                    value={taskFilters.status}
                    onChange={(e) => setTaskFilters({ ...taskFilters, status: e.target.value })}
                    className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  >
                    <option value="all">All Status</option>
                    <option value="todo">To Do</option>
                    <option value="in_progress">In Progress</option>
                    <option value="blocked">Blocked</option>
                    <option value="completed">Completed</option>
                  </select>
                  <select
                    value={taskFilters.priority}
                    onChange={(e) => setTaskFilters({ ...taskFilters, priority: e.target.value })}
                    className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  >
                    <option value="all">All Priorities</option>
                    <option value="urgent">Urgent</option>
                    <option value="high">High</option>
                    <option value="medium">Medium</option>
                    <option value="low">Low</option>
                  </select>
                </div>

                {/* Task Summary */}
                {taskSummary && (
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                    <div className="bg-white dark:bg-gray-700 rounded-lg p-4 border border-gray-200 dark:border-gray-600">
                      <p className="text-sm text-gray-600 dark:text-gray-400">Total</p>
                      <p className="text-2xl font-bold text-gray-900 dark:text-white">{taskSummary.totalTasks}</p>
                    </div>
                    <div className="bg-white dark:bg-gray-700 rounded-lg p-4 border border-gray-200 dark:border-gray-600">
                      <p className="text-sm text-gray-600 dark:text-gray-400">To Do</p>
                      <p className="text-2xl font-bold text-gray-900 dark:text-white">{taskSummary.todoTasks}</p>
                    </div>
                    <div className="bg-white dark:bg-gray-700 rounded-lg p-4 border border-gray-200 dark:border-gray-600">
                      <p className="text-sm text-gray-600 dark:text-gray-400">In Progress</p>
                      <p className="text-2xl font-bold text-blue-600">{taskSummary.inProgressTasks}</p>
                    </div>
                    <div className="bg-white dark:bg-gray-700 rounded-lg p-4 border border-gray-200 dark:border-gray-600">
                      <p className="text-sm text-gray-600 dark:text-gray-400">Completed</p>
                      <p className="text-2xl font-bold text-green-600">{taskSummary.completedTasks}</p>
                    </div>
                    <div className="bg-white dark:bg-gray-700 rounded-lg p-4 border border-gray-200 dark:border-gray-600">
                      <p className="text-sm text-gray-600 dark:text-gray-400">Overdue</p>
                      <p className="text-2xl font-bold text-red-600">{taskSummary.overdueTasks}</p>
                    </div>
                  </div>
                )}

                {/* Tasks List */}
                <div className="space-y-3">
                  {tasks.length === 0 ? (
                    <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                      No tasks found. Create your first task!
                    </div>
                  ) : (
                    tasks.map((task: any) => (
                      <div
                        key={task.id}
                        className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 border border-gray-200 dark:border-gray-600"
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <h3 className="font-semibold text-gray-900 dark:text-white">{task.title}</h3>
                              <span className={`px-2 py-1 text-xs rounded ${
                                task.priority === 'urgent'
                                  ? 'bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200'
                                  : task.priority === 'high'
                                  ? 'bg-orange-100 dark:bg-orange-900 text-orange-800 dark:text-orange-200'
                                  : task.priority === 'medium'
                                  ? 'bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200'
                                  : 'bg-gray-100 dark:bg-gray-600 text-gray-800 dark:text-gray-200'
                              }`}>
                                {task.priority}
                              </span>
                              <span className={`px-2 py-1 text-xs rounded ${
                                task.status === 'completed'
                                  ? 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200'
                                  : task.status === 'in_progress'
                                  ? 'bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200'
                                  : task.status === 'blocked'
                                  ? 'bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200'
                                  : 'bg-gray-100 dark:bg-gray-600 text-gray-800 dark:text-gray-200'
                              }`}>
                                {task.status}
                              </span>
                            </div>
                            {task.description && (
                              <p className="text-sm text-gray-700 dark:text-gray-300 mt-2">{task.description}</p>
                            )}
                            <div className="text-sm text-gray-600 dark:text-gray-400 mt-2">
                              {task.assigneeName && `Assigned to: ${task.assigneeName}`}
                              {task.dueDate && ` • Due: ${new Date(task.dueDate).toLocaleDateString()}`}
                              {task.linkedSection && ` • ${task.linkedSection}`}
                            </div>
                          </div>
                          <div className="flex gap-2">
                            {task.status !== 'completed' && (
                              <button
                                onClick={() => handleUpdateTaskStatus(task.id, 'completed')}
                                className="px-3 py-1 text-sm bg-green-600 text-white rounded hover:bg-green-700"
                              >
                                Complete
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}

            {/* Activity Feed Tab */}
            {activeTab === 'activity' && (
              <div className="space-y-6">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Team Activity Feed</h2>

                <div className="space-y-3">
                  {activities.length === 0 ? (
                    <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                      No recent activity
                    </div>
                  ) : (
                    activities.map((activity: any) => (
                      <div
                        key={activity.id}
                        className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 border border-gray-200 dark:border-gray-600"
                      >
                        <div className="flex items-start gap-3">
                          <div className="flex-1">
                            <p className="text-gray-900 dark:text-white">{activity.activityText}</p>
                            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                              {new Date(activity.createdAt).toLocaleString()}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}

            {/* Analytics Tab */}
            {activeTab === 'analytics' && analytics && (
              <div className="space-y-6">
                <div className="flex justify-between items-center">
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Team Analytics</h2>
                  {/* AI Coach Button - coming soon */}
                </div>

                {/* Summary Cards */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="bg-white dark:bg-gray-700 rounded-lg p-4 border border-gray-200 dark:border-gray-600">
                    <p className="text-sm text-gray-600 dark:text-gray-400">Team Size</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">{analytics.summary.teamSize}</p>
                  </div>
                  <div className="bg-white dark:bg-gray-700 rounded-lg p-4 border border-gray-200 dark:border-gray-600">
                    <p className="text-sm text-gray-600 dark:text-gray-400">Total Tasks</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">{analytics.summary.totalTasks}</p>
                  </div>
                  <div className="bg-white dark:bg-gray-700 rounded-lg p-4 border border-gray-200 dark:border-gray-600">
                    <p className="text-sm text-gray-600 dark:text-gray-400">Avg Completion</p>
                    <p className="text-2xl font-bold text-green-600">{analytics.summary.avgCompletionRate}%</p>
                  </div>
                  <div className="bg-white dark:bg-gray-700 rounded-lg p-4 border border-gray-200 dark:border-gray-600">
                    <p className="text-sm text-gray-600 dark:text-gray-400">Overdue</p>
                    <p className="text-2xl font-bold text-red-600">{analytics.summary.overdueTasks}</p>
                  </div>
                </div>

                {/* Workload Distribution */}
                <div>
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-3">Workload Distribution</h3>
                  <div className="space-y-3">
                    {analytics.memberMetrics.map((member: any) => (
                      <div key={member.userId} className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-medium text-gray-900 dark:text-white">{member.userName}</span>
                          <span className="text-sm text-gray-600 dark:text-gray-400">
                            {member.totalTasks} tasks • {member.completionRate}% complete
                          </span>
                        </div>
                        <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-2">
                          <div
                            className="bg-blue-600 h-2 rounded-full"
                            style={{ width: `${member.completionRate}%` }}
                          ></div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Invite Member Modal */}
      {showInviteMemberModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Invite Team Member</h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Email Address *
                </label>
                <input
                  type="email"
                  value={inviteForm.email}
                  onChange={(e) => setInviteForm({ ...inviteForm, email: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  placeholder="colleague@example.com"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Role
                </label>
                <select
                  value={inviteForm.role}
                  onChange={(e) => setInviteForm({ ...inviteForm, role: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                >
                  <option value="member">Member</option>
                  <option value="admin">Admin</option>
                  <option value="viewer">Viewer</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Department
                </label>
                <input
                  type="text"
                  value={inviteForm.department}
                  onChange={(e) => setInviteForm({ ...inviteForm, department: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  placeholder="Sales, Marketing, etc."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Title
                </label>
                <input
                  type="text"
                  value={inviteForm.title}
                  onChange={(e) => setInviteForm({ ...inviteForm, title: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  placeholder="Sales Manager, etc."
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => setShowInviteMemberModal(false)}
                className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
              >
                Cancel
              </button>
              <button
                onClick={handleInviteMember}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Send Invitation
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create Task Modal */}
      {showCreateTaskModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Create Task</h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Task Title *
                </label>
                <input
                  type="text"
                  value={taskForm.title}
                  onChange={(e) => setTaskForm({ ...taskForm, title: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  placeholder="What needs to be done?"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Description
                </label>
                <textarea
                  value={taskForm.description}
                  onChange={(e) => setTaskForm({ ...taskForm, description: e.target.value })}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  placeholder="Task details..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Assign To
                </label>
                <select
                  value={taskForm.assignedTo}
                  onChange={(e) => setTaskForm({ ...taskForm, assignedTo: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                >
                  <option value="">Unassigned</option>
                  {teamMembers.filter(m => m.status === 'active').map((m: any) => (
                    <option key={m.userId} value={m.userId}>{m.userName}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Priority
                  </label>
                  <select
                    value={taskForm.priority}
                    onChange={(e) => setTaskForm({ ...taskForm, priority: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="urgent">Urgent</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Due Date
                  </label>
                  <input
                    type="date"
                    value={taskForm.dueDate}
                    onChange={(e) => setTaskForm({ ...taskForm, dueDate: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Linked Section
                </label>
                <select
                  value={taskForm.linkedSection}
                  onChange={(e) => setTaskForm({ ...taskForm, linkedSection: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                >
                  <option value="">None</option>
                  <option value="planning">Planning</option>
                  <option value="execution">Execution</option>
                  <option value="marketing">Marketing</option>
                  <option value="clients">Clients</option>
                  <option value="offers">Offers</option>
                  <option value="scripts">Scripts</option>
                </select>
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => setShowCreateTaskModal(false)}
                className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateTask}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Create Task
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
