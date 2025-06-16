import os

def is_dry_run():
    return os.getenv("DRY_RUN", "true").lower() == "true"

def limite_diario():
    return float(os.getenv("LIMITE_LUCRO_DIARIO", 0))
