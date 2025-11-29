'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

interface AddClientModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function AddClientModal({ isOpen, onClose }: AddClientModalProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState<{
    organization: string;
    email: string;
    password: string;
  } | null>(null);

  const [formData, setFormData] = useState({
    name: '',
    subdomain: '',
    calendlyAccessToken: '',
    calendlyUserUri: '',
    stripeSecretKey: '',
    googleSheetsId: '',
    metaAccessToken: '',
    metaAdAccountId: '',
    googleAdsClientId: '',
    googleAdsClientSecret: '',
    googleAdsRefreshToken: '',
    googleAdsCustomerId: '',
    status: 'trial' as 'trial' | 'active' | 'inactive',
    adminName: '',
    adminEmail: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess(null);
    setLoading(true);

    try {
      const response = await fetch('/api/admin/organizations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create organization');
      }

      // Show success with temporary password
      if (data.user) {
        setSuccess({
          organization: data.organization.name,
          email: data.user.email,
          password: data.user.temporaryPassword,
        });
      }

      // Refresh the page to show new organization
      router.refresh();

      // Reset form after 5 seconds
      setTimeout(() => {
        handleClose();
      }, 5000);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setFormData({
      name: '',
      subdomain: '',
      calendlyAccessToken: '',
      calendlyUserUri: '',
      stripeSecretKey: '',
      googleSheetsId: '',
      metaAccessToken: '',
      metaAdAccountId: '',
      googleAdsClientId: '',
      googleAdsClientSecret: '',
      googleAdsRefreshToken: '',
      googleAdsCustomerId: '',
      status: 'trial',
      adminName: '',
      adminEmail: '',
    });
    setError('');
    setSuccess(null);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-gray-900 rounded-2xl border border-gray-700 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-gray-900 border-b border-gray-700 px-6 py-4 flex items-center justify-between">
          <h2 className="text-2xl font-bold text-white">Add New Client</h2>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Success Message */}
        {success && (
          <div className="m-6 p-4 bg-green-500/10 border border-green-500/50 rounded-lg">
            <h3 className="text-green-400 font-semibold mb-2">Client Created Successfully!</h3>
            <p className="text-sm text-gray-300 mb-2">
              Organization: <strong>{success.organization}</strong>
            </p>
            <p className="text-sm text-gray-300 mb-2">
              Admin Email: <strong>{success.email}</strong>
            </p>
            <p className="text-sm text-gray-300 mb-2">
              Temporary Password: <strong className="text-yellow-400">{success.password}</strong>
            </p>
            <p className="text-xs text-gray-400 mt-2">
              ⚠️ Save this password now - it won't be shown again!
            </p>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="m-6 p-4 bg-red-500/10 border border-red-500/50 rounded-lg">
            <p className="text-red-400 text-sm">{error}</p>
          </div>
        )}

        {/* Form */}
        {!success && (
          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            {/* Organization Info */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-white">Organization Info</h3>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Organization Name *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                  className="w-full px-4 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-green-500"
                  placeholder="Acme Corporation"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Subdomain *
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={formData.subdomain}
                    onChange={(e) => setFormData({ ...formData, subdomain: e.target.value.toLowerCase() })}
                    required
                    pattern="[a-z0-9-]+"
                    className="flex-1 px-4 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-green-500"
                    placeholder="acme"
                  />
                  <span className="text-gray-400">.yourdomain.com</span>
                </div>
                <p className="text-xs text-gray-500 mt-1">Lowercase letters, numbers, and hyphens only</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Status
                </label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                  className="w-full px-4 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-green-500"
                >
                  <option value="trial">Trial</option>
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>
            </div>

            {/* Admin User */}
            <div className="space-y-4 border-t border-gray-700 pt-6">
              <h3 className="text-lg font-semibold text-white">Admin User</h3>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Admin Name
                </label>
                <input
                  type="text"
                  value={formData.adminName}
                  onChange={(e) => setFormData({ ...formData, adminName: e.target.value })}
                  className="w-full px-4 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-green-500"
                  placeholder="John Doe"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Admin Email
                </label>
                <input
                  type="email"
                  value={formData.adminEmail}
                  onChange={(e) => setFormData({ ...formData, adminEmail: e.target.value })}
                  className="w-full px-4 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-green-500"
                  placeholder="admin@acme.com"
                />
              </div>
            </div>

            {/* API Keys */}
            <div className="space-y-4 border-t border-gray-700 pt-6">
              <h3 className="text-lg font-semibold text-white">API Keys (Optional)</h3>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Calendly Access Token
                </label>
                <input
                  type="text"
                  value={formData.calendlyAccessToken}
                  onChange={(e) => setFormData({ ...formData, calendlyAccessToken: e.target.value })}
                  className="w-full px-4 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-green-500"
                  placeholder="calendly_token_here"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Calendly User URI
                </label>
                <input
                  type="text"
                  value={formData.calendlyUserUri}
                  onChange={(e) => setFormData({ ...formData, calendlyUserUri: e.target.value })}
                  className="w-full px-4 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-green-500"
                  placeholder="https://api.calendly.com/users/..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Stripe Secret Key
                </label>
                <input
                  type="text"
                  value={formData.stripeSecretKey}
                  onChange={(e) => setFormData({ ...formData, stripeSecretKey: e.target.value })}
                  className="w-full px-4 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-green-500"
                  placeholder="sk_test_..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Google Sheets ID
                </label>
                <input
                  type="text"
                  value={formData.googleSheetsId}
                  onChange={(e) => setFormData({ ...formData, googleSheetsId: e.target.value })}
                  className="w-full px-4 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-green-500"
                  placeholder="1A2B3C4D..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Meta Access Token
                </label>
                <input
                  type="text"
                  value={formData.metaAccessToken}
                  onChange={(e) => setFormData({ ...formData, metaAccessToken: e.target.value })}
                  className="w-full px-4 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-green-500"
                  placeholder="EAA..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Meta Ad Account ID
                </label>
                <input
                  type="text"
                  value={formData.metaAdAccountId}
                  onChange={(e) => setFormData({ ...formData, metaAdAccountId: e.target.value })}
                  className="w-full px-4 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-green-500"
                  placeholder="act_123456789"
                />
              </div>
            </div>

            {/* Google Ads API Keys */}
            <div className="space-y-4 border-t border-gray-700 pt-6">
              <h3 className="text-lg font-semibold text-white">Google Ads API (Optional)</h3>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Google Ads Client ID
                </label>
                <input
                  type="text"
                  value={formData.googleAdsClientId}
                  onChange={(e) => setFormData({ ...formData, googleAdsClientId: e.target.value })}
                  className="w-full px-4 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-green-500"
                  placeholder="123456789.apps.googleusercontent.com"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Google Ads Client Secret
                </label>
                <input
                  type="text"
                  value={formData.googleAdsClientSecret}
                  onChange={(e) => setFormData({ ...formData, googleAdsClientSecret: e.target.value })}
                  className="w-full px-4 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-green-500"
                  placeholder="GOCSPX-..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Google Ads Refresh Token
                </label>
                <input
                  type="text"
                  value={formData.googleAdsRefreshToken}
                  onChange={(e) => setFormData({ ...formData, googleAdsRefreshToken: e.target.value })}
                  className="w-full px-4 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-green-500"
                  placeholder="1//..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Google Ads Customer ID
                </label>
                <input
                  type="text"
                  value={formData.googleAdsCustomerId}
                  onChange={(e) => setFormData({ ...formData, googleAdsCustomerId: e.target.value })}
                  className="w-full px-4 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-green-500"
                  placeholder="1234567890"
                />
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-3 pt-4">
              <button
                type="button"
                onClick={handleClose}
                className="flex-1 px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-600 text-white rounded-lg transition-colors"
              >
                {loading ? 'Creating...' : 'Create Client'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
