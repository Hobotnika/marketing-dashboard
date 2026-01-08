'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function OffersPage() {
  const router = useRouter();
  const [offers, setOffers] = useState<any[]>([]);
  const [summary, setSummary] = useState<any>(null);
  const [statusFilter, setStatusFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [offerForm, setOfferForm] = useState({
    title: '',
    totalValue: '',
    finalValue: '',
    content: {},
  });

  useEffect(() => {
    fetchOffers();
  }, [statusFilter]);

  const fetchOffers = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (statusFilter !== 'all') params.set('status', statusFilter);

      const response = await fetch(`/api/business/offers?${params}`);
      const data = await response.json();

      if (data.success) {
        setOffers(data.offers || []);
        setSummary(data.summary);
      }
    } catch (error) {
      console.error('Error fetching offers:', error);
      alert('Failed to load offers');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateOffer = async () => {
    if (!offerForm.title || !offerForm.totalValue || !offerForm.finalValue) {
      alert('Please fill in all required fields');
      return;
    }

    try {
      const res = await fetch('/api/business/offers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...offerForm,
          content: { description: offerForm.title },
        }),
      });

      const data = await res.json();

      if (data.success) {
        alert('Offer created successfully!');
        setShowCreateModal(false);
        setOfferForm({ title: '', totalValue: '', finalValue: '', content: {} });
        fetchOffers();
      } else {
        alert(`Error: ${data.error}`);
      }
    } catch (error) {
      console.error('Error creating offer:', error);
      alert('Failed to create offer');
    }
  };

  const handleSendOffer = async (offerId: string) => {
    if (!confirm('Send this offer to the client?')) return;

    try {
      const res = await fetch(`/api/business/offers/${offerId}/actions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'send' }),
      });

      const data = await res.json();

      if (data.success) {
        alert('Offer sent successfully!');
        fetchOffers();
      } else {
        alert(`Error: ${data.error}`);
      }
    } catch (error) {
      console.error('Error sending offer:', error);
      alert('Failed to send offer');
    }
  };

  const getStatusBadge = (status: string) => {
    const badges: Record<string, { bg: string; text: string }> = {
      draft: { bg: 'bg-gray-100 dark:bg-gray-700', text: 'text-gray-800 dark:text-gray-200' },
      sent: { bg: 'bg-blue-100 dark:bg-blue-900', text: 'text-blue-800 dark:text-blue-200' },
      viewed: { bg: 'bg-purple-100 dark:bg-purple-900', text: 'text-purple-800 dark:text-purple-200' },
      accepted: { bg: 'bg-green-100 dark:bg-green-900', text: 'text-green-800 dark:text-green-200' },
      declined: { bg: 'bg-red-100 dark:bg-red-900', text: 'text-red-800 dark:text-red-200' },
      expired: { bg: 'bg-orange-100 dark:bg-orange-900', text: 'text-orange-800 dark:text-orange-200' },
    };

    const badge = badges[status] || badges.draft;

    return (
      <span className={`px-2 py-1 text-xs rounded ${badge.bg} ${badge.text}`}>
        {status.toUpperCase()}
      </span>
    );
  };

  const copyShareLink = (shareLink: string) => {
    const fullUrl = `${window.location.origin}/offers/${shareLink}`;
    navigator.clipboard.writeText(fullUrl);
    alert('Share link copied to clipboard!');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-black p-8 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-600 border-t-transparent mx-auto mb-4"></div>
          <div className="text-lg text-gray-600 dark:text-gray-400">Loading Offers...</div>
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
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Offers System</h1>
            <p className="text-gray-600 dark:text-gray-400 mt-2">
              Create proposals, track acceptance, and close more deals
            </p>
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            + Create Offer
          </button>
        </div>

        {/* Summary Cards */}
        {summary && (
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
              <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">Total Offers</h3>
              <p className="text-3xl font-bold text-gray-900 dark:text-white">{summary.totalOffers}</p>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
              <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">Accepted</h3>
              <p className="text-3xl font-bold text-green-600">{summary.accepted}</p>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
              <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">Pending</h3>
              <p className="text-3xl font-bold text-blue-600">{summary.sent + summary.viewed}</p>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
              <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">Acceptance Rate</h3>
              <p className="text-3xl font-bold text-gray-900 dark:text-white">{summary.acceptanceRate}%</p>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
              <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">Total Value</h3>
              <p className="text-3xl font-bold text-gray-900 dark:text-white">${summary.totalValue}</p>
            </div>
          </div>
        )}

        {/* Filters */}
        <section className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <div className="flex items-center gap-3 mb-6">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            >
              <option value="all">All Status</option>
              <option value="draft">Draft</option>
              <option value="sent">Sent</option>
              <option value="viewed">Viewed</option>
              <option value="accepted">Accepted</option>
              <option value="declined">Declined</option>
              <option value="expired">Expired</option>
            </select>
          </div>

          {/* Offers Table */}
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-100 dark:bg-gray-700">
                <tr>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-700 dark:text-gray-300">Offer ID</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-700 dark:text-gray-300">Title</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-700 dark:text-gray-300">Client</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-700 dark:text-gray-300">Status</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-700 dark:text-gray-300">Value</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-700 dark:text-gray-300">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {offers.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-gray-500 dark:text-gray-400">
                      No offers found. Create your first offer to get started!
                    </td>
                  </tr>
                ) : (
                  offers.map((offer: any) => (
                    <tr key={offer.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                      <td className="py-3 px-4 font-medium text-gray-900 dark:text-white">{offer.offerId}</td>
                      <td className="py-3 px-4 text-gray-900 dark:text-white">{offer.title}</td>
                      <td className="py-3 px-4 text-gray-600 dark:text-gray-400">
                        {offer.client?.name || '-'}
                      </td>
                      <td className="py-3 px-4">{getStatusBadge(offer.status)}</td>
                      <td className="py-3 px-4 text-gray-900 dark:text-white">
                        ${parseFloat(offer.finalValue).toLocaleString()}
                      </td>
                      <td className="py-3 px-4 space-x-2">
                        {offer.status === 'draft' && (
                          <button
                            onClick={() => handleSendOffer(offer.id)}
                            className="text-blue-600 hover:underline text-sm"
                          >
                            Send
                          </button>
                        )}
                        {['sent', 'viewed'].includes(offer.status) && (
                          <button
                            onClick={() => copyShareLink(offer.uniqueShareLink)}
                            className="text-green-600 hover:underline text-sm"
                          >
                            Copy Link
                          </button>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>
      </div>

      {/* Create Offer Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Create New Offer</h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Offer Title *
                </label>
                <input
                  type="text"
                  value={offerForm.title}
                  onChange={(e) => setOfferForm({ ...offerForm, title: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  placeholder="Website Redesign Package"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Total Value ($) *
                </label>
                <input
                  type="number"
                  value={offerForm.totalValue}
                  onChange={(e) => setOfferForm({ ...offerForm, totalValue: e.target.value, finalValue: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  placeholder="5000"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Final Value ($) *
                </label>
                <input
                  type="number"
                  value={offerForm.finalValue}
                  onChange={(e) => setOfferForm({ ...offerForm, finalValue: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  placeholder="5000"
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => setShowCreateModal(false)}
                className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateOffer}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Create Offer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
