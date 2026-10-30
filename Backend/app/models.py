from pydantic import BaseModel
from typing import Optional, List


class UserSignup(BaseModel):
    email: str
    password: str
    full_name: str


class UserLogin(BaseModel):
    email: str
    password: str


class ForgotPasswordRequest(BaseModel):
    email: str


class UserResponse(BaseModel):
    id: int
    user_id: str
    email: str
    full_name: Optional[str] = None
    role: Optional[str] = "user"
    created_at: Optional[str] = None


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserResponse


class TransactionCreate(BaseModel):
    date: str
    transaction_type: str  # 'Income' | 'Expense'
    category: str
    amount: float
    payment_mode: Optional[str] = "UPI"
    location: Optional[str] = "Online"
    notes: Optional[str] = ""


class MonthSummaryResponse(BaseModel):
    year: int
    month: int
    income: float
    expenses: float
    balance: float
    savings_rate: float
    transaction_count: int


class GoalCreate(BaseModel):
    name: str
    target_amount: float
    current_saved: Optional[float] = 0.0
    target_date: str  # YYYY-MM-DD
    initial_monthly_target: Optional[float] = None


class GoalUpdate(BaseModel):
    name: Optional[str] = None
    target_amount: Optional[float] = None
    current_saved: Optional[float] = None
    target_date: Optional[str] = None


class GoalResponse(BaseModel):
    goal_id: str
    user_id: str
    name: str
    target_amount: float
    current_saved: float
    remaining_amount: float
    progress_percent: float
    target_date: str
    months_remaining: int
    original_monthly_target: float
    current_required_monthly_saving: float
    actual_monthly_saving: float
    shortfall_or_extra: float
    status: str  # Ahead | On Track | Behind | Completed
    created_at: Optional[str] = None


class BulkTransactionItem(BaseModel):
    date: str
    transaction_type: str  # 'Income' | 'Expense'
    category: Optional[str] = "Other"
    amount: float
    payment_mode: Optional[str] = "Bank"
    location: Optional[str] = "Unknown"
    notes: Optional[str] = ""


class BulkTransactionRequest(BaseModel):
    transactions: List[BulkTransactionItem]


class BulkTransactionResponse(BaseModel):
    status: str
    imported: int
    skipped: int
    failed: int
    errors: List[str] = []


class ChatMessageRequest(BaseModel):
    message: str
    month: Optional[int] = None
    year: Optional[int] = None


class ChatResponse(BaseModel):
    reply: str
    provider: str
    configured: bool
    provider_label: Optional[str] = None
    model: Optional[str] = None
    setup_required: Optional[str] = None
    data_points: Optional[dict] = None


