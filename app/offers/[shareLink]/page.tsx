'use client';

import { useState, useEffect } from 'react';
import { use } from 'react';

export default function OfferViewPage({ params }: { params: Promise<{ shareLink: string }> }) {
  const resolvedParams = use(params);
  const [offer, setOffer] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showDeclineModal, setShowDeclineModal] = useState(false);
  const [declineReason, setDeclineReason] = useState('');
  const [accepting, setAccepting] = useState(false);

  useEffect(() => {
    fetchOffer();
  }, [resolvedParams.shareLink]);

  const fetchOffer = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/offers/view/${resolvedParams.shareLink}`);
      const data = await response.json();

      if (data.success) {
        setOffer(data.offer);
      } else {
        alert('Offer not found');
      }
    } catch (error) {
      console.error('Error fetching offer:', error);
      alert('Failed to load offer');
    } finally {
      setLoading(false);
    }
  };

  const handleAccept = async () => {
    if (!confirm('Accept this offer?')) return;

    try {
      setAccepting(true);
      const response = await fetch(`/api/offers/action/${resolvedParams.shareLink}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'accept' }),
      });

      const data = await response.json();

      if (data.success) {
        alert('Offer accepted! Thank you for your business.');
        fetchOffer();
      } else {
        alert(`Error: ${data.error}`);
      }
    } catch (error) {
      console.error('Error accepting offer:', error);
      alert('Failed to accept offer');
    } finally {
      setAccepting(false);
    }
  };

  const handleDecline = async () => {
    if (!declineReason.trim()) {
      alert('Please provide a reason for declining');
      return;
    }

    try {
      const response = await fetch(`/api/offers/action/${resolvedParams.shareLink}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'decline', reason: declineReason }),
      });

      const data = await response.json();

      if (data.success) {
        alert('Thank you for your response.');
        setShowDeclineModal(false);
        fetchOffer();
      } else {
        alert(`Error: ${data.error}`);
      }
    } catch (error) {
      console.error('Error declining offer:', error);
      alert('Failed to decline offer');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-600 border-t-transparent mx-auto mb-4"></div>
          <div className="text-lg text-gray-600">Loading Offer...</div>
        </div>
      </div>
    );
  }

  if (!offer) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Offer Not Found</h1>
          <p className="text-gray-600">This offer may have been removed or the link is incorrect.</p>
        </div>
      </div>
    );
  }

  const isDecided = ['accepted', 'declined', 'expired'].includes(offer.status);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto p-6">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-lg p-8 mb-6 text-center">
          {offer.organization?.logoUrl && (
            <img
              src={offer.organization.logoUrl}
              alt={offer.organization.name}
              className="h-16 mx-auto mb-4"
            />
          )}
          <h1 className="text-3xl font-bold text-gray-900 mb-2">{offer.title}</h1>
          <p className="text-gray-600">
            {offer.client?.name && `For ${offer.client.name}`}
            {offer.client?.company && ` · ${offer.client.company}`}
          </p>
          {offer.validUntil && (
            <p className="text-sm text-gray-500 mt-2">
              Valid Until: {new Date(offer.validUntil).toLocaleDateString()}
            </p>
          )}
        </div>

        {/* Status Banner */}
        {isDecided && (
          <div className={`rounded-lg shadow p-4 mb-6 text-center ${
            offer.status === 'accepted'
              ? 'bg-green-100 text-green-800'
              : offer.status === 'declined'
              ? 'bg-red-100 text-red-800'
              : 'bg-orange-100 text-orange-800'
          }`}>
            <p className="font-semibold">
              {offer.status === 'accepted' && '✅ This offer has been accepted'}
              {offer.status === 'declined' && '❌ This offer has been declined'}
              {offer.status === 'expired' && '⏰ This offer has expired'}
            </p>
          </div>
        )}

        {/* Custom Message */}
        {offer.customMessage && (
          <div className="bg-white rounded-lg shadow p-6 mb-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-3">Personal Message</h2>
            <div className="text-gray-700 whitespace-pre-wrap">{offer.customMessage}</div>
          </div>
        )}

        {/* Offer Content */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">Offer Details</h2>
          <div className="prose max-w-none text-gray-700">
            {typeof offer.content === 'object' && offer.content.description && (
              <p>{offer.content.description}</p>
            )}
            {typeof offer.content === 'string' && <p>{offer.content}</p>}
          </div>
        </div>

        {/* Investment */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">Investment</h2>
          <div className="space-y-2">
            {parseFloat(offer.discountAmount) > 0 && (
              <div className="flex justify-between text-gray-600">
                <span>Original Value:</span>
                <span className="line-through">${parseFloat(offer.totalValue).toLocaleString()}</span>
              </div>
            )}
            <div className="flex justify-between text-2xl font-bold text-gray-900">
              <span>Total:</span>
              <span>${parseFloat(offer.finalValue).toLocaleString()} {offer.currency}</span>
            </div>
            {offer.paymentTerms && (
              <p className="text-sm text-gray-600 mt-2">Payment Terms: {offer.paymentTerms}</p>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        {!isDecided && (
          <div className="flex gap-4 mb-6">
            <button
              onClick={handleAccept}
              disabled={accepting}
              className="flex-1 bg-green-600 text-white py-4 px-6 rounded-lg hover:bg-green-700 font-semibold text-lg disabled:opacity-50"
            >
              {accepting ? 'Processing...' : '✅ Accept This Offer'}
            </button>
            <button
              onClick={() => setShowDeclineModal(true)}
              className="flex-1 bg-red-600 text-white py-4 px-6 rounded-lg hover:bg-red-700 font-semibold text-lg"
            >
              ❌ Decline
            </button>
          </div>
        )}

        {/* Footer */}
        <div className="text-center text-gray-500 text-sm">
          <p>Powered by {offer.organization?.name || 'Business OS'}</p>
          <p className="mt-1">Offer ID: {offer.offerId}</p>
        </div>
      </div>

      {/* Decline Modal */}
      {showDeclineModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Decline Offer</h2>
            <p className="text-gray-600 mb-4">
              Please let us know why you're declining this offer (this helps us improve):
            </p>
            <textarea
              value={declineReason}
              onChange={(e) => setDeclineReason(e.target.value)}
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              placeholder="Your reason..."
            />
            <div className="flex justify-end gap-3 mt-4">
              <button
                onClick={() => setShowDeclineModal(false)}
                className="px-4 py-2 text-gray-600 hover:text-gray-900"
              >
                Cancel
              </button>
              <button
                onClick={handleDecline}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
              >
                Submit
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
