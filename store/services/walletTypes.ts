// Typed request/response shapes for the Wallet admin endpoints. Money fields are integers
// in minor currency units (paisa) — always divide by 100 for display, never treat as rupees.
// The rest of adminService.ts is intentionally untyped (matches its established convention);
// this file is a scoped deviation for the wallet module given its financial sensitivity.

export type PaginatedResponse<T> = {
  data: T[];
  meta: { total: number; page: number; limit: number; totalPages: number };
};

export type WalletOwner = {
  _id?: string;
  id?: string;
  name?: string;
  email?: string;
  phone?: string;
  userCode?: string;
  image?: string;
  roles?: string[];
  createdAt?: string;
};

export type WalletType = "user" | "merchant";

export type WalletSummary = {
  _id: string;
  walletCode?: string;
  ownerId: string;
  walletType: WalletType;
  availableBalanceMinor: number;
  pendingBalanceMinor: number;
  totalReceivedMinor: number;
  totalWithdrawnMinor: number;
  isFrozen: boolean;
  frozenReason?: string | null;
  frozenAt?: string | null;
  currency: string;
} | null;

export type WalletListRow = WalletOwner & { wallet: WalletSummary };

export type WalletDetailResponse = { owner: WalletOwner; wallet: WalletSummary };

export type WalletLedgerEntryRow = {
  _id: string;
  ledgerCode?: string;
  walletId: string;
  direction: "credit" | "debit";
  balanceType: "available" | "pending";
  amountMinor: number;
  openingBalanceMinor: number;
  closingBalanceMinor: number;
  relatedEntityType: string;
  reason?: string | null;
  createdAt: string;
};

export type WalletDashboardStats = {
  totalWalletBalanceMinor: number;
  userWalletBalanceMinor: number;
  merchantWalletBalanceMinor: number;
  totalMoneyAddedMinor: number;
  totalPaymentsMinor: number;
  totalTransactions: number;
  totalDiscountsMinor: number;
  totalFazlEarningsMinor: number;
  totalWithdrawalsMinor: number;
  pendingWithdrawals: number;
  pendingTransactions: number;
  refundsMinor: number;
};

export type MerchantDeal = {
  _id: string;
  merchantId: string;
  customerDiscountPercent: number;
  fazlMarginPercent: number;
  merchantDealPercent: number;
  effectiveFrom: string;
  effectiveTo: string | null;
  createdBy?: string;
  reason?: string | null;
  createdAt: string;
};

export type MerchantDealResponse = { current: MerchantDeal | null; history: MerchantDeal[] };

type PopulatedRef = { _id: string; name?: string; email?: string; userCode?: string } | string | null;

export type WalletTransactionRow = {
  _id: string;
  transactionCode?: string;
  type: string;
  userId: PopulatedRef;
  merchantId?: PopulatedRef;
  orderId?: string | null;
  originalAmountMinor: number;
  customerDiscountPercent: number;
  customerDiscountAmountMinor: number;
  finalCustomerPaymentMinor: number;
  merchantDealPercent: number;
  fazlMarginPercent: number;
  fazlMarginAmountMinor: number;
  merchantSettlementAmountMinor: number;
  paymentMethod: "fazl_wallet" | "cash";
  senderRefType?: "User" | "Wallet" | null;
  senderRefId?: PopulatedRef;
  receiverRefType?: "User" | "Wallet" | null;
  receiverRefId?: PopulatedRef;
  status: "pending" | "completed" | "failed" | "reversed";
  refundStatus: "none" | "partial" | "full";
  reason?: string | null;
  createdAt: string;
  ledgerEntryIds?: WalletLedgerEntryRow[];
};

export type WithdrawalAccountDetails = {
  accountTitle: string;
  accountNumber: string;
  bankName?: string | null;
  iban?: string | null;
};

export type WithdrawalStatus = "pending" | "approved" | "processing" | "completed" | "rejected" | "cancelled";

export type WithdrawalRow = {
  _id: string;
  withdrawalCode?: string;
  merchantId: PopulatedRef;
  requestedAmountMinor: number;
  availableBalanceSnapshotMinor: number;
  withdrawalMethod: string;
  accountDetails: WithdrawalAccountDetails;
  status: WithdrawalStatus;
  processingDate?: string | null;
  completedDate?: string | null;
  externalFeeAmountMinor?: number | null;
  externalFeeNote?: string | null;
  rejectionReason?: string | null;
  cancellationReason?: string | null;
  createdAt: string;
};

export type RefundStatus = "pending" | "completed" | "rejected";

export type RefundRow = {
  _id: string;
  refundCode?: string;
  originalTransactionId: string;
  customerId: PopulatedRef;
  merchantId?: PopulatedRef;
  refundAmountMinor: number;
  refundReason: string;
  refundStatus: RefundStatus;
  rejectionReason?: string | null;
  createdAt: string;
};

export type WalletAuditLogRow = {
  _id: string;
  logCode?: string;
  action: string;
  targetType: string;
  targetId: string;
  transactionId?: string | null;
  oldValue?: Record<string, unknown> | null;
  newValue?: Record<string, unknown> | null;
  reason?: string | null;
  createdAt: string;
  adminInfo?: { _id: string; name?: string; email?: string };
  subjectInfo?: { _id: string; name?: string; email?: string };
};

export type WalletSettingsData = {
  minTopUpAmountMinor: number;
  maxTopUpAmountMinor: number;
  minWithdrawalAmountMinor: number;
  maxWithdrawalAmountMinor: number;
  dailyTransactionLimitMinor: number;
  walletStatus: boolean;
  withdrawalStatus: boolean;
  updatedBy: string | null;
};

export type ApiEnvelope<T> = { data?: T };
