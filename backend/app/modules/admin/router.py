"""Admin module — users, roles, categories, products, tables CRUD + reports."""
from datetime import datetime, timedelta
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import func

from app.db.session import get_db
from app.schemas import (
    CategoryOut, ProductOut, TableOut, UserOut,
    CategoryIn, CategoryUpdateIn,
    ProductIn, ProductUpdateIn,
    TableIn, TableUpdateIn,
    UserIn, UserUpdateIn,
    RoleOut, RoleIn, RoleUpdateIn,
)
from app.models import User as UserModel, Order, OrderItem, Payment, Category, Product, Role
from sqlalchemy import select
from app.core.security import require_role, require_permission
from app.services import crud
from app.ws import manager

router = APIRouter(prefix="/api/admin", tags=["admin"])


# ---------- Roles ----------

@router.get("/roles", response_model=list[RoleOut])
def list_roles_endpoint(db: Session = Depends(get_db), user: UserModel = Depends(require_role("admin"))):
    return [RoleOut.model_validate(r) for r in crud.list_roles(db)]


@router.post("/roles", response_model=RoleOut)
def create_role_endpoint(payload: RoleIn, db: Session = Depends(get_db), user: UserModel = Depends(require_role("admin"))):
    existing = db.scalar(select(Role).where(Role.name == payload.name))
    if existing:
        raise HTTPException(400, f"Role '{payload.name}' already exists")
    role = crud.create_role(db, name=payload.name, label=payload.label, color=payload.color, sort=payload.sort)
    return RoleOut.model_validate(role)


@router.patch("/roles/{rid}", response_model=RoleOut)
def update_role_endpoint(rid: int, payload: RoleUpdateIn, db: Session = Depends(get_db), user: UserModel = Depends(require_role("admin"))):
    role = crud.update_role(db, rid, name=payload.name, label=payload.label, color=payload.color, sort=payload.sort)
    if not role:
        raise HTTPException(404, "Role not found")
    return RoleOut.model_validate(role)


@router.delete("/roles/{rid}")
def delete_role_endpoint(rid: int, db: Session = Depends(get_db), user: UserModel = Depends(require_role("admin"))):
    try:
        ok = crud.delete_role(db, rid)
    except ValueError as e:
        raise HTTPException(400, str(e))
    if not ok:
        raise HTTPException(404, "Role not found")
    return {"deleted": rid}


# ---------- Categories ----------

@router.get("/categories", response_model=list[CategoryOut])
def list_categories_endpoint(db: Session = Depends(get_db), user: UserModel = Depends(require_role("admin"))):
    return [CategoryOut.model_validate(c) for c in crud.list_categories(db)]


@router.post("/categories", response_model=CategoryOut)
def create_category_endpoint(payload: CategoryIn, db: Session = Depends(get_db), user: UserModel = Depends(require_role("admin"))):
    cat = crud.create_category(db, name=payload.name, color=payload.color, icon=payload.icon, sort=payload.sort, kind=payload.kind)
    return CategoryOut.model_validate(cat)


@router.patch("/categories/{cid}", response_model=CategoryOut)
def update_category_endpoint(cid: int, payload: CategoryUpdateIn, db: Session = Depends(get_db), user: UserModel = Depends(require_role("admin"))):
    cat = crud.update_category(db, cid, name=payload.name, color=payload.color, icon=payload.icon, sort=payload.sort, kind=payload.kind)
    if not cat:
        raise HTTPException(404, "Category not found")
    return CategoryOut.model_validate(cat)


@router.delete("/categories/{cid}")
def delete_category_endpoint(cid: int, db: Session = Depends(get_db), user: UserModel = Depends(require_role("admin"))):
    try:
        ok = crud.delete_category(db, cid)
    except ValueError as e:
        raise HTTPException(400, str(e))
    if not ok:
        raise HTTPException(404, "Category not found")
    return {"deleted": cid}


# ---------- Products ----------

@router.get("/products", response_model=list[ProductOut])
def list_products_endpoint(db: Session = Depends(get_db), user: UserModel = Depends(require_role("admin"))):
    return [ProductOut.model_validate(p) for p in crud.list_products(db)]


@router.post("/products", response_model=ProductOut)
def create_product_endpoint(payload: ProductIn, db: Session = Depends(get_db), user: UserModel = Depends(require_role("admin"))):
    p = crud.create_product(db, name=payload.name, description=payload.description, price=payload.price, category_id=payload.category_id, image=payload.image, active=payload.active, sort=payload.sort, cost=payload.cost, kind=payload.kind)
    return ProductOut.model_validate(p)


@router.patch("/products/{pid}", response_model=ProductOut)
def update_product_endpoint(pid: int, payload: ProductUpdateIn, db: Session = Depends(get_db), user: UserModel = Depends(require_role("admin"))):
    p = crud.update_product(db, pid, name=payload.name, description=payload.description, price=payload.price, category_id=payload.category_id, image=payload.image, active=payload.active, sort=payload.sort, cost=payload.cost, kind=payload.kind)
    if not p:
        raise HTTPException(404, "Product not found")
    return ProductOut.model_validate(p)


@router.delete("/products/{pid}")
def delete_product_endpoint(pid: int, db: Session = Depends(get_db), user: UserModel = Depends(require_role("admin"))):
    ok = crud.delete_product(db, pid)
    if not ok:
        raise HTTPException(404, "Product not found")
    return {"deleted": pid}


# ---------- Tables ----------

@router.get("/tables", response_model=list[TableOut])
def list_tables_endpoint(db: Session = Depends(get_db), user: UserModel = Depends(require_role("admin"))):
    return [TableOut.model_validate(t) for t in crud.list_tables(db, include_inactive=True)]


@router.post("/tables", response_model=TableOut)
async def create_table_endpoint(payload: TableIn, db: Session = Depends(get_db), user: UserModel = Depends(require_role("admin"))):
    t = crud.create_table(db, name=payload.name, seats=payload.seats, active=payload.active, section=payload.section, sort=payload.sort)
    out = TableOut.model_validate(t)
    await manager.broadcast("table_created", out.model_dump())
    return out


@router.patch("/tables/{tid}", response_model=TableOut)
async def update_table_endpoint(tid: int, payload: TableUpdateIn, db: Session = Depends(get_db), user: UserModel = Depends(require_role("admin"))):
    t = crud.update_table(db, tid, name=payload.name, seats=payload.seats, active=payload.active, section=payload.section, sort=payload.sort)
    if not t:
        raise HTTPException(404, "Table not found")
    out = TableOut.model_validate(t)
    await manager.broadcast("table_updated", out.model_dump())
    return out


@router.delete("/tables/{tid}")
async def delete_table_endpoint(tid: int, db: Session = Depends(get_db), user: UserModel = Depends(require_role("admin"))):
    ok = crud.delete_table(db, tid)
    if not ok:
        raise HTTPException(404, "Table not found")
    await manager.broadcast("table_deleted", {"id": tid})
    return {"deleted": tid}


# ---------- Table Sections (M28) ----------

@router.get("/table-sections")
def get_table_sections_endpoint(db: Session = Depends(get_db), user: UserModel = Depends(require_role("admin"))):
    from app.core.config import get_table_sections
    return {"sections": get_table_sections()}


@router.put("/table-sections")
def put_table_sections_endpoint(payload: dict, db: Session = Depends(get_db), user: UserModel = Depends(require_role("admin"))):
    """Replace the table sections list. Body: `{"sections": [{"name", "color"}, ...]}`."""
    from app.core.config import set_table_sections
    sections = payload.get("sections") if isinstance(payload, dict) else None
    return {"sections": set_table_sections(sections or [])}


# ---------- Users ----------

@router.get("/users", response_model=list[UserOut])
def list_users_endpoint(db: Session = Depends(get_db), user: UserModel = Depends(require_role("admin"))):
    return [UserOut.model_validate(u) for u in crud.list_users(db)]


@router.post("/users", response_model=UserOut)
def create_user_endpoint(payload: UserIn, db: Session = Depends(get_db), user: UserModel = Depends(require_role("admin"))):
    u = crud.create_user(db, name=payload.name, pin=payload.pin, role=payload.role, permissions=payload.permissions, active=payload.active)
    return UserOut.model_validate(u)


@router.patch("/users/{uid}", response_model=UserOut)
def update_user_endpoint(uid: int, payload: UserUpdateIn, db: Session = Depends(get_db), user: UserModel = Depends(require_role("admin"))):
    u = crud.update_user(db, uid, name=payload.name, pin=payload.pin, role=payload.role, permissions=payload.permissions, active=payload.active)
    if not u:
        raise HTTPException(404, "User not found")
    return UserOut.model_validate(u)


@router.delete("/users/{uid}")
def delete_user_endpoint(uid: int, db: Session = Depends(get_db), user: UserModel = Depends(require_role("admin"))):
    ok = crud.delete_user(db, uid)
    if not ok:
        raise HTTPException(404, "User not found")
    return {"deleted": uid}


# ---------- Reports ----------

from pydantic import BaseModel


class SalesSummary(BaseModel):
    period: str
    total_revenue: float
    total_orders: int
    total_items_sold: int
    avg_order_value: float
    cogs: float
    profit: float


class CategorySales(BaseModel):
    category_id: int
    category_name: str
    category_color: str
    revenue: float
    order_count: int
    item_count: int


class ItemSales(BaseModel):
    product_id: int
    product_name: str
    category_name: str
    category_color: str
    quantity: int
    revenue: float


class PaymentMethodSummary(BaseModel):
    method: str
    amount: float
    count: int
    percentage: float


class BillHistoryItem(BaseModel):
    order_id: int
    order_number: int
    table_name: str | None
    customer_name: str
    status: str
    subtotal: float
    discount: float = 0.0
    discount_reason: str = ""
    tax: float
    total: float
    payment_method: str | None
    created_at: datetime
    items: list[dict]


def _parse_date(date_str: str | None) -> datetime:
    if date_str:
        try:
            return datetime.strptime(date_str, "%Y-%m-%d")
        except ValueError:
            pass
    return datetime.utcnow().replace(hour=0, minute=0, second=0, microsecond=0)


def _get_date_range(period: str, start_date: datetime | None = None, end_date: datetime | None = None) -> tuple[datetime, datetime | None]:
    now = datetime.utcnow()
    if period == "custom" and start_date and end_date:
        return start_date, end_date
    if period == "all":
        return datetime(2000, 1, 1), None
    if start_date:
        now = start_date
    if period == "day":
        start = now.replace(hour=0, minute=0, second=0, microsecond=0)
        end = start + timedelta(days=1)
    elif period == "week":
        start = now.replace(hour=0, minute=0, second=0, microsecond=0)
        start -= timedelta(days=start.weekday())
        end = start + timedelta(days=7)
    elif period == "month":
        start = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
        if start.month == 12:
            end = start.replace(year=start.year + 1, month=1)
        else:
            end = start.replace(month=start.month + 1)
    else:
        raise HTTPException(400, "Invalid period: must be day, week, month, all, or custom")
    return start, end


@router.get("/reports/sales-summary", response_model=SalesSummary)
def get_sales_summary(
    period: str = Query("day"),
    start_date: Optional[str] = Query(None),
    end_date: Optional[str] = Query(None),
    db: Session = Depends(get_db),
    user: UserModel = Depends(require_permission("admin.reports")),
):
    start = _parse_date(start_date if start_date else None)
    end_dt = _parse_date(end_date if end_date else None) if end_date else None
    if end_dt:
        end_dt = end_dt + timedelta(days=1)
    start, end = _get_date_range(period, start, end_dt)
    query = db.query(Order).filter(Order.status == "paid", Order.created_at >= start)
    if end:
        query = query.filter(Order.created_at < end)
    orders = query.all()
    total_revenue = sum(o.total for o in orders)
    total_orders = len(orders)
    avg_order_value = total_revenue / total_orders if total_orders > 0 else 0
    items_q = db.query(func.coalesce(func.sum(OrderItem.qty), 0)).join(Order, Order.id == OrderItem.order_id).filter(Order.status == "paid", OrderItem.status != "cancelled", Order.created_at >= start)
    if end:
        items_q = items_q.filter(Order.created_at < end)
    total_items_sold = int(items_q.scalar() or 0)
    cogs_q = db.query(func.coalesce(func.sum(OrderItem.qty * Product.cost), 0.0)).join(Product, Product.id == OrderItem.product_id).join(Order, Order.id == OrderItem.order_id).filter(Order.status == "paid", OrderItem.status != "cancelled", Order.created_at >= start)
    if end:
        cogs_q = cogs_q.filter(Order.created_at < end)
    cogs = float(cogs_q.scalar() or 0.0)
    profit = total_revenue - cogs
    return SalesSummary(period=period, total_revenue=round(total_revenue, 2), total_orders=total_orders, total_items_sold=total_items_sold, avg_order_value=round(avg_order_value, 2), cogs=round(cogs, 2), profit=round(profit, 2))


@router.get("/reports/sales-by-category", response_model=list[CategorySales])
def get_sales_by_category(
    period: str = Query("day"),
    start_date: Optional[str] = Query(None),
    end_date: Optional[str] = Query(None),
    db: Session = Depends(get_db),
    user: UserModel = Depends(require_permission("admin.reports")),
):
    start = _parse_date(start_date if start_date else None)
    end_dt = _parse_date(end_date if end_date else None) if end_date else None
    if end_dt:
        end_dt = end_dt + timedelta(days=1)
    start, end = _get_date_range(period, start, end_dt)
    query = db.query(Category.id.label("category_id"), Category.name.label("category_name"), Category.color.label("category_color"), func.coalesce(func.sum(OrderItem.price * OrderItem.qty), 0).label("revenue"), func.count(func.distinct(Order.id)).label("order_count"), func.coalesce(func.sum(OrderItem.qty), 0).label("item_count")).join(Product, Product.id == OrderItem.product_id).join(Category, Category.id == Product.category_id).join(Order, Order.id == OrderItem.order_id).filter(Order.status == "paid", Order.created_at >= start)
    if end:
        query = query.filter(Order.created_at < end)
    results = query.group_by(Category.id, Category.name, Category.color).all()
    sales_by_cat = {r.category_id: {"revenue": float(r.revenue or 0), "order_count": int(r.order_count or 0), "item_count": int(r.item_count or 0)} for r in results}
    all_categories = db.query(Category).all()
    out = []
    for c in all_categories:
        s = sales_by_cat.get(c.id, {"revenue": 0.0, "order_count": 0, "item_count": 0})
        out.append(CategorySales(category_id=c.id, category_name=c.name, category_color=c.color, revenue=round(s["revenue"], 2), order_count=s["order_count"], item_count=s["item_count"]))
    out.sort(key=lambda x: x.revenue, reverse=True)
    return out


@router.get("/reports/item-sales", response_model=list[ItemSales])
def get_item_sales(
    period: str = Query("day"),
    start_date: Optional[str] = Query(None),
    end_date: Optional[str] = Query(None),
    limit: int = Query(100),
    db: Session = Depends(get_db),
    user: UserModel = Depends(require_permission("admin.reports")),
):
    start = _parse_date(start_date if start_date else None)
    end_dt = _parse_date(end_date if end_date else None) if end_date else None
    if end_dt:
        end_dt = end_dt + timedelta(days=1)
    start, end = _get_date_range(period, start, end_dt)
    all_products = db.query(Product).join(Category).filter(Product.active == True).all()  # noqa: E712
    sales_query = db.query(Product.id.label("product_id"), func.coalesce(func.sum(OrderItem.qty), 0).label("quantity"), func.coalesce(func.sum(OrderItem.price * OrderItem.qty), 0).label("revenue")).join(OrderItem, OrderItem.product_id == Product.id).join(Order, Order.id == OrderItem.order_id).filter(Order.status == "paid", OrderItem.status != "cancelled", Order.created_at >= start)
    if end:
        sales_query = sales_query.filter(Order.created_at < end)
    sales_data = sales_query.group_by(Product.id).all()
    sales_lookup = {r.product_id: {"quantity": int(r.quantity or 0), "revenue": float(r.revenue or 0)} for r in sales_data}
    result = []
    for p in all_products:
        sales = sales_lookup.get(p.id, {"quantity": 0, "revenue": 0.0})
        result.append(ItemSales(product_id=p.id, product_name=p.name, category_name=p.category.name if p.category else "Unknown", category_color=p.category.color if p.category else "#888888", quantity=sales["quantity"], revenue=round(sales["revenue"], 2)))
    result.sort(key=lambda x: x.quantity, reverse=True)
    return result[:limit]


@router.get("/reports/payment-methods", response_model=list[PaymentMethodSummary])
def get_payment_methods(
    period: str = Query("day"),
    start_date: Optional[str] = Query(None),
    end_date: Optional[str] = Query(None),
    db: Session = Depends(get_db),
    user: UserModel = Depends(require_permission("admin.reports")),
):
    start = _parse_date(start_date if start_date else None)
    end_dt = _parse_date(end_date if end_date else None) if end_date else None
    if end_dt:
        end_dt = end_dt + timedelta(days=1)
    start, end = _get_date_range(period, start, end_dt)
    query = db.query(Payment.method, func.coalesce(func.sum(Payment.amount), 0).label("amount"), func.count(Payment.id).label("count")).join(Order, Order.id == Payment.order_id).filter(Order.status == "paid", Payment.created_at >= start)
    if end:
        query = query.filter(Payment.created_at < end)
    results = query.group_by(Payment.method).all()
    total_amount = sum(float(r.amount or 0) for r in results)
    methods = {getattr(r, "method", None) or "unknown": r for r in results}
    canonical = ["cash", "card", "mobile"]
    summary: list[PaymentMethodSummary] = []
    for m in canonical:
        r = methods.get(m)
        amount = float(getattr(r, "amount", 0)) if r else 0.0
        cnt = int(getattr(r, "count", 0)) if r else 0
        summary.append(PaymentMethodSummary(method=m, amount=round(amount, 2), count=cnt, percentage=round((amount / total_amount * 100) if total_amount > 0 else 0, 1)))
    for m, r in methods.items():
        if m in canonical:
            continue
        amount = float(getattr(r, "amount", 0))
        cnt = int(getattr(r, "count", 0))
        summary.append(PaymentMethodSummary(method=m, amount=round(amount, 2), count=cnt, percentage=round((amount / total_amount * 100) if total_amount > 0 else 0, 1)))
    summary.sort(key=lambda x: x.amount, reverse=True)
    return summary


@router.get("/reports/bill-history", response_model=list[BillHistoryItem])
def get_bill_history(
    period: str = Query("day"),
    start_date: Optional[str] = Query(None),
    end_date: Optional[str] = Query(None),
    status: Optional[str] = Query(None),
    limit: int = Query(500),
    db: Session = Depends(get_db),
    user: UserModel = Depends(require_permission("admin.reports")),
):
    start = _parse_date(start_date if start_date else None)
    end_dt = _parse_date(end_date if end_date else None) if end_date else None
    if end_dt:
        end_dt = end_dt + timedelta(days=1)
    start, end = _get_date_range(period, start, end_dt)
    query = db.query(Order).filter(Order.created_at >= start)
    if end:
        query = query.filter(Order.created_at < end)
    if status and status != "all":
        query = query.filter(Order.status == status)
    else:
        if not (status == "all"):
            query = query.filter(Order.status.in_(("paid", "void")))
    orders = query.order_by(Order.created_at.desc()).limit(limit).all()
    result = []
    for order in orders:
        payment_method = None
        if order.payments:
            payment_method = order.payments[0].method
        items = []
        for item in order.items:
            items.append({"id": item.id, "name": item.name, "price": item.price, "qty": item.qty, "subtotal": item.price * item.qty})
        result.append(BillHistoryItem(order_id=order.id, order_number=order.number, table_name=order.table.name if order.table else None, customer_name=order.customer_name, status=order.status, subtotal=order.subtotal, discount=order.discount, discount_reason=order.discount_reason, tax=order.tax, total=order.total, payment_method=payment_method, created_at=order.created_at, items=items))
    return result
