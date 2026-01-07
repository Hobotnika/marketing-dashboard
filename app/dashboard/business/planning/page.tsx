'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

type Tab = 'calendar' | 'okrs' | 'vision' | 'reviews' | 'silent-time';

export default function PlanningDashboard() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<Tab>('calendar');
  const [loading, setLoading] = useState(true);

  // Calendar state
  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7)); // YYYY-MM
  const [activities, setActivities] = useState<any[]>([]);
  const [showAddActivity, setShowAddActivity] = useState(false);

  // OKR state
  const [okrs, setOkrs] = useState<any[]>([]);
  const [selectedQuarter, setSelectedQuarter] = useState('Q1');
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

  // Vision state
  const [visions, setVisions] = useState<any[]>([]);

  // Weekly reviews state
  const [reviews, setReviews] = useState<any[]>([]);

  // Silent time state
  const [silentTimeBlocks, setSilentTimeBlocks] = useState<any[]>([]);

  useEffect(() => {
    setLoading(false);
  }, []);

  useEffect(() => {
    if (activeTab === 'calendar') {
      fetchActivities();
    } else if (activeTab === 'okrs') {
      fetchOKRs();
    } else if (activeTab === 'vision') {
      fetchVisions();
    } else if (activeTab === 'reviews') {
      fetchReviews();
    } else if (activeTab === 'silent-time') {
      fetchSilentTime();
    }
  }, [activeTab, selectedMonth, selectedQuarter, selectedYear]);

  const fetchActivities = async () => {
    try {
      const res = await fetch(`/api/business/planning/activities?month=${selectedMonth}`);
      const data = await res.json();
      if (data.success) {
        setActivities(data.activities || []);
      }
    } catch (error) {
      console.error('Error fetching activities:', error);
    }
  };

  const fetchOKRs = async () => {
    try {
      const res = await fetch(`/api/business/planning/okrs?quarter=${selectedQuarter}&year=${selectedYear}`);
      const data = await res.json();
      if (data.success) {
        setOkrs(data.okrs || []);
      }
    } catch (error) {
      console.error('Error fetching OKRs:', error);
    }
  };

  const fetchVisions = async () => {
    try {
      const res = await fetch(`/api/business/planning/vision?year=${selectedYear}`);
      const data = await res.json();
      if (data.success) {
        setVisions(data.visions || []);
      }
    } catch (error) {
      console.error('Error fetching visions:', error);
    }
  };

  const fetchReviews = async () => {
    try {
      const res = await fetch('/api/business/planning/reviews');
      const data = await res.json();
      if (data.success) {
        setReviews(data.reviews || []);
      }
    } catch (error) {
      console.error('Error fetching reviews:', error);
    }
  };

  const fetchSilentTime = async () => {
    try {
      const res = await fetch('/api/business/planning/silent-time');
      const data = await res.json();
      if (data.success) {
        setSilentTimeBlocks(data.blocks || []);
      }
    } catch (error) {
      console.error('Error fetching silent time:', error);
    }
  };

  const getActivityColor = (type: string) => {
    switch (type) {
      case 'income':
        return 'bg-red-100 border-red-500 text-red-900 dark:bg-red-900/20 dark:border-red-600 dark:text-red-200';
      case 'affiliate':
        return 'bg-purple-100 border-purple-500 text-purple-900 dark:bg-purple-900/20 dark:border-purple-600 dark:text-purple-200';
      case 'other':
        return 'bg-blue-100 border-blue-500 text-blue-900 dark:bg-blue-900/20 dark:border-blue-600 dark:text-blue-200';
      default:
        return 'bg-gray-100 border-gray-500 text-gray-900 dark:bg-gray-900/20 dark:border-gray-600 dark:text-gray-200';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-black p-8 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-purple-600 border-t-transparent mx-auto mb-4"></div>
          <div className="text-lg text-gray-600 dark:text-gray-400">Loading Planning System...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-black p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <button
            onClick={() => router.push('/dashboard/business')}
            className="text-blue-600 hover:underline mb-2"
          >
            ← Back to Business OS
          </button>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Planning System</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Strategic planning layer: Monthly calendar, Quarterly OKRs, Yearly vision, Weekly reviews, Silent time
          </p>
        </div>

        {/* Tab Navigation */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow mb-6">
          <div className="flex border-b border-gray-200 dark:border-gray-700 overflow-x-auto">
            {[
              { id: 'calendar' as Tab, label: 'Monthly Calendar', icon: '📅' },
              { id: 'okrs' as Tab, label: 'Quarterly OKRs', icon: '🎯' },
              { id: 'vision' as Tab, label: 'Yearly Vision', icon: '🔮' },
              { id: 'reviews' as Tab, label: 'Weekly Reviews', icon: '📊' },
              { id: 'silent-time' as Tab, label: 'Silent Time', icon: '🧘' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-6 py-4 font-medium whitespace-nowrap transition ${
                  activeTab === tab.id
                    ? 'text-purple-600 border-b-2 border-purple-600 bg-purple-50 dark:bg-purple-900/20'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-gray-700/50'
                }`}
              >
                <span className="text-xl">{tab.icon}</span>
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Tab Content */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          {activeTab === 'calendar' && (
            <div>
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-4">
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Monthly Calendar</h2>
                  <input
                    type="month"
                    value={selectedMonth}
                    onChange={(e) => setSelectedMonth(e.target.value)}
                    className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                </div>
                <button
                  onClick={() => setShowAddActivity(true)}
                  className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
                >
                  + Add Activity
                </button>
              </div>

              {/* Color Legend */}
              <div className="flex gap-4 mb-6 text-sm">
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-red-500 rounded"></div>
                  <span className="text-gray-700 dark:text-gray-300">Income-generating</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-purple-500 rounded"></div>
                  <span className="text-gray-700 dark:text-gray-300">Affiliate relationships</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-blue-500 rounded"></div>
                  <span className="text-gray-700 dark:text-gray-300">Other activities</span>
                </div>
              </div>

              {/* Activities List */}
              {activities.length === 0 ? (
                <div className="text-center py-12 text-gray-500 dark:text-gray-400">
                  <p className="text-lg mb-2">No activities for {selectedMonth}</p>
                  <p className="text-sm">Click "Add Activity" to start planning your month!</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {activities.map((activity) => (
                    <div
                      key={activity.id}
                      className={`p-4 border-l-4 rounded-lg ${getActivityColor(activity.activityType)}`}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div className="font-semibold">{activity.title}</div>
                        {activity.isCompleted && <span className="text-green-600">✓</span>}
                      </div>
                      <div className="text-sm opacity-80 space-y-1">
                        <p>📅 {activity.date}</p>
                        {activity.timeSlot && <p>⏰ {activity.timeSlot}</p>}
                        {activity.durationMinutes && <p>⏱️ {activity.durationMinutes} min</p>}
                        {activity.description && <p className="mt-2">{activity.description}</p>}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'okrs' && (
            <div>
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-4">
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Quarterly OKRs</h2>
                  <select
                    value={selectedQuarter}
                    onChange={(e) => setSelectedQuarter(e.target.value)}
                    className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  >
                    <option value="Q1">Q1</option>
                    <option value="Q2">Q2</option>
                    <option value="Q3">Q3</option>
                    <option value="Q4">Q4</option>
                  </select>
                  <input
                    type="number"
                    value={selectedYear}
                    onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                    className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white w-24"
                  />
                </div>
                <button className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700">
                  + Add OKR
                </button>
              </div>

              {okrs.length === 0 ? (
                <div className="text-center py-12 text-gray-500 dark:text-gray-400">
                  <p className="text-lg mb-2">No OKRs for {selectedQuarter} {selectedYear}</p>
                  <p className="text-sm">Set your quarterly objectives and key results!</p>
                </div>
              ) : (
                <div className="space-y-6">
                  {okrs.map((okr) => (
                    <div
                      key={okr.id}
                      className="border border-gray-200 dark:border-gray-700 rounded-lg p-6"
                    >
                      <div className="flex items-start justify-between mb-4">
                        <div>
                          <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                            {okr.objectiveTitle}
                          </h3>
                          {okr.objectiveDescription && (
                            <p className="text-gray-600 dark:text-gray-400">{okr.objectiveDescription}</p>
                          )}
                        </div>
                        <span className={`px-3 py-1 rounded-full text-sm ${
                          okr.status === 'active' ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-200' :
                          okr.status === 'completed' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-200' :
                          'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-200'
                        }`}>
                          {okr.status}
                        </span>
                      </div>

                      {/* Key Results */}
                      {okr.keyResults && okr.keyResults.length > 0 && (
                        <div className="mt-4 space-y-3">
                          <h4 className="font-semibold text-gray-700 dark:text-gray-300">Key Results:</h4>
                          {okr.keyResults.map((kr: any) => (
                            <div key={kr.id} className="pl-4 border-l-2 border-purple-500">
                              <div className="flex items-center justify-between mb-1">
                                <span className="text-gray-900 dark:text-white">{kr.keyResultTitle}</span>
                                <span className="text-sm font-semibold text-purple-600">
                                  {kr.progressPercentage}%
                                </span>
                              </div>
                              <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                                <span>{kr.currentValue} / {kr.targetValue} {kr.unit}</span>
                              </div>
                              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 mt-2">
                                <div
                                  className="bg-purple-600 h-2 rounded-full transition-all"
                                  style={{ width: `${Math.min(parseFloat(kr.progressPercentage), 100)}%` }}
                                ></div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'vision' && (
            <div>
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-4">
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Yearly Vision</h2>
                  <input
                    type="number"
                    value={selectedYear}
                    onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                    className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white w-24"
                  />
                </div>
                <button className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700">
                  + Create Vision
                </button>
              </div>

              {visions.length === 0 ? (
                <div className="text-center py-12 text-gray-500 dark:text-gray-400">
                  <p className="text-lg mb-2">No vision set for {selectedYear}</p>
                  <p className="text-sm">Define your yearly vision and milestones!</p>
                </div>
              ) : (
                <div className="space-y-6">
                  {visions.map((vision) => (
                    <div
                      key={vision.id}
                      className="border border-gray-200 dark:border-gray-700 rounded-lg p-6"
                    >
                      <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
                        {selectedYear} Vision
                      </h3>
                      <div className="prose dark:prose-invert max-w-none mb-6">
                        <p className="text-lg text-gray-700 dark:text-gray-300">{vision.visionStatement}</p>
                      </div>

                      {/* Vision Metrics */}
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                        {vision.revenueTarget && (
                          <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg">
                            <div className="text-sm text-green-600 dark:text-green-400">Revenue Target</div>
                            <div className="text-2xl font-bold text-green-900 dark:text-green-200">
                              ${vision.revenueTarget}
                            </div>
                          </div>
                        )}
                        {vision.teamSize && (
                          <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
                            <div className="text-sm text-blue-600 dark:text-blue-400">Team Size</div>
                            <div className="text-2xl font-bold text-blue-900 dark:text-blue-200">
                              {vision.teamSize}
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Milestones */}
                      {vision.milestones && vision.milestones.length > 0 && (
                        <div>
                          <h4 className="font-semibold text-gray-700 dark:text-gray-300 mb-3">Milestones:</h4>
                          <div className="space-y-2">
                            {vision.milestones.map((milestone: any) => (
                              <div
                                key={milestone.id}
                                className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-900/50 rounded-lg"
                              >
                                <input
                                  type="checkbox"
                                  checked={milestone.isCompleted}
                                  readOnly
                                  className="w-5 h-5 text-purple-600"
                                />
                                <div className="flex-1">
                                  <div className={milestone.isCompleted ? 'line-through opacity-60' : ''}>
                                    {milestone.milestoneTitle}
                                  </div>
                                  {milestone.targetDate && (
                                    <div className="text-sm text-gray-500 dark:text-gray-400">
                                      Target: {milestone.targetDate}
                                    </div>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'reviews' && (
            <div>
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Weekly Reviews</h2>
                <button className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700">
                  + New Review
                </button>
              </div>

              {reviews.length === 0 ? (
                <div className="text-center py-12 text-gray-500 dark:text-gray-400">
                  <p className="text-lg mb-2">No weekly reviews yet</p>
                  <p className="text-sm">Start your weekly success ritual!</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {reviews.map((review) => (
                    <div
                      key={review.id}
                      className="border border-gray-200 dark:border-gray-700 rounded-lg p-6"
                    >
                      <div className="flex items-start justify-between mb-4">
                        <div>
                          <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                            Week of {review.weekStartDate}
                          </h3>
                          <p className="text-sm text-gray-500 dark:text-gray-400">
                            {review.weekStartDate} → {review.weekEndDate}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          {review.energyLevel && (
                            <span className="text-2xl">{review.energyLevel}</span>
                          )}
                          {review.progressRating && (
                            <span className="px-3 py-1 bg-purple-100 dark:bg-purple-900/20 text-purple-800 dark:text-purple-200 rounded-full text-sm font-semibold">
                              {review.progressRating}/10
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Auto-populated metrics */}
                      <div className="grid grid-cols-3 gap-4 mb-4">
                        <div className="bg-green-50 dark:bg-green-900/20 p-3 rounded-lg">
                          <div className="text-sm text-green-600 dark:text-green-400">Weekly Revenue</div>
                          <div className="text-xl font-bold text-green-900 dark:text-green-200">
                            ${review.weeklyRevenue}
                          </div>
                        </div>
                        <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg">
                          <div className="text-sm text-blue-600 dark:text-blue-400">New Clients</div>
                          <div className="text-xl font-bold text-blue-900 dark:text-blue-200">
                            {review.newClientsCount}
                          </div>
                        </div>
                        <div className="bg-purple-50 dark:bg-purple-900/20 p-3 rounded-lg">
                          <div className="text-sm text-purple-600 dark:text-purple-400">Activities Done</div>
                          <div className="text-xl font-bold text-purple-900 dark:text-purple-200">
                            {review.completedActivitiesCount}
                          </div>
                        </div>
                      </div>

                      {/* Review content */}
                      {review.bigWin && (
                        <div className="mb-3">
                          <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">Big Win: </span>
                          <span className="text-gray-900 dark:text-white">{review.bigWin}</span>
                        </div>
                      )}
                      {review.challengeFaced && (
                        <div className="mb-3">
                          <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">Challenge: </span>
                          <span className="text-gray-900 dark:text-white">{review.challengeFaced}</span>
                        </div>
                      )}
                      {review.nextWeekFocus && (
                        <div>
                          <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">Next Week: </span>
                          <span className="text-gray-900 dark:text-white">{review.nextWeekFocus}</span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'silent-time' && (
            <div>
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Silent Time Tracker</h2>
                <button className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700">
                  + Log Silent Time
                </button>
              </div>

              {/* Goal reminder */}
              <div className="bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-lg p-4 mb-6">
                <p className="text-purple-900 dark:text-purple-200 font-semibold">
                  🎯 Weekly Goal: 2-3 blocks of 90+ minutes of deep, focused work
                </p>
              </div>

              {silentTimeBlocks.length === 0 ? (
                <div className="text-center py-12 text-gray-500 dark:text-gray-400">
                  <p className="text-lg mb-2">No silent time logged yet</p>
                  <p className="text-sm">Start tracking your deep work sessions!</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {silentTimeBlocks.map((block) => (
                    <div
                      key={block.id}
                      className={`p-4 rounded-lg border-l-4 ${
                        block.durationMinutes >= 90
                          ? 'bg-green-50 dark:bg-green-900/20 border-green-500'
                          : 'bg-gray-50 dark:bg-gray-900/50 border-gray-500'
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="flex items-center gap-3 mb-2">
                            <span className="text-sm text-gray-600 dark:text-gray-400">{block.date}</span>
                            <span className="text-sm text-gray-600 dark:text-gray-400">
                              {block.startTime} {block.endTime && `→ ${block.endTime}`}
                            </span>
                            <span className={`text-sm font-bold ${
                              block.durationMinutes >= 90 ? 'text-green-600 dark:text-green-400' : 'text-gray-600 dark:text-gray-400'
                            }`}>
                              {block.durationMinutes} min
                            </span>
                          </div>
                          {block.focusArea && (
                            <div className="text-gray-900 dark:text-white font-semibold mb-1">
                              {block.focusArea}
                            </div>
                          )}
                          {block.taskCompleted && (
                            <div className="text-sm text-gray-600 dark:text-gray-400">
                              ✓ {block.taskCompleted}
                            </div>
                          )}
                        </div>
                        {block.durationMinutes >= 90 && (
                          <span className="text-2xl">⭐</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
