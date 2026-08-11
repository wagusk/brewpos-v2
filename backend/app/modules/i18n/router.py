"""i18n module — translations API."""
from fastapi import APIRouter

router = APIRouter(prefix="/api/i18n", tags=["i18n"])

TRANSLATIONS = {
    "en": {
        "shell.title": "Brew-POS v2",
        "shell.logout": "Logout",
        "login.title": "Login",
        "login.pin": "PIN",
        "login.login": "Login",
        "login.error": "Wrong PIN",
        "common.cancel": "Cancel",
        "common.confirm": "Confirm",
        "common.save": "Save",
        "common.delete": "Delete",
        "common.edit": "Edit",
        "common.add": "Add",
        "cashier.title": "Cashier",
        "waiter.title": "Waiter",
        "kitchen.title": "Kitchen",
        "bar.title": "Bar",
        "admin.title": "Admin",
        "settings.title": "Settings",
    },
    "id": {
        "shell.title": "Brew-POS v2",
        "shell.logout": "Keluar",
        "login.title": "Masuk",
        "login.pin": "PIN",
        "login.login": "Masuk",
        "login.error": "PIN salah",
        "common.cancel": "Batal",
        "common.confirm": "Konfirmasi",
        "common.save": "Simpan",
        "common.delete": "Hapus",
        "common.edit": "Ubah",
        "common.add": "Tambah",
        "cashier.title": "Kasir",
        "waiter.title": "Pramusaji",
        "kitchen.title": "Dapur",
        "bar.title": "Bar",
        "admin.title": "Admin",
        "settings.title": "Pengaturan",
    },
}


@router.get("/locales")
def locales():
    return {"locales": list(TRANSLATIONS.keys())}


@router.get("/translations")
def translations(locale: str = "en"):
    return TRANSLATIONS.get(locale, TRANSLATIONS["en"])
