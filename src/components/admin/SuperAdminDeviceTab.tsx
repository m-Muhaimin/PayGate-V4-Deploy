import React, { useState, useEffect } from 'react';
import {
  Smartphone,
  ShieldCheck,
  ShieldAlert,
  Radio,
  Battery,
  Wifi,
  KeyRound,
  Copy,
  Check,
  Eye,
  EyeOff,
  RefreshCw,
  Plus,
  Trash2,
  Send,
  Sparkles,
  Terminal,
  Activity,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Clock,
  Layers,
  ArrowRight,
  FileText,
  X,
} from 'lucide-react';
import { usePayGate } from '../../context/PayGateContext';
import { ProviderType } from '../../types';
import { GateButton } from '../gate-ui/GateButton';
import { GateInput } from '../gate-ui/GateInput';
import { ProviderBadge } from '../gate-ui/ProviderBadge';

export const SuperAdminDeviceTab: React.FC = () => {
  const {
    superAdminDevice,
    payments,
    wallets,
    incomingTxns,
    addWhitelistedIp,
    removeWhitelistedIp,
    toggleIpEnforcement,
    setActiveClientIp,
    pingSuperAdminDevice,
    verifyClientIp,
    ingestForwardedSms,
    setSelectedPaymentId,
    addToast,
  } = usePayGate();

  // IP & Handset state
  const [newIpInput, setNewIpInput] = useState('');
  const [showToken, setShowToken] = useState(false);
  const [copiedToken, setCopiedToken] = useState(false);
  const [isPinging, setIsPinging] = useState(false);
  const [lastPingLatency, setLastPingLatency] = useState<number | null>(null);

  // Ingest stream filtering & raw modal
  const [filterProvider, setFilterProvider] = useState<string>('all');
  const [selectedRawTxn, setSelectedRawTxn] = useState<any | null>(null);

  // SMS Simulator modal state
  const [isTestSmsModalOpen, setIsTestSmsModalOpen] = useState(false);
  const [senderName, setSenderName] = useState<string>('bKash');
  const [simSlot, setSimSlot] = useState<1 | 2>(1);
  const [rawSmsBody, setRawSmsBody] = useState<string>(
    `You have received Tk 1,200.00 from 01712750278. Fee Tk 0.00. Balance Tk 14,500.00. TrxID BK9S4789X and Ref K7M4X2QH at ${new Date().toLocaleDateString('en-GB')}.`
  );
  const [isSendingSms, setIsSendingSms] = useState(false);
  const [smsResult, setSmsResult] = useState<any | null>(null);

  // Connection check calculation
  const connectionCheck = verifyClientIp(superAdminDevice.activeClientIp);

  const handleCopyToken = () => {
    navigator.clipboard.writeText(superAdminDevice.token);
    setCopiedToken(true);
    addToast('Token Copied', 'Super Admin device bearer token copied', 'info');
    setTimeout(() => setCopiedToken(false), 2000);
  };

  const handlePingDevice = () => {
    setIsPinging(true);
    setTimeout(() => {
      const res = pingSuperAdminDevice();
      setLastPingLatency(res.latencyMs);
      setIsPinging(false);
    }, 350);
  };

  const handleAddIp = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newIpInput.trim()) return;
    addWhitelistedIp(newIpInput.trim());
    setNewIpInput('');
  };

  const handleApplyPreset = (provider: ProviderType) => {
    const nowStr = new Date().toLocaleDateString('en-GB');
    const randomTrx = `${provider.slice(0, 2).toUpperCase()}${Math.floor(100000 + Math.random() * 900000)}`;
    setSenderName(provider === 'cellfin' ? 'IBBL' : provider);
    setSimSlot(provider === 'rocket' || provider === 'upay' || provider === 'cellfin' ? 2 : 1);

    if (provider === 'bkash') {
      setRawSmsBody(`You have received Tk 1,500.00 from 01712750278. Fee Tk 0.00. Balance Tk 24,500.00. TrxID ${randomTrx} and Ref K7M4X2QH at ${nowStr} 14:32.`);
    } else if (provider === 'nagad') {
      setRawSmsBody(`Money Received. Amount: Tk 2,500.00. Sender: 01819234567. TxnID: ${randomTrx}. Ref: N9B2K7L1. Time: ${nowStr} 15:45. New Balance: Tk 18,200.00.`);
    } else if (provider === 'rocket') {
      setRawSmsBody(`Cash In Tk 800.00 from 01912345678 successful. Fee Tk 0.00. TxnId: ${randomTrx} Ref: R8M2P4Q9 at ${nowStr}. Balance Tk 12,000.00.`);
    } else if (provider === 'upay') {
      setRawSmsBody(`Payment received Tk 1,200.00 from 01811122233. Fee Tk 0.00. TrxID: ${randomTrx}. Ref: U5K3M8P2. Balance: Tk 9,400.00 at ${nowStr}.`);
    } else if (provider === 'cellfin') {
      setRawSmsBody(`Cellfin Ac Transfer Tk 3,000.00 from A/C: 2050123456 to your Cellfin A/C successful. TrxID: ${randomTrx}. Ref: C4L8P1Q6 at ${nowStr}.`);
    }
  };

  const handleTransmitSms = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSendingSms(true);
    setSmsResult(null);

    try {
      const res = await ingestForwardedSms(
        rawSmsBody,
        senderName,
        simSlot,
        superAdminDevice.activeClientIp
      );
      setSmsResult(res);

      if (res.matchedPayment) {
        addToast(
          'Matching Complete!',
          `Payment ${res.matchedPayment.orderId} resolved to ${res.matchedPayment.status}`,
          'success'
        );
      } else if (res.ipBlocked) {
        addToast('Ingest Blocked', res.ipReason || 'Client IP blocked by firewall', 'error');
      } else {
        addToast('SMS Ingested', `TrxID ${res.parsed.trxId} received into pool`, 'info');
      }
    } finally {
      setIsSendingSms(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner: Single Device System Notice */}
      <div className="p-4 sm:p-5 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-amber-500/20 text-amber-600 dark:text-amber-400 shrink-0">
            <Radio className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold text-[var(--ink)]">
                Super Admin SMS Forwarder Active
              </span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-amber-500/20 text-amber-600 font-bold">
                Single Node System
              </span>
            </div>
            <p className="text-xs text-[var(--ink-2)] mt-0.5 leading-relaxed">
              Multi-device fleet balancing is silenced. All SMS ingestion is consolidated through this dedicated Super Admin hardware node, verified via IP whitelisting.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <GateButton
            variant="secondary"
            size="sm"
            onClick={handlePingDevice}
            isLoading={isPinging}
            icon={<RefreshCw className="w-3.5 h-3.5" />}
          >
            Ping Device ({lastPingLatency ? `${lastPingLatency}ms` : 'Test'})
          </GateButton>
          <GateButton
            variant="primary"
            size="sm"
            onClick={() => {
              setSmsResult(null);
              setIsTestSmsModalOpen(true);
            }}
            icon={<Send className="w-3.5 h-3.5" />}
          >
            Test SMS Ingest
          </GateButton>
        </div>
      </div>

      {/* Grid: Device Hardware Profile + IP Whitelisting Firewall */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Hardware & Telemetry Card (5 cols) */}
        <div className="lg:col-span-5 p-5 rounded-2xl bg-[var(--surface)] border border-[var(--border)] shadow-xs space-y-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-blue-500/10 text-blue-600 border border-blue-500/20">
                <Smartphone className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-sm font-bold text-[var(--ink)]">{superAdminDevice.name}</h2>
                <span className="text-xs text-[var(--ink-3)] font-mono">{superAdminDevice.model}</span>
              </div>
            </div>

            <span
              className={`px-2.5 py-1 rounded-full text-xs font-bold flex items-center gap-1.5 ${
                superAdminDevice.status === 'online'
                  ? 'bg-emerald-500/10 text-emerald-600 border border-emerald-500/20'
                  : 'bg-zinc-500/10 text-zinc-600 border border-zinc-500/20'
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              {superAdminDevice.status.toUpperCase()}
            </span>
          </div>

          {/* Telemetry Metrics */}
          <div className="grid grid-cols-2 gap-3 pt-2 border-t border-[var(--border)] text-xs">
            <div className="p-3 rounded-xl bg-[var(--surface-2)] space-y-1">
              <span className="text-[11px] text-[var(--ink-3)] flex items-center gap-1">
                <Battery className="w-3.5 h-3.5 text-emerald-500" /> Battery Level
              </span>
              <div className="flex items-baseline gap-2">
                <span className="text-base font-bold font-mono text-[var(--ink)]">
                  {superAdminDevice.battery}%
                </span>
                <span className="text-[10px] text-[var(--success)] font-medium">AC Powered</span>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-[var(--surface-2)] space-y-1">
              <span className="text-[11px] text-[var(--ink-3)] flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-blue-500" /> Last Heartbeat
              </span>
              <span className="text-xs font-semibold block text-[var(--ink)] truncate">
                {new Date(superAdminDevice.lastPingAt).toLocaleTimeString()}
              </span>
            </div>
          </div>

          {/* SIM Slots Binding */}
          <div className="space-y-2 pt-2 border-t border-[var(--border)]">
            <span className="text-xs font-bold text-[var(--ink)] block">
              Dual SIM Hardware Binding
            </span>
            <div className="space-y-2">
              <div className="p-2.5 rounded-xl bg-[var(--surface-2)] flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-[var(--surface)] text-[var(--ink-2)] border border-[var(--border)]">
                    SLOT 1
                  </span>
                  <ProviderBadge provider={superAdminDevice.sim1Provider} size="sm" />
                </div>
                <span className="font-mono font-semibold text-[var(--ink)]">
                  {superAdminDevice.sim1Msisdn}
                </span>
              </div>

              <div className="p-2.5 rounded-xl bg-[var(--surface-2)] flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-[var(--surface)] text-[var(--ink-2)] border border-[var(--border)]">
                    SLOT 2
                  </span>
                  <ProviderBadge provider={superAdminDevice.sim2Provider} size="sm" />
                </div>
                <span className="font-mono font-semibold text-[var(--ink)]">
                  {superAdminDevice.sim2Msisdn}
                </span>
              </div>
            </div>
          </div>

          {/* Bearer Token */}
          <div className="space-y-1.5 pt-2 border-t border-[var(--border)]">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-[var(--ink)] flex items-center gap-1">
                <KeyRound className="w-3.5 h-3.5 text-[var(--ink-3)]" /> Device Bearer Token
              </span>
              <button
                onClick={() => setShowToken(!showToken)}
                className="text-[11px] text-[var(--accent)] hover:underline flex items-center gap-1 cursor-pointer"
              >
                {showToken ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                <span>{showToken ? 'Hide' : 'Reveal'}</span>
              </button>
            </div>
            <div className="flex items-center gap-2 bg-[var(--surface-2)] border border-[var(--border)] rounded-xl px-3 py-2 text-xs font-mono text-[var(--ink-2)]">
              <span className="truncate flex-1">
                {showToken ? superAdminDevice.token : '••••••••••••••••••••••••••••••••'}
              </span>
              <button
                onClick={handleCopyToken}
                className="p-1 text-[var(--ink-3)] hover:text-[var(--ink)] cursor-pointer shrink-0"
                title="Copy token"
              >
                {copiedToken ? (
                  <Check className="w-3.5 h-3.5 text-[var(--success)]" />
                ) : (
                  <Copy className="w-3.5 h-3.5" />
                )}
              </button>
            </div>
          </div>
        </div>

        {/* IP Whitelisting & Firewall Controls (7 cols) */}
        <div className="lg:col-span-7 p-5 rounded-2xl bg-[var(--surface)] border border-[var(--border)] shadow-xs space-y-5">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-amber-500/10 text-amber-600 border border-amber-500/20">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-sm font-bold text-[var(--ink)]">IP Whitelist Firewall</h2>
                <span className="text-xs text-[var(--ink-3)]">
                  Verify forwarder connection by strict source IP matching
                </span>
              </div>
            </div>

            {/* Toggle IP Enforcement */}
            <button
              onClick={toggleIpEnforcement}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 border ${
                superAdminDevice.isIpEnforced
                  ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-500/30'
                  : 'bg-zinc-500/15 text-zinc-600 border-zinc-500/30'
              }`}
            >
              <span
                className={`w-2 h-2 rounded-full ${
                  superAdminDevice.isIpEnforced ? 'bg-emerald-500' : 'bg-zinc-400'
                }`}
              />
              {superAdminDevice.isIpEnforced ? 'STRICT CHECK: ON' : 'STRICT CHECK: OFF'}
            </button>
          </div>

          {/* Connection Verification Status Box */}
          <div
            className={`p-4 rounded-xl border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 ${
              connectionCheck.allowed
                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-700 dark:text-emerald-300'
                : 'bg-rose-500/10 border-rose-500/30 text-rose-700 dark:text-rose-300'
            }`}
          >
            <div className="flex items-center gap-3">
              {connectionCheck.allowed ? (
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
              ) : (
                <XCircle className="w-5 h-5 text-rose-600 shrink-0" />
              )}
              <div>
                <span className="text-xs font-bold block">
                  {connectionCheck.allowed
                    ? '200 OK — Connection Verified & Authorized'
                    : '403 Forbidden — Unauthorized Client IP'}
                </span>
                <span className="text-[11px] opacity-90 block mt-0.5">
                  {connectionCheck.reason}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <span className="text-[11px] font-mono font-semibold px-2 py-0.5 rounded bg-[var(--surface)] text-[var(--ink)] border border-[var(--border)]">
                IP: {superAdminDevice.activeClientIp}
              </span>
            </div>
          </div>

          {/* Active Network Interface Telemetry */}
          <div className="p-3.5 rounded-xl bg-[var(--surface-2)] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border border-[var(--border)]">
            <div className="flex items-center gap-2.5">
              <Wifi className="w-4 h-4 text-emerald-500 shrink-0" />
              <div>
                <span className="text-xs font-bold text-[var(--ink)] block">
                  Hardware Network Interface (LTE / Ethernet)
                </span>
                <span className="text-[11px] text-[var(--ink-2)]">
                  Carrier Gateway IP: <code className="font-mono text-[var(--ink)] font-semibold">{superAdminDevice.activeClientIp}</code> (Subnet Route Verified)
                </span>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-[var(--surface)] text-emerald-600 border border-emerald-500/20 font-semibold">
                mTLS ENFORCED
              </span>
            </div>
          </div>

          {/* Whitelisted IP List */}
          <div className="space-y-3 pt-2 border-t border-[var(--border)]">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-[var(--ink)]">
                Whitelisted CIDR / IP Rules ({superAdminDevice.whitelistedIps.length})
              </span>
              <button
                onClick={() => addWhitelistedIp(superAdminDevice.activeClientIp)}
                className="text-xs text-[var(--accent)] hover:underline font-medium cursor-pointer"
              >
                + Whitelist Current IP
              </button>
            </div>

            {/* List */}
            <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
              {superAdminDevice.whitelistedIps.map((ip) => (
                <div
                  key={ip}
                  className="p-2 px-3 rounded-lg bg-[var(--surface-2)] border border-[var(--border)] flex items-center justify-between text-xs font-mono"
                >
                  <div className="flex items-center gap-2">
                    <span className="text-[var(--ink)] font-semibold">{ip}</span>
                    {ip === superAdminDevice.activeClientIp && (
                      <span className="text-[9px] px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-600 font-sans font-bold">
                        ACTIVE
                      </span>
                    )}
                  </div>
                  <button
                    onClick={() => removeWhitelistedIp(ip)}
                    className="text-[var(--ink-3)] hover:text-rose-500 p-1 cursor-pointer transition-colors"
                    title={`Remove ${ip}`}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>

            {/* Add IP Form */}
            <form onSubmit={handleAddIp} className="flex items-center gap-2 pt-1">
              <input
                type="text"
                value={newIpInput}
                onChange={(e) => setNewIpInput(e.target.value)}
                placeholder="Add IP or CIDR (e.g. 192.168.1.0/24)"
                className="flex-1 bg-[var(--surface-2)] border border-[var(--border)] rounded-lg px-3 py-1.5 text-xs font-mono text-[var(--ink)] focus:outline-none focus:border-[var(--accent)]"
              />
              <GateButton
                type="submit"
                variant="primary"
                size="sm"
                icon={<Plus className="w-3.5 h-3.5" />}
              >
                Add IP
              </GateButton>
            </form>
          </div>
        </div>
      </div>

      {/* Real Forwarded SMS Ingestion Telemetry & Reconciliation Stream */}
      <div className="p-5 rounded-2xl bg-[var(--surface)] border border-[var(--border)] shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-[var(--border)] pb-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-[var(--accent-soft)] text-[var(--accent)] border border-[var(--border)]">
              <Terminal className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-bold text-[var(--ink)]">
                  Forwarded SMS Telemetry & Reconciliation Stream
                </h2>
                <span className="px-2 py-0.5 rounded-md text-[10px] font-mono bg-emerald-500/10 text-emerald-600 font-semibold border border-emerald-500/20">
                  LIVE INGEST
                </span>
              </div>
              <p className="text-xs text-[var(--ink-2)] mt-0.5">
                Authoritative confirmation SMS messages relayed from the Knox-secured Super Admin handset over cryptographically signed mTLS/HTTPS.
              </p>
            </div>
          </div>

          {/* Provider Filter Segmented Tabs */}
          <div className="flex items-center gap-1 p-1 bg-[var(--surface-2)] rounded-lg border border-[var(--border)]">
            {(['all', 'bkash', 'nagad', 'rocket', 'upay', 'cellfin'] as const).map((prov) => (
              <button
                key={prov}
                onClick={() => setFilterProvider(prov)}
                className={`px-2.5 py-1 text-xs font-medium rounded-md transition-all cursor-pointer ${
                  filterProvider === prov
                    ? 'bg-[var(--surface)] text-[var(--ink)] shadow-xs font-semibold'
                    : 'text-[var(--ink-3)] hover:text-[var(--ink)]'
                }`}
              >
                {prov.toUpperCase()}
              </button>
            ))}
          </div>
        </div>

        {/* Real Ingested SMS Table */}
        {(() => {
          const filteredTxns = incomingTxns.filter((txn) =>
            filterProvider === 'all' ? true : txn.provider.toLowerCase() === filterProvider
          );

          if (filteredTxns.length === 0) {
            return (
              <div className="py-12 text-center space-y-2">
                <Radio className="w-8 h-8 text-[var(--ink-3)] mx-auto opacity-50" />
                <span className="text-xs font-bold text-[var(--ink)] block">
                  No Forwarded SMS Ingested Yet for {filterProvider.toUpperCase()}
                </span>
                <span className="text-xs text-[var(--ink-3)] max-w-sm mx-auto block leading-relaxed">
                  Incoming confirmation messages received on physical SIM 1 or SIM 2 will automatically appear here once relayed by the Android forwarder service.
                </span>
              </div>
            );
          }

          return (
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead>
                  <tr className="border-b border-[var(--border)] text-[var(--ink-3)] font-semibold">
                    <th className="pb-2.5">Received</th>
                    <th className="pb-2.5">Provider</th>
                    <th className="pb-2.5">SIM Slot</th>
                    <th className="pb-2.5">Transaction ID</th>
                    <th className="pb-2.5">Amount (BDT)</th>
                    <th className="pb-2.5">Reference</th>
                    <th className="pb-2.5">Claim & Ledger Status</th>
                    <th className="pb-2.5 text-right">Raw Payload</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--border)]">
                  {filteredTxns.map((txn) => {
                    const matchedPayment = payments.find(
                      (p) => p.id === txn.claimedPaymentId || (p.submittedTrxId && p.submittedTrxId === txn.trxId)
                    );

                    return (
                      <tr key={txn.id || txn.trxId} className="hover:bg-[var(--surface-2)]/50 transition-colors">
                        <td className="py-2.5 font-mono text-[var(--ink-3)]">
                          {new Date().toLocaleTimeString()}
                        </td>
                        <td className="py-2.5">
                          <ProviderBadge provider={txn.provider} size="sm" />
                        </td>
                        <td className="py-2.5 font-mono text-[var(--ink-2)]">
                          SIM {txn.simSlot || 1}
                        </td>
                        <td className="py-2.5 font-mono font-bold text-[var(--ink)]">
                          {txn.trxId}
                        </td>
                        <td className="py-2.5 font-mono font-bold text-[var(--ink)]">
                          Tk {(txn.amountPaisa / 100).toFixed(2)}
                        </td>
                        <td className="py-2.5 font-mono font-semibold text-[var(--accent)]">
                          {txn.refNormalized || txn.refRaw || '—'}
                        </td>
                        <td className="py-2.5">
                          {matchedPayment ? (
                            <button
                              onClick={() => setSelectedPaymentId(matchedPayment.id)}
                              className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-600 border border-emerald-500/20 font-bold hover:underline cursor-pointer"
                            >
                              MATCHED: {matchedPayment.orderId}
                            </button>
                          ) : (
                            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-blue-500/10 text-blue-600 border border-blue-500/20 font-semibold">
                              INGEST POOL (UNCLAIMED)
                            </span>
                          )}
                        </td>
                        <td className="py-2.5 text-right">
                          <button
                            onClick={() => setSelectedRawTxn(txn)}
                            className="text-[11px] text-[var(--accent)] hover:underline font-medium cursor-pointer"
                          >
                            Inspect Raw
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          );
        })()}

        {/* Raw Payload Inspector Modal */}
        {selectedRawTxn && (
          <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="w-full max-w-lg bg-[var(--surface)] border border-[var(--border)] rounded-2xl shadow-xl overflow-hidden p-5 space-y-4 animate-in fade-in zoom-in-95 duration-150">
              <div className="flex items-center justify-between border-b border-[var(--border)] pb-3">
                <div className="flex items-center gap-2">
                  <Terminal className="w-4 h-4 text-[var(--accent)]" />
                  <span className="text-xs font-bold text-[var(--ink)]">
                    Raw Telco SMS Payload Inspector
                  </span>
                </div>
                <button
                  onClick={() => setSelectedRawTxn(null)}
                  className="p-1 text-[var(--ink-3)] hover:text-[var(--ink)] cursor-pointer rounded-lg"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-3 text-xs">
                <div>
                  <span className="text-[11px] text-[var(--ink-3)] block mb-1">Unprocessed Carrier SMS Body</span>
                  <div className="p-3 rounded-xl bg-[var(--surface-2)] border border-[var(--border)] font-mono text-[var(--ink)] leading-relaxed select-all">
                    {selectedRawTxn.rawSms}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 text-[11px] font-mono">
                  <div className="p-2.5 rounded-lg bg-[var(--surface-2)] border border-[var(--border)]">
                    <span className="text-[var(--ink-3)] block">Extracted TrxID</span>
                    <span className="font-bold text-[var(--ink)]">{selectedRawTxn.trxId}</span>
                  </div>
                  <div className="p-2.5 rounded-lg bg-[var(--surface-2)] border border-[var(--border)]">
                    <span className="text-[var(--ink-3)] block">Parsed Amount</span>
                    <span className="font-bold text-[var(--ink)]">Tk {(selectedRawTxn.amountPaisa / 100).toFixed(2)}</span>
                  </div>
                  <div className="p-2.5 rounded-lg bg-[var(--surface-2)] border border-[var(--border)]">
                    <span className="text-[var(--ink-3)] block">Carrier SIM Slot</span>
                    <span className="font-bold text-[var(--ink)]">SIM {selectedRawTxn.simSlot || 1}</span>
                  </div>
                  <div className="p-2.5 rounded-lg bg-[var(--surface-2)] border border-[var(--border)]">
                    <span className="text-[var(--ink-3)] block">Extracted Reference</span>
                    <span className="font-bold text-[var(--accent)]">{selectedRawTxn.refNormalized || selectedRawTxn.refRaw || 'None'}</span>
                  </div>
                </div>
              </div>

              <div className="flex justify-end pt-2">
                <GateButton
                  variant="secondary"
                  size="sm"
                  onClick={() => setSelectedRawTxn(null)}
                >
                  Close Inspector
                </GateButton>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Verification & Handshake Logs */}
      <div className="p-5 rounded-2xl bg-[var(--surface)] border border-[var(--border)] shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <Activity className="w-4 h-4 text-[var(--accent)]" />
            <h3 className="text-sm font-bold text-[var(--ink)]">
              Recent IP Verification & Handshake Trail
            </h3>
          </div>
          <span className="text-xs text-[var(--ink-3)] font-mono">
            {superAdminDevice.verificationLogs?.length || 0} entries
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead>
              <tr className="border-b border-[var(--border)] text-[var(--ink-3)] font-semibold">
                <th className="pb-2.5">Timestamp</th>
                <th className="pb-2.5">Action</th>
                <th className="pb-2.5">Source IP</th>
                <th className="pb-2.5">Firewall Status</th>
                <th className="pb-2.5">Resolution Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border)]">
              {(superAdminDevice.verificationLogs || []).slice(0, 10).map((log) => (
                <tr key={log.id} className="hover:bg-[var(--surface-2)]/50 transition-colors">
                  <td className="py-2.5 font-mono text-[var(--ink-3)]">
                    {new Date(log.timestamp).toLocaleTimeString()}
                  </td>
                  <td className="py-2.5 font-semibold capitalize text-[var(--ink)]">
                    {log.action.replace('_', ' ')}
                  </td>
                  <td className="py-2.5 font-mono font-semibold text-[var(--ink)]">
                    {log.ip}
                  </td>
                  <td className="py-2.5">
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold font-mono ${
                        log.status === 'allowed'
                          ? 'bg-emerald-500/10 text-emerald-600 border border-emerald-500/20'
                          : 'bg-rose-500/10 text-rose-600 border border-rose-500/20'
                      }`}
                    >
                      {log.status.toUpperCase()}
                    </span>
                  </td>
                  <td className="py-2.5 text-[var(--ink-2)] truncate max-w-xs">
                    {log.reason}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Test SMS Ingestion Simulator Modal */}
      {isTestSmsModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-lg bg-[var(--surface)] border border-[var(--border)] rounded-2xl shadow-2xl overflow-hidden p-6 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-[var(--border)] pb-3">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-[var(--accent-soft)] text-[var(--accent)]">
                  <Terminal className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-[var(--ink)]">
                    Simulate Telco SMS Ingestion
                  </h3>
                  <span className="text-[11px] text-[var(--ink-3)]">
                    Direct injection into matching & double-entry ledger engine
                  </span>
                </div>
              </div>
              <button
                onClick={() => setIsTestSmsModalOpen(false)}
                className="p-1 text-[var(--ink-3)] hover:text-[var(--ink)] cursor-pointer rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleTransmitSms} className="space-y-4">
              {/* Presets */}
              <div>
                <label className="text-xs font-medium text-[var(--ink-3)] block mb-1.5">
                  Load Telco SMS Template Preset
                </label>
                <div className="grid grid-cols-5 gap-1.5">
                  {(['bkash', 'nagad', 'rocket', 'upay', 'cellfin'] as ProviderType[]).map((p) => (
                    <button
                      key={p}
                      type="button"
                      onClick={() => handleApplyPreset(p)}
                      className="px-2 py-1.5 rounded-lg border border-[var(--border)] bg-[var(--surface-2)] hover:bg-[var(--surface)] text-xs font-semibold capitalize text-[var(--ink)] cursor-pointer transition-colors"
                    >
                      {p}
                    </button>
                  ))}
                </div>
              </div>

              {/* SIM Slot & Sender */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-[var(--ink-2)] block mb-1">
                    Sender Mask ID
                  </label>
                  <input
                    type="text"
                    value={senderName}
                    onChange={(e) => setSenderName(e.target.value)}
                    className="w-full h-9 px-3 rounded-lg bg-[var(--surface-2)] border border-[var(--border)] text-xs font-mono text-[var(--ink)] focus:outline-none focus:border-[var(--accent)]"
                    required
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-[var(--ink-2)] block mb-1">
                    Carrier SIM Slot
                  </label>
                  <select
                    value={simSlot}
                    onChange={(e) => setSimSlot(Number(e.target.value) as 1 | 2)}
                    className="w-full h-9 px-3 rounded-lg bg-[var(--surface-2)] border border-[var(--border)] text-xs font-mono text-[var(--ink)] focus:outline-none focus:border-[var(--accent)]"
                  >
                    <option value={1}>SIM 1 ({superAdminDevice.sim1Msisdn})</option>
                    <option value={2}>SIM 2 ({superAdminDevice.sim2Msisdn})</option>
                  </select>
                </div>
              </div>

              {/* Raw SMS Body */}
              <div>
                <label className="text-xs font-medium text-[var(--ink-2)] block mb-1">
                  Raw SMS Payload
                </label>
                <textarea
                  rows={4}
                  value={rawSmsBody}
                  onChange={(e) => setRawSmsBody(e.target.value)}
                  className="w-full p-3 rounded-xl bg-[var(--surface-2)] border border-[var(--border)] text-xs font-mono text-[var(--ink)] focus:outline-none focus:border-[var(--accent)] leading-relaxed"
                  required
                />
              </div>

              {/* Result Preview if available */}
              {smsResult && (
                <div className={`p-3.5 rounded-xl border text-xs space-y-1.5 ${
                  smsResult.matchedPayment
                    ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-800 dark:text-emerald-300'
                    : smsResult.ipBlocked
                    ? 'bg-rose-500/10 border-rose-500/30 text-rose-800 dark:text-rose-300'
                    : 'bg-blue-500/10 border-blue-500/30 text-blue-800 dark:text-blue-300'
                }`}>
                  <div className="flex items-center gap-1.5 font-bold">
                    {smsResult.matchedPayment ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    ) : smsResult.ipBlocked ? (
                      <XCircle className="w-4 h-4 text-rose-600" />
                    ) : (
                      <CheckCircle2 className="w-4 h-4 text-blue-600" />
                    )}
                    <span>
                      {smsResult.matchedPayment
                        ? `Reconciled with Order ${smsResult.matchedPayment.orderId}`
                        : smsResult.ipBlocked
                        ? 'Blocked by Hardware Firewall'
                        : `Ingested as TrxID ${smsResult.parsed?.trxId || 'N/A'}`}
                    </span>
                  </div>
                  {smsResult.matchedPayment && (
                    <div className="text-[11px] font-mono">
                      Matched by: {smsResult.matchedPayment.matchedBy} · Amount: Tk {(smsResult.matchedPayment.amountPaisa / 100).toFixed(2)}
                    </div>
                  )}
                </div>
              )}

              <div className="flex items-center gap-2 pt-2">
                <GateButton
                  type="button"
                  variant="secondary"
                  className="flex-1"
                  onClick={() => setIsTestSmsModalOpen(false)}
                >
                  Close
                </GateButton>
                <GateButton
                  type="submit"
                  variant="primary"
                  className="flex-1"
                  isLoading={isSendingSms}
                  icon={<Send className="w-3.5 h-3.5" />}
                >
                  Transmit SMS
                </GateButton>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
