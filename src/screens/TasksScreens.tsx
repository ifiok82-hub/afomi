import React, { useMemo, useState } from 'react';
import {
  ArrowLeft,
  CheckCircle2,
  Clock,
  Flag,
  ImagePlus,
  Loader2,
  Lock,
  Plus,
  Search,
  ShieldCheck,
  Upload,
  X,
} from 'lucide-react';
import { useAfomi } from '../context/AfomiContext';
import { AfomiImage, EscrowStatusBadge, FundsLockedTag } from '../components/AfomiUI';
import { GENERATED_IMAGES } from '../data/seedData';
import { payForTask } from '../lib/piPayments';
import { validatePiAmount, validateRequired, validateWorkersCount } from '../lib/validation';
import { Task, TaskCategory } from '../types/afomi';

const TASK_CATEGORIES: TaskCategory[] = [
  'All',
  'Labeling',
  'Translation',
  'Ranking',
  'Testing',
  'Survey',
  'Photo Task',
];

export const TasksPage: React.FC<{ initialTaskId?: string | null }> = ({ initialTaskId }) => {
  const {
    tasks,
    submissions,
    user,
    feeRate,
    adminSettings,
    navigate,
    submitTaskWork,
    appealSubmission,
    reportListing,
    showToast,
  } = useAfomi();

  const [category, setCategory] = useState<TaskCategory>('All');
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState<'pay-desc' | 'spots-desc' | 'newest'>('pay-desc');
  const [viewMode, setViewMode] = useState<'browse' | 'my-submissions'>('browse');
  const [selectedTask, setSelectedTask] = useState<Task | null>(
    () => (initialTaskId ? tasks.find((t) => t.id === initialTaskId) || null : null)
  );
  const [submissionText, setSubmissionText] = useState('');
  const [submissionImage, setSubmissionImage] = useState<string>('');
  const [appealDrafts, setAppealDrafts] = useState<Record<string, string>>({});
  const [reportTarget, setReportTarget] = useState<Task | null>(null);
  const [reportReason, setReportReason] = useState('');
  const [payingTaskId, setPayingTaskId] = useState<string | null>(null);
  const [paymentError, setPaymentError] = useState('');

  const handlePayEscrow = async (
    e: React.MouseEvent<HTMLButtonElement>,
    task: Task
  ) => {
    e.preventDefault();
    e.stopPropagation();
    if (payingTaskId) return;
    const pricePi = Number(task.pricePi ?? task.payPerWorker);
    setPayingTaskId(task.id);
    setPaymentError('');
    try {
      await payForTask({
        taskId: task.id,
        taskTitle: task.title,
        amount: pricePi,
        workerUid: task.workerUid || '',
      });
      const successMsg = 'Payment held in escrow!';
      showToast(successMsg, 'success');
      window.alert(successMsg);
    } catch (err: unknown) {
      console.error(err);
      const msg = err instanceof Error ? err.message : String(err || 'Unknown Pi error');
      const errorMsg = msg.startsWith('Old payment cancelled') ? msg : `Payment failed: ${msg}`;
      setPaymentError(errorMsg);
      showToast(errorMsg, 'error');
      window.alert(errorMsg);
    } finally {
      setPayingTaskId(null);
    }
  };

  const filteredTasks = useMemo(() => {
    const q = search.trim().toLowerCase();
    const list = tasks.filter((t) => {
      const catOk = category === 'All' || t.category === category;
      const qOk =
        !q ||
        t.title.toLowerCase().includes(q) ||
        t.postedBy.toLowerCase().includes(q) ||
        t.category.toLowerCase().includes(q);
      return catOk && qOk;
    });

    if (sortBy === 'pay-desc') return [...list].sort((a, b) => b.payPerWorker - a.payPerWorker);
    if (sortBy === 'spots-desc') return [...list].sort((a, b) => b.spotsLeft - a.spotsLeft);
    return list;
  }, [tasks, category, search, sortBy]);

  const mySubmissions = useMemo(() => {
    const email = user?.email?.toLowerCase();
    return submissions.filter(
      (s) => !email || s.workerEmail.toLowerCase() === email || s.id.startsWith('subm-1')
    );
  }, [submissions, user]);

  const handleImageFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') setSubmissionImage(reader.result);
    };
    reader.readAsDataURL(file);
  };

  const handleSubmitWork = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTask) return;
    const res = submitTaskWork(selectedTask.id, submissionText, submissionImage || undefined);
    if (res.ok) {
      setSubmissionText('');
      setSubmissionImage('');
      setSelectedTask(null);
      setViewMode('my-submissions');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#1A1625]">Micro-Tasks</h1>
          <p className="text-sm text-[#645E72] mt-1">
            All tasks are pre-funded in AFOMI Escrow. Receive {100 - adminSettings.afomiFeePercent}% on approval (
            {adminSettings.autoApproveHours}h auto-approve guarantee).
          </p>
        </div>
        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={() => navigate('post-task')}
            className="min-h-[44px] px-4 py-2.5 rounded-xl bg-[#6A1B9A] hover:bg-[#581482] text-white text-xs font-semibold inline-flex items-center gap-1.5 whitespace-nowrap cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Post a Task</span>
          </button>
        </div>
      </div>

      {/* Mode Switcher */}
      <div className="flex items-center gap-2 border-b border-[#E7E3EE] pb-3">
        <button
          type="button"
          onClick={() => setViewMode('browse')}
          className={`min-h-[40px] px-4 py-2 rounded-xl text-xs font-semibold transition-colors cursor-pointer ${
            viewMode === 'browse'
              ? 'bg-[#6A1B9A] text-white'
              : 'bg-white border border-[#E7E3EE] text-[#645E72] hover:text-[#1A1625]'
          }`}
        >
          Browse Open Tasks ({tasks.length})
        </button>
        <button
          type="button"
          onClick={() => setViewMode('my-submissions')}
          className={`min-h-[40px] px-4 py-2 rounded-xl text-xs font-semibold transition-colors cursor-pointer ${
            viewMode === 'my-submissions'
              ? 'bg-[#6A1B9A] text-white'
              : 'bg-white border border-[#E7E3EE] text-[#645E72] hover:text-[#1A1625]'
          }`}
        >
          My Submitted Work ({mySubmissions.length})
        </button>
      </div>

      {viewMode === 'browse' ? (
        <>
          <div className="space-y-3">
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-[#645E72] absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search tasks by title, skill, or poster..."
                  className="w-full min-h-[44px] pl-10 pr-4 rounded-xl bg-white border border-[#E7E3EE] text-sm focus:outline-none focus:border-[#6A1B9A]"
                />
              </div>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
                className="min-h-[44px] px-3.5 rounded-xl bg-white border border-[#E7E3EE] text-sm font-medium text-[#1A1625] focus:outline-none focus:border-[#6A1B9A]"
              >
                <option value="pay-desc">Sort: Highest Pay (Pi)</option>
                <option value="spots-desc">Sort: Most Spots Left</option>
                <option value="newest">Sort: Newest</option>
              </select>
            </div>

            <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1">
              {TASK_CATEGORIES.map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setCategory(cat)}
                  className={`min-h-[38px] px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap shrink-0 transition-colors cursor-pointer ${
                    category === cat
                      ? 'bg-[#6A1B9A] text-white'
                      : 'bg-white border border-[#E7E3EE] text-[#645E72] hover:text-[#1A1625]'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {paymentError && (
            <div className="rounded-xl bg-rose-50 border border-rose-200 p-3 text-xs font-semibold text-rose-700">
              {paymentError}
            </div>
          )}

          {filteredTasks.length === 0 ? (
            <div className="rounded-2xl bg-white border border-[#E7E3EE] p-10 text-center">
              <p className="text-base font-bold text-[#1A1625]">
                {tasks.length === 0 ? 'No tasks yet' : 'No tasks match your filter'}
              </p>
              <p className="text-xs text-[#645E72] mt-1">
                {tasks.length === 0
                  ? 'Post the first Escrow-backed task or enable Demo Mode in Admin Settings.'
                  : 'Try clearing your search or selecting All categories.'}
              </p>
              {tasks.length === 0 ? (
                <button
                  type="button"
                  onClick={() => navigate('post-task')}
                  className="mt-4 px-4 py-2 rounded-xl bg-[#6A1B9A] text-white text-xs font-semibold cursor-pointer"
                >
                  Post a Task
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    setCategory('All');
                    setSearch('');
                  }}
                  className="mt-4 px-4 py-2 rounded-xl bg-[#6A1B9A] text-white text-xs font-semibold cursor-pointer"
                >
                  Reset Filters
                </button>
              )}
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredTasks.map((task) => (
                <div
                  key={task.id}
                  className="rounded-2xl bg-white border border-[#E7E3EE] p-5 flex flex-col justify-between hover:border-[#6A1B9A] transition-colors"
                >
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-2.5">
                      <span className="text-xs text-[#645E72] font-medium">
                        {task.category} · {task.estimatedTime} · {task.difficulty}
                      </span>
                      <FundsLockedTag />
                    </div>
                    <h2 className="text-base font-bold text-[#1A1625] leading-snug">{task.title}</h2>
                    <p className="text-xs text-[#645E72] mt-2 line-clamp-2">{task.description}</p>
                    <div className="mt-3 text-xs text-[#645E72]">
                      Posted by <span className="font-semibold text-[#1A1625]">{task.postedBy}</span> · Deadline{' '}
                      <span className="tabular-nums">{task.deadline}</span>
                    </div>
                  </div>

                  <div className="mt-4 pt-3.5 border-t border-[#F1EEF6] flex items-center justify-between gap-2">
                    <div>
                      <div className="text-lg font-extrabold text-[#6A1B9A] tabular-nums">
                        {task.payPerWorker.toFixed(2)} Pi
                      </div>
                      <div className="text-[11px] text-[#645E72] tabular-nums">
                        {task.status} · Spots Left: {task.spotsLeft}/{task.totalWorkers}
                      </div>
                    </div>
                    <div className="flex flex-wrap items-center justify-end gap-1.5">
                      <button
                        type="button"
                        aria-label="Report task"
                        onClick={() => {
                          setReportTarget(task);
                          setReportReason('');
                        }}
                        className="min-h-[40px] min-w-[40px] rounded-xl border border-[#E7E3EE] text-[#645E72] hover:text-rose-600 flex items-center justify-center cursor-pointer"
                      >
                        <Flag className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        disabled={payingTaskId === task.id}
                        onClick={(e) => void handlePayEscrow(e, task)}
                        className="min-h-[42px] px-3 py-2 rounded-xl bg-[#FFC107] hover:bg-[#f0b400] disabled:opacity-60 text-[#2B1F00] text-xs font-bold whitespace-nowrap cursor-pointer"
                      >
                        {payingTaskId === task.id
                          ? 'Processing...'
                          : `Pay ${Number(task.pricePi ?? task.payPerWorker)} Pi - Escrow`}
                      </button>
                      <button
                        type="button"
                        disabled={task.spotsLeft <= 0}
                        onClick={() => setSelectedTask(task)}
                        className="min-h-[42px] px-4 py-2 rounded-xl bg-[#6A1B9A] hover:bg-[#581482] disabled:bg-slate-200 disabled:text-slate-500 text-white text-xs font-semibold whitespace-nowrap cursor-pointer"
                      >
                        {task.spotsLeft > 0 ? 'Start Task' : 'Filled'}
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      ) : (
        <div className="space-y-3">
          {mySubmissions.length === 0 ? (
            <div className="rounded-2xl bg-white border border-[#E7E3EE] p-10 text-center text-sm text-[#645E72]">
              No submitted work yet.
            </div>
          ) : (
            mySubmissions.map((sub) => (
              <div key={sub.id} className="rounded-2xl bg-white border border-[#E7E3EE] p-5 space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <span className="text-xs text-[#645E72]">
                      {sub.category} · Submitted {sub.submittedAt}
                    </span>
                    <h3 className="text-base font-bold text-[#1A1625] mt-0.5">{sub.taskTitle}</h3>
                  </div>
                  <EscrowStatusBadge status={sub.status} />
                </div>

                <p className="text-xs text-[#1A1625] bg-[#FAF8FC] rounded-xl p-3 border border-[#F1EEF6]">
                  {sub.submissionText}
                </p>

                <div className="flex flex-wrap items-center justify-between gap-3 text-xs">
                  <div className="text-[#645E72] tabular-nums">
                    Worker Payout ({100 - adminSettings.afomiFeePercent}%):{' '}
                    <span className="font-bold text-[#6A1B9A]">{sub.workerNetPay.toFixed(2)} Pi</span> · AFOMI Fee:{' '}
                    <span>{sub.afomiFee.toFixed(2)} Pi</span>
                  </div>
                  {sub.status === 'PENDING REVIEW' && (
                    <span className="inline-flex items-center gap-1.5 text-amber-800 font-medium">
                      <Clock className="w-3.5 h-3.5" />
                      <span>Payment locked in Escrow · Auto-approves in {sub.hoursRemaining48h}h</span>
                    </span>
                  )}
                  {sub.status === 'APPROVED' && (
                    <span className="inline-flex items-center gap-1.5 text-emerald-700 font-bold tabular-nums">
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Payment Released: +{sub.workerNetPay.toFixed(2)} Pi</span>
                    </span>
                  )}
                </div>

                {sub.status === 'REJECTED' && (
                  <div className="rounded-xl bg-rose-50 border border-rose-200 p-3.5 space-y-2">
                    <p className="text-xs font-semibold text-rose-800">
                      Rejected Reason: {sub.rejectionReason || 'Proof incomplete.'} (0 Pi released; spot reopened)
                    </p>
                    {!sub.appealed ? (
                      <div className="flex flex-col sm:flex-row gap-2">
                        <input
                          type="text"
                          value={appealDrafts[sub.id] || ''}
                          onChange={(e) => setAppealDrafts((d) => ({ ...d, [sub.id]: e.target.value }))}
                          placeholder="Explain why your submission meets instructions (1 appeal allowed)..."
                          className="flex-1 min-h-[40px] px-3 rounded-lg bg-white border border-rose-200 text-xs focus:outline-none"
                        />
                        <button
                          type="button"
                          onClick={() => appealSubmission(sub.id, appealDrafts[sub.id] || '')}
                          className="min-h-[40px] px-4 rounded-lg bg-[#6A1B9A] text-white text-xs font-semibold whitespace-nowrap cursor-pointer"
                        >
                          Appeal Once
                        </button>
                      </div>
                    ) : (
                      <p className="text-xs text-[#645E72]">Appeal submitted for Admin review.</p>
                    )}
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      )}

      {/* Task Detail & Work Submission Modal */}
      {selectedTask && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="bg-white w-full sm:max-w-2xl rounded-t-3xl sm:rounded-3xl max-h-[90vh] overflow-y-auto border border-[#E7E3EE]">
            <div className="sticky top-0 bg-white/95 backdrop-blur-md px-6 py-4 border-b border-[#E7E3EE] flex items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                <FundsLockedTag label="Funds Locked in Escrow" />
                <span className="text-xs text-[#645E72] tabular-nums">
                  {selectedTask.spotsLeft}/{selectedTask.totalWorkers} spots left
                </span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setReportTarget(selectedTask);
                    setReportReason('');
                  }}
                  className="min-h-[36px] px-3 rounded-lg border border-[#E7E3EE] text-xs font-semibold text-rose-600 inline-flex items-center gap-1 cursor-pointer"
                >
                  <Flag className="w-3.5 h-3.5" />
                  <span>Report</span>
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedTask(null)}
                  className="min-h-[40px] min-w-[40px] flex items-center justify-center rounded-xl hover:bg-[#FAF8FC] cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="p-6 space-y-5">
              <div>
                <div className="text-xs text-[#645E72]">
                  {selectedTask.category} · {selectedTask.estimatedTime} · Posted by {selectedTask.postedBy}
                </div>
                <h2 className="text-xl font-extrabold text-[#1A1625] mt-1">{selectedTask.title}</h2>
                <p className="text-sm text-[#645E72] mt-2 leading-relaxed">{selectedTask.description}</p>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 bg-[#FAF8FC] rounded-2xl p-4 border border-[#E7E3EE]">
                <div>
                  <div className="text-[11px] text-[#645E72]">
                    Worker Receives ({100 - adminSettings.afomiFeePercent}%)
                  </div>
                  <div className="text-lg font-extrabold text-[#6A1B9A] tabular-nums">
                    +{(selectedTask.payPerWorker * (1 - feeRate)).toFixed(2)} Pi
                  </div>
                </div>
                <div>
                  <div className="text-[11px] text-[#645E72]">Total Budget Locked</div>
                  <div className="text-lg font-extrabold text-[#1A1625] tabular-nums">
                    {selectedTask.totalBudgetLocked.toFixed(2)} Pi
                  </div>
                </div>
                <div className="col-span-2 sm:col-span-1">
                  <div className="text-[11px] text-[#645E72]">Review Guarantee</div>
                  <div className="text-sm font-bold text-emerald-700">
                    {adminSettings.autoApproveHours}h Auto-Approve
                  </div>
                </div>
              </div>

              {paymentError && (
                <div className="rounded-xl bg-rose-50 border border-rose-200 p-3 text-xs font-semibold text-rose-700">
                  {paymentError}
                </div>
              )}

              <button
                type="button"
                disabled={payingTaskId === selectedTask.id}
                onClick={(e) => void handlePayEscrow(e, selectedTask)}
                className="w-full min-h-[46px] rounded-2xl bg-[#FFC107] hover:bg-[#f0b400] disabled:opacity-60 text-[#2B1F00] font-bold text-sm flex items-center justify-center gap-2 transition-colors cursor-pointer"
              >
                <Lock className="w-4 h-4" />
                <span>
                  {payingTaskId === selectedTask.id
                    ? 'Processing Pi Escrow Payment...'
                    : `Pay ${Number(selectedTask.pricePi ?? selectedTask.payPerWorker)} Pi - Escrow`}
                </span>
              </button>

              <div>
                <h3 className="text-sm font-bold text-[#1A1625] mb-2">Step-by-Step Instructions</h3>
                <ol className="space-y-1.5 text-sm text-[#1A1625] list-decimal list-inside">
                  {selectedTask.instructions.map((inst, idx) => (
                    <li key={idx} className="leading-relaxed">
                      {inst}
                    </li>
                  ))}
                </ol>
              </div>

              <div className="rounded-xl bg-[#FFF8E1] border border-[#FFC107]/50 p-3.5">
                <div className="text-xs font-bold text-[#2B1F00]">Accepted Example Output</div>
                <p className="text-xs text-[#2B1F00] mt-1 font-mono">{selectedTask.exampleOutput}</p>
              </div>

              <form onSubmit={handleSubmitWork} className="space-y-4 pt-2 border-t border-[#E7E3EE]">
                <h3 className="text-sm font-bold text-[#1A1625]">Submit Your Work</h3>
                <div>
                  <label className="block text-xs font-semibold text-[#1A1625] mb-1.5">
                    Your Completed Work / Proof Notes
                  </label>
                  <textarea
                    rows={4}
                    value={submissionText}
                    onChange={(e) => setSubmissionText(e.target.value)}
                    placeholder="Paste your translations, labels, QA notes, or store prices here..."
                    className="w-full p-3.5 rounded-xl border border-[#E7E3EE] text-sm focus:outline-none focus:border-[#6A1B9A]"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#1A1625] mb-1.5">
                    Image Proof Upload (Screenshot / Photo)
                  </label>
                  <div className="flex flex-wrap items-center gap-3">
                    <label className="min-h-[44px] px-4 py-2 rounded-xl border border-[#E7E3EE] bg-[#FAF8FC] hover:border-[#6A1B9A] text-xs font-semibold text-[#1A1625] inline-flex items-center gap-2 cursor-pointer">
                      <Upload className="w-4 h-4 text-[#6A1B9A]" />
                      <span>Upload Photo</span>
                      <input type="file" accept="image/*" onChange={handleImageFile} className="hidden" />
                    </label>
                    <button
                      type="button"
                      onClick={() => setSubmissionImage(GENERATED_IMAGES.foodstuff)}
                      className="min-h-[44px] px-4 py-2 rounded-xl border border-[#E7E3EE] text-xs font-semibold text-[#6A1B9A] hover:bg-[#F5EEFA] inline-flex items-center gap-1.5 cursor-pointer"
                    >
                      <ImagePlus className="w-4 h-4" />
                      <span>Attach Sample Proof</span>
                    </button>
                  </div>

                  {submissionImage && (
                    <div className="mt-3 relative w-40 h-28 rounded-xl overflow-hidden border border-[#E7E3EE]">
                      <AfomiImage src={submissionImage} alt="Uploaded proof preview" />
                      <button
                        type="button"
                        onClick={() => setSubmissionImage('')}
                        className="absolute top-1.5 right-1.5 w-6 h-6 rounded-full bg-black/70 text-white flex items-center justify-center cursor-pointer"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}
                </div>

                <button
                  type="submit"
                  className="w-full min-h-[48px] rounded-2xl bg-[#6A1B9A] hover:bg-[#581482] text-white font-bold text-sm flex items-center justify-center gap-2 transition-colors cursor-pointer"
                >
                  <Lock className="w-4 h-4 text-[#FFC107]" />
                  <span>Submit Work &amp; Lock +{(selectedTask.payPerWorker * (1 - feeRate)).toFixed(2)} Pi</span>
                </button>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Report Modal */}
      {reportTarget && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white max-w-md w-full rounded-3xl border border-[#E7E3EE] p-6 space-y-4">
            <h3 className="text-lg font-extrabold text-[#1A1625]">Report Task</h3>
            <p className="text-xs text-[#645E72]">Reporting: {reportTarget.title}</p>
            <textarea
              rows={3}
              value={reportReason}
              onChange={(e) => setReportReason(e.target.value)}
              placeholder="Explain why this task violates AFOMI rules (scam, off-platform payment request, etc.)..."
              className="w-full p-3 rounded-xl border border-[#E7E3EE] text-sm"
            />
            <div className="flex gap-2.5">
              <button
                type="button"
                onClick={() => {
                  reportListing('task', reportTarget.id, reportTarget.title, reportReason);
                  setReportTarget(null);
                }}
                className="flex-1 min-h-[42px] rounded-xl bg-rose-600 text-white text-xs font-bold cursor-pointer"
              >
                Submit Report
              </button>
              <button
                type="button"
                onClick={() => setReportTarget(null)}
                className="min-h-[42px] px-4 rounded-xl border border-[#E7E3EE] text-xs font-semibold cursor-pointer"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export const PostTaskPage: React.FC = () => {
  const {
    user,
    availableBalance,
    feeRate,
    adminSettings,
    paymentPhase,
    piAuthLoading,
    loginWithPi,
    postTaskWithEscrow,
    navigate,
  } = useAfomi();

  const [step, setStep] = useState<'form' | 'escrow-pay' | 'success'>('form');
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<Task['category']>('Translation');
  const [payPerWorker, setPayPerWorker] = useState<number>(2);
  const [totalWorkers, setTotalWorkers] = useState<number>(20);
  const [instructionsText, setInstructionsText] = useState(
    '1. Follow every prompt accurately.\n2. Attach a clear verification photo or screenshot.'
  );
  const [exampleOutput, setExampleOutput] = useState('"Elo ni eleyi?" -> "How much is this?"');
  const [deadline, setDeadline] = useState('2026-12-10');
  const [difficulty, setDifficulty] = useState<Task['difficulty']>('Easy');
  const [estimatedTime, setEstimatedTime] = useState('15 mins');
  const [simulateFailure, setSimulateFailure] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [paying, setPaying] = useState(false);

  const workersBudget = Number((Math.max(0, payPerWorker) * Math.max(1, totalWorkers)).toFixed(2));
  const afomiFee = Number((workersBudget * feeRate).toFixed(2));
  const totalPay = Number((workersBudget + afomiFee).toFixed(2));

  const handleProceedToEscrow = (e: React.FormEvent) => {
    e.preventDefault();
    const err =
      validateRequired(title, 'Task Title') ||
      validatePiAmount(payPerWorker, 'Pay Per Worker') ||
      validateWorkersCount(totalWorkers) ||
      validatePiAmount(totalPay, 'Total Escrow Payment (0.1 Pi to 1000 Pi)');
    if (err) {
      setErrorMsg(err);
      return;
    }
    setErrorMsg('');
    setStep('escrow-pay');
  };

  const handlePayWithPi = async () => {
    if (paying) return;
    setPaying(true);
    setErrorMsg('');
    try {
      const res = await postTaskWithEscrow({
        title: title.trim(),
        category,
        payPerWorker,
        totalWorkers,
        instructions: instructionsText
          .split('\n')
          .map((s) => s.trim())
          .filter(Boolean),
        exampleOutput,
        deadline,
        difficulty,
        estimatedTime,
        simulateFailure,
      });
      if (res.ok) {
        setStep('success');
      } else {
        setErrorMsg(res.message);
      }
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Pi payment failed.');
    } finally {
      setPaying(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => navigate('tasks')}
          className="min-h-[44px] min-w-[44px] rounded-xl border border-[#E7E3EE] bg-white flex items-center justify-center hover:border-[#6A1B9A] cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>
        <div>
          <h1 className="text-2xl font-extrabold text-[#1A1625]">Post a Task (Pi Testnet Escrow)</h1>
          <p className="text-xs text-[#645E72]">
            Payer locks Total Worker Budget + {adminSettings.afomiFeePercent}% AFOMI fee via server-verified Pi Testnet payment.
          </p>
        </div>
      </div>

      {step === 'form' && (
        <form onSubmit={handleProceedToEscrow} className="rounded-3xl bg-white border border-[#E7E3EE] p-6 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-[#1A1625] mb-1.5">Task Title</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Translate 20 Hausa Market Greetings into English"
              className="w-full min-h-[44px] px-3.5 rounded-xl border border-[#E7E3EE] text-sm focus:outline-none focus:border-[#6A1B9A]"
              required
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-[#1A1625] mb-1.5">Category</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as Task['category'])}
                className="w-full min-h-[44px] px-3 rounded-xl border border-[#E7E3EE] text-sm bg-white focus:outline-none focus:border-[#6A1B9A]"
              >
                <option value="Labeling">Labeling</option>
                <option value="Translation">Translation</option>
                <option value="Ranking">Ranking</option>
                <option value="Testing">Testing</option>
                <option value="Survey">Survey</option>
                <option value="Photo Task">Photo Task</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#1A1625] mb-1.5">Pay Per Worker (Pi)</label>
              <input
                type="number"
                step="0.1"
                min="0.1"
                max="1000"
                value={payPerWorker}
                onChange={(e) => setPayPerWorker(Math.max(0, Number(e.target.value)))}
                className="w-full min-h-[44px] px-3.5 rounded-xl border border-[#E7E3EE] text-sm tabular-nums focus:outline-none focus:border-[#6A1B9A]"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#1A1625] mb-1.5">Workers Needed</label>
              <input
                type="number"
                min="1"
                max="500"
                value={totalWorkers}
                onChange={(e) => setTotalWorkers(Math.max(1, Number(e.target.value)))}
                className="w-full min-h-[44px] px-3.5 rounded-xl border border-[#E7E3EE] text-sm tabular-nums focus:outline-none focus:border-[#6A1B9A]"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-[#1A1625] mb-1.5">Difficulty</label>
              <select
                value={difficulty}
                onChange={(e) => setDifficulty(e.target.value as Task['difficulty'])}
                className="w-full min-h-[44px] px-3 rounded-xl border border-[#E7E3EE] text-sm bg-white focus:outline-none focus:border-[#6A1B9A]"
              >
                <option value="Easy">Easy</option>
                <option value="Medium">Medium</option>
                <option value="Advanced">Advanced</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#1A1625] mb-1.5">Est. Time</label>
              <input
                type="text"
                value={estimatedTime}
                onChange={(e) => setEstimatedTime(e.target.value)}
                className="w-full min-h-[44px] px-3.5 rounded-xl border border-[#E7E3EE] text-sm focus:outline-none focus:border-[#6A1B9A]"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#1A1625] mb-1.5">Deadline</label>
              <input
                type="date"
                value={deadline}
                onChange={(e) => setDeadline(e.target.value)}
                className="w-full min-h-[44px] px-3.5 rounded-xl border border-[#E7E3EE] text-sm tabular-nums focus:outline-none focus:border-[#6A1B9A]"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#1A1625] mb-1.5">Instructions</label>
            <textarea
              rows={3}
              value={instructionsText}
              onChange={(e) => setInstructionsText(e.target.value)}
              className="w-full p-3.5 rounded-xl border border-[#E7E3EE] text-sm focus:outline-none focus:border-[#6A1B9A]"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#1A1625] mb-1.5">Example Output</label>
            <input
              type="text"
              value={exampleOutput}
              onChange={(e) => setExampleOutput(e.target.value)}
              className="w-full min-h-[44px] px-3.5 rounded-xl border border-[#E7E3EE] text-sm focus:outline-none focus:border-[#6A1B9A]"
            />
          </div>

          <div className="rounded-2xl bg-[#FAF8FC] border border-[#E7E3EE] p-4 space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-[#645E72]">
                Workers Budget ({payPerWorker} Pi × {totalWorkers})
              </span>
              <span className="font-bold tabular-nums">{workersBudget.toFixed(2)} Pi</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[#645E72]">AFOMI Escrow Fee ({adminSettings.afomiFeePercent}%)</span>
              <span className="font-bold tabular-nums">{afomiFee.toFixed(2)} Pi</span>
            </div>
            <div className="pt-2 border-t border-[#E7E3EE] flex justify-between text-base">
              <span className="font-extrabold text-[#1A1625]">Total to Lock in Escrow</span>
              <span className="font-extrabold text-[#6A1B9A] tabular-nums">{totalPay.toFixed(2)} Pi</span>
            </div>
          </div>

          {errorMsg && (
            <div className="rounded-xl bg-rose-50 border border-rose-200 p-3 text-xs font-semibold text-rose-700">
              {errorMsg}
            </div>
          )}

          <button
            type="submit"
            className="w-full min-h-[48px] rounded-2xl bg-[#6A1B9A] hover:bg-[#581482] text-white font-bold text-sm cursor-pointer"
          >
            Continue to Escrow Payment
          </button>
        </form>
      )}

      {step === 'escrow-pay' && (
        <div className="rounded-3xl bg-white border border-[#E7E3EE] p-6 sm:p-8 space-y-5">
          <div className="flex items-center gap-3">
            <span className="w-11 h-11 rounded-2xl bg-[#F5EEFA] text-[#6A1B9A] flex items-center justify-center">
              <Lock className="w-5 h-5" />
            </span>
            <div>
              <h2 className="text-xl font-extrabold text-[#1A1625]">Confirm Pi Testnet Escrow Deposit</h2>
              <p className="text-xs text-[#645E72]">Available Pi Balance: {availableBalance.toFixed(2)} Pi</p>
            </div>
          </div>

          <div className="rounded-2xl bg-[#FAF8FC] border border-[#E7E3EE] p-5 space-y-3">
            <p className="text-sm font-semibold text-[#1A1625] leading-relaxed">
              You are paying <span className="text-[#6A1B9A] font-extrabold tabular-nums">{totalPay.toFixed(2)} Pi</span>{' '}
              (<span className="tabular-nums">{workersBudget.toFixed(2)} Pi</span> for workers +{' '}
              <span className="tabular-nums">{afomiFee.toFixed(2)} Pi</span> AFOMI fee). This money will be locked in
              Escrow.
            </p>
            <div className="text-xs text-[#645E72] space-y-1 pt-2 border-t border-[#E7E3EE]">
              <div>Task: {title}</div>
              <div>Spots Open Immediately: {totalWorkers}/{totalWorkers}</div>
              <div>Flow: Pi.createPayment → /.netlify/functions/pi-approve → /.netlify/functions/pi-complete</div>
            </div>
          </div>

          {!user?.piAuthenticated && (
            <div className="rounded-2xl bg-amber-50 border border-amber-200 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <p className="text-xs font-bold text-amber-900">
                Please Login with Pi first before submitting an Escrow payment.
              </p>
              <button
                type="button"
                disabled={piAuthLoading}
                onClick={() => void loginWithPi()}
                className="min-h-[40px] px-4 rounded-xl bg-[#6A1B9A] text-white text-xs font-bold whitespace-nowrap cursor-pointer"
              >
                {piAuthLoading ? 'Connecting...' : 'Login with Pi (Testnet)'}
              </button>
            </div>
          )}

          <label className="flex items-center gap-2.5 text-xs text-[#645E72] cursor-pointer">
            <input
              type="checkbox"
              checked={simulateFailure}
              onChange={(e) => setSimulateFailure(e.target.checked)}
              className="rounded border-[#E7E3EE]"
            />
            <span>Test safeguard: Simulate Pi payment failure (verifies task is NOT posted)</span>
          </label>

          {errorMsg && (
            <div className="rounded-xl bg-rose-50 border border-rose-200 p-3.5 text-xs font-semibold text-rose-700">
              {errorMsg}
            </div>
          )}

          <div className="flex flex-col sm:flex-row gap-3">
            <button
              type="button"
              disabled={!user?.piAuthenticated || paying}
              onClick={() => void handlePayWithPi()}
              className="flex-1 min-h-[48px] rounded-2xl bg-[#6A1B9A] hover:bg-[#581482] disabled:bg-slate-200 disabled:text-slate-500 text-white font-bold text-sm flex items-center justify-center gap-2 cursor-pointer"
            >
              {paying ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-[#FFC107]" />
                  <span>
                    {paymentPhase === 'approving'
                      ? 'Server Approving...'
                      : paymentPhase === 'completing'
                      ? 'Verifying on Pi Testnet...'
                      : 'Processing Pi Payment...'}
                  </span>
                </>
              ) : (
                <>
                  <ShieldCheck className="w-4 h-4 text-[#FFC107]" />
                  <span>
                    {user?.piAuthenticated
                      ? 'Pay with Pi — Lock Funds in Escrow & Post Task'
                      : 'Please Login with Pi first'}
                  </span>
                </>
              )}
            </button>
            <button
              type="button"
              disabled={paying}
              onClick={() => setStep('form')}
              className="min-h-[48px] px-5 rounded-2xl border border-[#E7E3EE] text-sm font-semibold text-[#645E72] cursor-pointer"
            >
              Edit Task
            </button>
          </div>
        </div>
      )}

      {step === 'success' && (
        <div className="rounded-3xl bg-white border border-[#E7E3EE] p-8 text-center space-y-4">
          <span className="w-14 h-14 rounded-2xl bg-emerald-50 text-emerald-600 inline-flex items-center justify-center">
            <CheckCircle2 className="w-8 h-8" />
          </span>
          <h2 className="text-2xl font-extrabold text-[#1A1625]">Task Posted. Funds Locked in Escrow.</h2>
          <p className="text-sm text-[#645E72] max-w-md mx-auto">
            Pi Testnet payment verified by backend. Status is now{' '}
            <span className="font-bold text-[#1A1625]">
              OPEN — Spots Left: {totalWorkers}/{totalWorkers}
            </span>
            .
          </p>
          <div className="pt-2 flex flex-wrap justify-center gap-3">
            <button
              type="button"
              onClick={() => navigate('tasks')}
              className="min-h-[44px] px-6 rounded-xl bg-[#6A1B9A] text-white text-sm font-semibold cursor-pointer"
            >
              View Live Tasks
            </button>
            <button
              type="button"
              onClick={() => navigate('escrow')}
              className="min-h-[44px] px-6 rounded-xl border border-[#E7E3EE] text-sm font-semibold text-[#1A1625] cursor-pointer"
            >
              View Escrow Ledger
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
