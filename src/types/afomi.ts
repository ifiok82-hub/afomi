export type AppRoute =
  | 'splash'
  | 'auth'
  | 'kyc'
  | 'home'
  | 'tasks'
  | 'post-task'
  | 'market'
  | 'subscriptions'
  | 'shop'
  | 'escrow'
  | 'learn'
  | 'wallet'
  | 'profile'
  | 'ceo'
  | 'admin'
  | 'admin-dashboard'
  | 'privacy'
  | 'terms'
  | 'help';

export type TaskCategory =
  | 'All'
  | 'Labeling'
  | 'Translation'
  | 'Ranking'
  | 'Testing'
  | 'Survey'
  | 'Photo Task';

export type ProductCategory =
  | 'All'
  | 'Foodstuff'
  | 'Fashion'
  | 'Tutoring'
  | 'Design'
  | 'Services'
  | 'Airtime/Data';

export type EscrowStatus = 'LOCKED' | 'RELEASED' | 'REFUNDED' | 'PENDING REVIEW';

export type OrderStatus =
  | 'ESCROW_LOCKED'
  | 'SHIPPED'
  | 'DELIVERED_RELEASED'
  | 'DISPUTED'
  | 'REFUNDED';

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  role: 'user' | 'ceo';
  avatar: string;
  country: string;
  city: string;
  phone: string;
  skills: string[];
  kycVerified: boolean;
  rating: number;
  joinedDate: string;
  piAuthenticated?: boolean;
  piUid?: string;
  piUsername?: string;
  piWalletAddress?: string;
  suspended?: boolean;
  balancePi?: number;
}

export interface Task {
  id: string;
  title: string;
  category: Exclude<TaskCategory, 'All'>;
  payPerWorker: number;
  totalWorkers: number;
  spotsLeft: number;
  totalBudgetLocked: number;
  afomiFeeLocked: number;
  estimatedTime: string;
  difficulty: 'Easy' | 'Medium' | 'Advanced';
  postedBy: string;
  posterEmail: string;
  deadline: string;
  description: string;
  instructions: string[];
  exampleOutput: string;
  status: 'OPEN' | 'COMPLETED';
  createdAt: string;
  pricePi?: number;
  workerUid?: string;
  piPaymentId?: string;
  piTxId?: string;
}

export interface TaskSubmission {
  id: string;
  taskId: string;
  taskTitle: string;
  category: string;
  workerName: string;
  workerEmail: string;
  payPerWorker: number;
  workerNetPay: number;
  afomiFee: number;
  submissionText: string;
  submissionImage?: string;
  submittedAt: string;
  hoursRemaining48h: number;
  status: 'PENDING REVIEW' | 'APPROVED' | 'REJECTED';
  rejectionReason?: string;
  appealed?: boolean;
  appealNote?: string;
  aiScore: number;
  aiVerdict: 'Good' | 'Flagged';
  aiSuggestion: 'APPROVE' | 'REJECT';
  aiReason: string;
}

export interface Product {
  id: string;
  name: string;
  title?: string;
  category: Exclude<ProductCategory, 'All'>;
  pricePi: number;
  sellerName: string;
  sellerEmail: string;
  sellerUid?: string;
  sellerRating: number;
  location: string;
  stock: number;
  image: string;
  description: string;
  deliveryEstimate: string;
  salesCount: number;
  hidden?: boolean;
}

export interface CartItem {
  product: Product;
  quantity: number;
}

export interface MarketOrder {
  id: string;
  productId: string;
  productName: string;
  productImage: string;
  quantity: number;
  totalPi: number;
  sellerNetPi: number;
  afomiFeePi: number;
  buyerName: string;
  buyerEmail: string;
  sellerName: string;
  status: OrderStatus;
  createdAt: string;
  autoReleaseDaysLeft: number;
  disputeReason?: string;
  piPaymentId?: string;
  piTxId?: string;
}

export interface SubscriptionPlan {
  id: string;
  title: string;
  pricePi: number;
  period: 'week' | 'month' | 'biweekly';
  periodLabel: string;
  providerName: string;
  category: string;
  image: string;
  highlights: string[];
  subscribersCount: number;
}

export interface ActiveSubscription {
  id: string;
  planId: string;
  title: string;
  pricePi: number;
  periodLabel: string;
  providerName: string;
  nextPaymentDate: string;
  escrowStatus: 'LOCKED' | 'RELEASED' | 'REFUNDED';
  status: 'ACTIVE' | 'CANCELLED';
  approvedAt: string;
  piPaymentId?: string;
}

export interface CourseLesson {
  id: string;
  title: string;
  duration: string;
  videoSummary: string;
  content: string;
}

export interface CourseQuizQuestion {
  id: string;
  question: string;
  options: string[];
  correctIndex: number;
}

export interface Course {
  id: string;
  title: string;
  subtitle: string;
  duration: string;
  level: string;
  lessons: CourseLesson[];
  quiz: CourseQuizQuestion[];
}

export interface EscrowTransaction {
  id: string;
  date: string;
  title: string;
  type: 'Task Escrow' | 'Marketplace Order' | 'Subscription' | 'Task Payout';
  grossAmountPi: number;
  afomiFeePi: number;
  netAmountPi: number;
  status: EscrowStatus;
  counterparty: string;
  notes: string;
  piPaymentId?: string;
}

export interface WalletTransaction {
  id: string;
  date: string;
  label: string;
  amountPi: number;
  direction: 'credit' | 'debit';
  status: 'Completed' | 'Pending' | 'Failed' | 'Locked in Escrow';
}

export interface NotificationItem {
  id: string;
  title: string;
  message: string;
  time: string;
  read: boolean;
  type: 'release' | 'lock' | 'approval' | 'ceo';
}

export interface ShopProfile {
  name: string;
  description: string;
  location: string;
  logo: string;
  created: boolean;
}

export interface SupportTicket {
  id: string;
  userName: string;
  userEmail: string;
  subject: string;
  message: string;
  receivedAt: string;
  aiDraftReply: string;
  status: 'OPEN' | 'REPLIED';
  sentReply?: string;
}

export interface CeoChatMessage {
  id: string;
  sender: 'ceo' | 'ai';
  text: string;
  timestamp: string;
}

export interface AdminSettings {
  afomiFeePercent: number;
  autoApproveHours: number;
  appName: string;
  logoUrl: string;
  maintenanceMode: boolean;
  demoMode: boolean;
}

export interface AuditLogEntry {
  id: string;
  date: string;
  adminName: string;
  action: string;
}

export interface ListingReport {
  id: string;
  targetType: 'task' | 'product';
  targetId: string;
  targetTitle: string;
  reason: string;
  reportedBy: string;
  createdAt: string;
}
