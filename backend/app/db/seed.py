"""Seed a cafe menu + 3 users + 8 tables. Re-runnable: idempotent on PIN."""
from __future__ import annotations
from app.db.session import Base, current_engine, SessionLocal
from app.modules.users.models import User
from app.modules.roles.models import Role
from app.modules.menu.models import Category, Product, ModifierGroup, ModifierOption
from app.modules.tables.models import Table
from app.core.security import hash_pin
from app.core.permissions import default_permissions
from sqlalchemy import text


SEED_ROLES = [
    # name, label, color, sort
    ("superuser", "Superuser", "#111827", 0),
    ("admin", "Admin", "#6b46d3", 1),
    ("master", "Master", "#d63031", 2),
    ("cashier", "Cashier", "#2b6cff", 3),
    ("waiter", "Waiter", "#0c8a7a", 4),
    ("kitchen", "Kitchen", "#e07b1a", 5),
    ("bar", "Bar", "#0e9ec7", 6),
]

SEED_USERS = [
    ("Superuser", "8888", "superuser"),
    ("Admin", "9999", "admin"),
    ("Cashier", "1111", "cashier"),
    ("Waiter", "2222", "waiter"),
    ("Kitchen", "3333", "kitchen"),
]


SEED_CATEGORIES = [
    # name, icon, color, sort, kind
    ("Coffee", "local_cafe", "#FFB000", 0, "bar"),       # Amber
    ("Tea", "emoji_food_beverage", "#00FF85", 1, "bar"),  # Neon Green
    ("Pastries", "bakery_dining", "#FF6600", 2, "kitchen"), # Orange
    ("Sandwiches", "lunch_dining", "#0066FF", 3, "kitchen"), # Neon Blue
    ("Cold Drinks", "local_bar", "#00F0FF", 4, "bar"),    # Cyan
    ("Desserts", "icecream", "#FF00A8", 5, "kitchen"),    # Hot Pink
    # M23 — Combo category shows up on BOTH kitchen and bar displays so
    # a single order can have items only the kitchen sees (food), items
    # only the bar sees (drinks), and items both stations must work on
    # together (a combo plate). Real cafés use this for "burger + drink"
    # combos where both prep lines need to coordinate.
    ("Combos", "restaurant_menu", "#B000FF", 6, "both"),  # Purple
]


SEED_PRODUCTS = [
    # (cat_name, name, price, desc, mods)
    ("Coffee", "Espresso", 2.50, "Single shot", [("Shot", True, [("Single", 0), ("Double", 0.50)]), ("Milk", False, [("Regular", 0), ("Oat", 0.70), ("Almond", 0.70)])]),
    ("Coffee", "Cappuccino", 3.50, "Espresso + steamed milk", [("Milk", False, [("Regular", 0), ("Oat", 0.70)])]),
    ("Coffee", "Latte", 3.75, "Smooth & milky", [("Milk", False, [("Regular", 0), ("Oat", 0.70)])]),
    ("Coffee", "Americano", 3.00, "Espresso + hot water", []),
    ("Coffee", "Mocha", 4.25, "Chocolate + espresso", [("Milk", False, [("Regular", 0), ("Oat", 0.70)])]),
    ("Tea", "English Breakfast", 2.75, "Bold black tea", []),
    ("Tea", "Earl Grey", 2.75, "Bergamot black tea", []),
    ("Tea", "Green Tea", 2.75, "Light & grassy", []),
    ("Tea", "Chai Latte", 4.00, "Spiced & steamed", [("Milk", False, [("Regular", 0), ("Oat", 0.70)])]),
    ("Tea", "Matcha Latte", 4.50, "Ceremonial-grade matcha", [("Milk", False, [("Regular", 0), ("Oat", 0.70)])]),
    ("Pastries", "Croissant", 3.00, "Butter, flaky", []),
    ("Pastries", "Pain au Chocolat", 3.50, "Chocolate-filled", []),
    ("Pastries", "Blueberry Muffin", 3.25, "Bursting with berries", []),
    ("Pastries", "Cinnamon Roll", 3.75, "With cream cheese glaze", []),
    ("Sandwiches", "Ham & Cheese", 6.50, "On sourdough", [("Bread", True, [("Sourdough", 0), ("Whole Wheat", 0), ("Gluten Free", 1.00)])]),
    ("Sandwiches", "Caprese", 7.00, "Mozzarella, tomato, basil", [("Bread", True, [("Sourdough", 0), ("Whole Wheat", 0)])]),
    ("Sandwiches", "Avocado Toast", 6.75, "Sourdough + smashed avo", [("Extras", False, [("Egg", 1.50), ("Feta", 1.00), ("Chili", 0.00)])]),
    ("Sandwiches", "BLT", 6.95, "Bacon, lettuce, tomato", [("Bread", True, [("Sourdough", 0), ("Whole Wheat", 0)])]),
    ("Cold Drinks", "Iced Coffee", 3.75, "Cold-brewed", [("Milk", False, [("Regular", 0), ("Oat", 0.70)])]),
    ("Cold Drinks", "Lemonade", 3.25, "Fresh-squeezed", []),
    ("Cold Drinks", "Iced Tea", 3.25, "Peach", []),
    ("Cold Drinks", "Sparkling Water", 2.50, "500ml", []),
    ("Desserts", "Chocolate Cake", 5.50, "Triple-layer", []),
    ("Desserts", "Cheesecake", 5.75, "New York style", []),
    ("Desserts", "Tiramisu", 5.95, "Classic Italian", []),
    ("Desserts", "Cookie", 2.25, "Chocolate chip", []),
    # M23 — combo item routed to BOTH stations (kitchen makes the food,
    # bar pours the drink). The same logical line shows up on both
    # displays so the kitchen and bar prep in parallel.
    ("Combos", "Burger + Coffee Combo", 11.50, "Beef burger + single espresso", []),
    ("Combos", "Sandwich + Latte Combo", 10.75, "Ham & cheese + latte", []),
]


# M28 — tables seeded with explicit section/sort so the Overview screen
# demonstrates grouping on first boot. Layout: T1–T4 Main Hall, T5–T6
# Patio, T7 Bar, T8 Private. Admin can re-assign any table via the UI.
SEED_TABLES = [
    ("T1", 4, "Main Hall", 0),
    ("T2", 4, "Main Hall", 1),
    ("T3", 4, "Main Hall", 2),
    ("T4", 4, "Main Hall", 3),
    ("T5", 4, "Patio",     0),
    ("T6", 4, "Patio",     1),
    ("T7", 2, "Bar",       0),
    ("T8", 8, "Private",   0),
]


def run():
    Base.metadata.create_all(bind=current_engine())
    db = SessionLocal()
    try:
        try:
            db.execute(text("ALTER TABLE roles ADD COLUMN permissions JSON"))
            db.commit()
        except Exception:
            db.rollback()

        # Roles
        for name, label, color, sort in SEED_ROLES:
            existing = db.query(Role).filter(Role.name == name).first()
            perms = default_permissions(name)
            if existing:
                existing.label = label
                existing.color = color
                existing.sort = sort
                if not existing.permissions:
                    existing.permissions = perms
            else:
                db.add(Role(name=name, label=label, color=color, sort=sort, permissions=perms))

        # Users
        for name, pin, role in SEED_USERS:
            existing = db.query(User).filter(User.name == name).first()
            if existing:
                existing.pin = hash_pin(pin)
                existing.role = role
                existing.active = True
                if role == "superuser":
                    existing.permissions = default_permissions(role)
            else:
                db.add(User(
                    name=name,
                    pin=hash_pin(pin),
                    role=role,
                    permissions=default_permissions(role),
                    active=True,
                ))

        # Categories
        cat_index: dict[str, Category] = {}
        for name, icon, color, sort, kind in SEED_CATEGORIES:
            c = db.query(Category).filter(Category.name == name).first()
            if not c:
                c = Category(name=name, icon=icon, color=color, sort=sort, kind=kind)
                db.add(c)
                db.flush()
            else:
                if c.kind != kind:
                    c.kind = kind
                if c.color != color:
                    c.color = color
            cat_index[name] = c

        # Products + modifier groups
        for cat_name, pname, price, desc, mods in SEED_PRODUCTS:
            p = db.query(Product).filter(Product.name == pname, Product.category_id == cat_index[cat_name].id).first()
            if not p:
                p = Product(name=pname, price=price, description=desc, category_id=cat_index[cat_name].id)
                db.add(p)
                db.flush()
            for mname, required, options in mods:
                mg = db.query(ModifierGroup).filter(ModifierGroup.product_id == p.id, ModifierGroup.name == mname).first()
                if not mg:
                    mg = ModifierGroup(name=mname, required=required, multi=not required, product_id=p.id)
                    db.add(mg)
                    db.flush()
                for oname, delta in options:
                    if not db.query(ModifierOption).filter(ModifierOption.group_id == mg.id, ModifierOption.name == oname).first():
                        db.add(ModifierOption(name=oname, price_delta=delta, group_id=mg.id))

        # Tables
        for entry in SEED_TABLES:
            # SEED_TABLES entries are (name, seats) or (name, seats, section, sort).
            if len(entry) == 4:
                tname = entry[0]
                seats = entry[1]
                section = entry[2]
                sort = entry[3]
            else:
                tname = entry[0]
                seats = entry[1]
                section = "Main Hall"
                sort = 0
            existing = db.query(Table).filter(Table.name == tname).first()
            if not existing:
                db.add(Table(name=tname, seats=seats, section=section, sort=sort))
            else:
                # Backfill section/sort on legacy rows so a fresh-seed
                # over an existing DB still produces a sensible Overview.
                existing.section = section
                existing.sort = sort

        db.commit()
        print(f"Seeded: {len(SEED_USERS)} users, {len(SEED_CATEGORIES)} categories, "
              f"{len(SEED_PRODUCTS)} products, {len(SEED_TABLES)} tables.")
        print("Login PINs: superuser=8888, admin=9999, cashier=1111, waiter=2222, kitchen=3333")
    finally:
        db.close()


if __name__ == "__main__":
    run()
