"""Menu module — categories, products, modifiers, tables."""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.schemas import CategoryOut, ProductWithMods, ModGroupOut, ModOptionOut, MenuOut, TableOut
from app.services import get_menu, get_tables_with_orders

router = APIRouter(prefix="/api", tags=["menu"])


@router.get("/menu", response_model=MenuOut)
def menu(db: Session = Depends(get_db)):
    data = get_menu(db)
    return MenuOut(
        categories=[CategoryOut.model_validate(c) for c in data["categories"]],
        products=[
            ProductWithMods(
                id=p.id, name=p.name, description=p.description, price=p.price,
                category_id=p.category_id, image=p.image, active=p.active,
                modifier_groups=[
                    ModGroupOut(
                        id=g.id, name=g.name, required=g.required, multi=g.multi,
                        options=[ModOptionOut.model_validate(o) for o in g.options],
                    ) for g in p.modifier_groups
                ],
            ) for p in data["products"]
        ],
    )


@router.get("/tables")
def tables(db: Session = Depends(get_db)):
    """Return all tables with their active order data."""
    return get_tables_with_orders(db)


@router.get("/tables/with-orders")
def tables_with_orders(db: Session = Depends(get_db)):
    """Return all tables with their active order data (explicit endpoint)."""
    return get_tables_with_orders(db)


@router.get("/table-sections")
def table_sections(db: Session = Depends(get_db)):
    """Return the configured table-section list (M28)."""
    from app.core.config import get_table_sections
    return {"sections": get_table_sections()}
