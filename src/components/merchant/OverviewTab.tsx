import React, { useState } from 'react';
import {
  CreditCard,
  DollarSign,
  CheckCircle,
  AlertTriangle,
  ArrowRight,
  Plus,
  Layers,
  Building2,
  ExternalLink,
  Copy,
  Check,
  ShieldCheck,
  TrendingUp,
} from 'lucide-react';
import { usePayGate } from '../../context/PayGateContext';
import { ProviderType } from '../../types';
import { StatCard } from '../gate-ui/StatCard';
import { StatusChip } from '../gate-ui/StatusChip';
import { ReferenceChip } from '../gate-ui/ReferenceChip';
import { ProviderBadge } from '../gate-ui/ProviderBadge';
import { GateButton } from '../gate-ui/GateButton';
import { GateInput } from '../gate-ui/GateInput';
import { formatPaisaToBDT } from '../../utils/smsParser';

export const OverviewTab: React.FC = () => {
  const {
    merchant,
    payments,
    plans,
    setSelectedPaymentId,
    setActiveMerchantTab,
    createPayment,
    addToast,
  } = usePayGate();

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedPlanId, setSelectedPlanId] = useState(plans[0]?.id || '');
  const [selectedProvider, setSelectedProvider] = useState<ProviderType>('bkash');
  const [orderIdInput, setOrderIdInput] = useState(`ORD-${Math.floor(10000 + Math.random() * 90000)}`);
  const [customerPhoneInput, setCustomerPhoneInput] = useState('01712000000');
  const [createdPaymentLink, setCreatedPaymentLink] = useState<{ id: string; url: string; orderId: string } | null>(null);
  const [copiedLink, setCopiedLink] = useState(false);

  // Compute live metrics
  const totalVolumePaisa = payments
    .filter((p) => p.status === 'paid')
    .reduce((sum, p) => sum + p.amountPaisa, 0);

  const netRevenuePaisa = payments
    .filter((p) => p.status === 'paid')
    .reduce((sum, p) => sum + p.netAmountPaisa, 0);

  const paidCount = payments.filter((p) => p.status === 'paid').length;
  const reviewCount = payments.filter((p) => p.status === 'needs_review').length;
  const recentPayments = payments.slice(0, 6);

  const handleCreatePaymentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newPayment = createPayment(
      selectedPlanId,
      selectedProvider,
      orderIdInput,
      customerPhoneInput
    );
    const linkUrl = `${window.location.origin}/pay/${newPayment.id}`;
    setCreatedPaymentLink({
      id: newPayment.id,
      url: linkUrl,
      orderId: newPayment.orderId,
    });
    setOrderIdInput(`ORD-${Math.floor(10000 + Math.random() * 90000)}`);
    addToast('Payment Link Generated', `Issued reference ${newPayment.reference} for ${newPayment.orderId}`, 'success');
  };

  const handleCopyLink = () => {
    if (!createdPaymentLink) return;
    navigator.clipboard.writeText(createdPaymentLink.url);
    setCopiedLink(true);
    addToast('Link Copied', 'Checkout link copied to clipboard', 'info');
    setTimeout(() => setCopiedLink(false), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Attention Queue Banner if needs_review exist */}
      {reviewCount > 0 && (
        <div className="p-4 bg-[var(--warning)]/10 border border-[var(--warning)]/30 rounded-2xl flex items-center justify-between transition-all">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-[var(--warning)]/20 text-[var(--warning)] rounded-xl shrink-0">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-semibold text-[var(--ink)]">
                {reviewCount} Payment{reviewCount > 1 ? 's' : ''} Require Operational Review
              </h4>
              <p className="text-xs text-[var(--ink-2)] mt-0.5">
                Amount mismatch or wrong wallet detected. Review in payments queue to inspect customer TrxID claim vs SMS logs.
              </p>
            </div>
          </div>
          <GateButton
            variant="secondary"
            size="sm"
            onClick={() => setActiveMerchantTab('payments')}
            icon={<ArrowRight className="w-3.5 h-3.5" />}
          >
            Review Queue
          </GateButton>
        </div>
      )}

      {/* 4 Stat Cards Bento Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          caption="Total Paid Volume"
          value={formatPaisaToBDT(totalVolumePaisa)}
          delta={{ value: '+18.4%', isPositive: true, period: 'vs last week' }}
          icon={<CreditCard className="w-4 h-4" />}
        />
        <StatCard
          caption="Net Merchant Earnings"
          value={formatPaisaToBDT(netRevenuePaisa)}
          delta={{ value: '+17.9%', isPositive: true, period: 'after gateway fee' }}
          icon={<DollarSign className="w-4 h-4" />}
        />
        <StatCard
          caption="Paid Transactions"
          value={paidCount.toString()}
          delta={{ value: '96.2%', isPositive: true, period: 'match success' }}
          icon={<CheckCircle className="w-4 h-4" />}
        />
        <StatCard
          caption="Available Settlement"
          value={formatPaisaToBDT(merchant.balancePaisa)}
          subtext={`Min payout Tk 1,000 · ${merchant.payoutAccount.bankName || 'BEFTN / MFS'}`}
          icon={<DollarSign className="w-4 h-4" />}
        />
      </div>

      {/* Real Merchant Operations & Quick Action Strip */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Card 1: Issue Payment Link */}
        <div className="lg:col-span-2 p-5 bg-[var(--surface)] border border-[var(--border)] rounded-2xl flex flex-col justify-between gap-4">
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold text-[var(--ink)]">Issue Customer Payment Link</span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-[var(--accent-soft)] text-[var(--accent)]">
                  Live Gateway
                </span>
              </div>
              <p className="text-xs text-[var(--ink-2)] leading-relaxed">
                Generate a shareable checkout URL backed by automated SMS verification. Assigns a dedicated 8-character typo-checked reference code from the active MFS pool.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 pt-2 border-t border-[var(--border)]">
            <GateButton
              variant="primary"
              size="sm"
              onClick={() => {
                setCreatedPaymentLink(null);
                setIsCreateModalOpen(true);
              }}
              icon={<Plus className="w-3.5 h-3.5" />}
            >
              Create Payment Link
            </GateButton>
            <GateButton
              variant="secondary"
              size="sm"
              onClick={() => setActiveMerchantTab('plans')}
              icon={<Layers className="w-3.5 h-3.5" />}
            >
              Manage Plans ({plans.length})
            </GateButton>
            <GateButton
              variant="ghost"
              size="sm"
              onClick={() => setActiveMerchantTab('settlements')}
              icon={<Building2 className="w-3.5 h-3.5" />}
            >
              Settlement Settings
            </GateButton>
          </div>
        </div>

        {/* Card 2: Settlement Account Status */}
        <div className="p-5 bg-[var(--surface)] border border-[var(--border)] rounded-2xl flex flex-col justify-between gap-3">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-[var(--ink-3)]">
                Next Payout Batch
              </span>
              <span className="flex items-center gap-1 text-[11px] font-medium text-[var(--success)]">
                <ShieldCheck className="w-3.5 h-3.5" /> BEFTN Active
              </span>
            </div>
            <div className="text-base font-bold text-[var(--ink)]">
              {merchant.payoutAccount.bankName || 'Brac Bank PLC'}
            </div>
            <div className="text-xs text-[var(--ink-2)] font-mono mt-0.5">
              Acc: {merchant.payoutAccount.accountNumber || '2050********091'} · Branch: {merchant.payoutAccount.branchName || 'Gulshan'}
            </div>
          </div>

          <div className="pt-3 border-t border-[var(--border)] flex items-center justify-between text-xs text-[var(--ink-3)]">
            <span>Cut-off: 17:00 BST Daily</span>
            <button
              onClick={() => setActiveMerchantTab('settlements')}
              className="text-[var(--accent)] font-semibold hover:underline cursor-pointer"
            >
              View Schedule →
            </button>
          </div>
        </div>
      </div>

      {/* Recent Payments Table */}
      <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl overflow-hidden">
        <div className="px-5 py-4 border-b border-[var(--border)] flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold text-[var(--ink)]">Recent Transactions</h3>
            <p className="text-xs text-[var(--ink-3)]">Click any transaction to inspect carrier SMS proof, audit logs, and webhook delivery</p>
          </div>
          <GateButton
            variant="ghost"
            size="sm"
            onClick={() => setActiveMerchantTab('payments')}
            icon={<ArrowRight className="w-3.5 h-3.5" />}
          >
            View All ({payments.length})
          </GateButton>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[var(--surface-2)]/60 text-[var(--ink-3)] font-medium border-b border-[var(--border)]">
              <tr>
                <th className="py-3 px-4">Order / ID</th>
                <th className="py-3 px-4">Provider</th>
                <th className="py-3 px-4">Reference</th>
                <th className="py-3 px-4">Plan</th>
                <th className="py-3 px-4 text-right">Amount</th>
                <th className="py-3 px-4 text-right">Net</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Created</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border)] text-[var(--ink)]">
              {recentPayments.map((p) => (
                <tr
                  key={p.id}
                  onClick={() => setSelectedPaymentId(p.id)}
                  className="hover:bg-[var(--surface-2)]/50 cursor-pointer transition-colors"
                >
                  <td className="py-3.5 px-4 font-mono font-medium text-[var(--ink)]">
                    {p.orderId}
                  </td>
                  <td className="py-3.5 px-4">
                    <ProviderBadge provider={p.provider} size="sm" />
                  </td>
                  <td className="py-3.5 px-4">
                    <ReferenceChip reference={p.reference} size="sm" />
                  </td>
                  <td className="py-3.5 px-4 font-medium text-[var(--ink-2)] truncate max-w-[140px]">
                    {p.planSnapshot.name}
                  </td>
                  <td className="py-3.5 px-4 text-right font-mono tabular-nums font-semibold">
                    {formatPaisaToBDT(p.amountPaisa)}
                  </td>
                  <td className="py-3.5 px-4 text-right font-mono tabular-nums text-[var(--success)] font-medium">
                    {formatPaisaToBDT(p.netAmountPaisa)}
                  </td>
                  <td className="py-3.5 px-4">
                    <StatusChip status={p.status} reviewReason={p.reviewReason} size="sm" />
                  </td>
                  <td className="py-3.5 px-4 text-right text-[var(--ink-3)] font-mono">
                    {new Date(p.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Real Create Payment Link Modal */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-6 shadow-2xl animate-in zoom-in-95 duration-150">
            {!createdPaymentLink ? (
              <>
                <h3 className="text-base font-bold text-[var(--ink)] mb-1">Generate Customer Payment Link</h3>
                <p className="text-xs text-[var(--ink-3)] mb-4">
                  Select a plan to lock the pricing and assign an available MFS wallet with an 8-character reference.
                </p>

                <form onSubmit={handleCreatePaymentSubmit} className="space-y-4">
                  <div>
                    <label className="text-xs font-medium text-[var(--ink-2)] block mb-1">Pricing Plan</label>
                    <select
                      value={selectedPlanId}
                      onChange={(e) => setSelectedPlanId(e.target.value)}
                      className="w-full h-10 px-3 text-xs bg-[var(--surface-2)] border border-[var(--border)] rounded-lg text-[var(--ink)] outline-none"
                    >
                      {plans.map((plan) => (
                        <option key={plan.id} value={plan.id}>
                          {plan.name} — {formatPaisaToBDT(plan.amountPaisa)} ({plan.externalSku})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="text-xs font-medium text-[var(--ink-2)] block mb-1">Preferred Provider</label>
                    <div className="grid grid-cols-5 gap-1.5">
                      {(['bkash', 'nagad', 'rocket', 'upay', 'cellfin'] as ProviderType[]).map((prov) => (
                        <button
                          key={prov}
                          type="button"
                          onClick={() => setSelectedProvider(prov)}
                          className={`h-9 rounded-lg border text-xs font-medium capitalize flex items-center justify-center gap-1 cursor-pointer transition-colors ${
                            selectedProvider === prov
                              ? 'border-[var(--accent)] bg-[var(--accent-soft)]/50 text-[var(--accent)] font-semibold'
                              : 'border-[var(--border)] bg-[var(--surface-2)] text-[var(--ink-2)] hover:bg-[var(--surface)]'
                          }`}
                        >
                          <ProviderBadge provider={prov} showLabel={false} size="sm" />
                          <span className="hidden sm:inline">{prov}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  <GateInput
                    label="Merchant Order ID"
                    value={orderIdInput}
                    onChange={(e) => setOrderIdInput(e.target.value)}
                    isMono
                    required
                  />

                  <GateInput
                    label="Customer Phone (Optional)"
                    value={customerPhoneInput}
                    onChange={(e) => setCustomerPhoneInput(e.target.value)}
                    placeholder="017xxxxxxxx"
                    isMono
                  />

                  <div className="flex items-center gap-2 pt-2">
                    <GateButton
                      type="button"
                      variant="secondary"
                      className="flex-1"
                      onClick={() => setIsCreateModalOpen(false)}
                    >
                      Cancel
                    </GateButton>
                    <GateButton type="submit" variant="primary" className="flex-1">
                      Generate Link
                    </GateButton>
                  </div>
                </form>
              </>
            ) : (
              <div className="space-y-4">
                <div className="w-12 h-12 rounded-full bg-[var(--success)]/10 text-[var(--success)] flex items-center justify-center mx-auto">
                  <CheckCircle className="w-6 h-6" />
                </div>
                <div className="text-center">
                  <h3 className="text-base font-bold text-[var(--ink)]">Payment Link Ready</h3>
                  <p className="text-xs text-[var(--ink-3)] mt-1">
                    Send this link to your customer to complete the checkout.
                  </p>
                </div>

                <div className="p-3 bg-[var(--surface-2)] rounded-xl border border-[var(--border)] space-y-1.5">
                  <span className="text-[10px] font-mono text-[var(--ink-3)] uppercase">Checkout URL</span>
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-mono text-xs text-[var(--ink)] truncate select-all">
                      {createdPaymentLink.url}
                    </span>
                    <button
                      onClick={handleCopyLink}
                      className="px-2.5 py-1 text-xs font-medium rounded-md border border-[var(--border)] bg-[var(--surface)] text-[var(--ink)] hover:bg-[var(--surface-2)] flex items-center gap-1 cursor-pointer shrink-0 transition-colors"
                    >
                      {copiedLink ? <Check className="w-3.5 h-3.5 text-[var(--success)]" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copiedLink ? 'Copied' : 'Copy'}</span>
                    </button>
                  </div>
                </div>

                <div className="flex items-center gap-2 pt-2">
                  <GateButton
                    variant="secondary"
                    className="flex-1"
                    onClick={() => {
                      setIsCreateModalOpen(false);
                      setCreatedPaymentLink(null);
                    }}
                  >
                    Close
                  </GateButton>
                  <GateButton
                    variant="primary"
                    className="flex-1"
                    onClick={() => {
                      setSelectedPaymentId(createdPaymentLink.id);
                      setIsCreateModalOpen(false);
                      setCreatedPaymentLink(null);
                    }}
                    icon={<ExternalLink className="w-3.5 h-3.5" />}
                  >
                    View Details
                  </GateButton>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
