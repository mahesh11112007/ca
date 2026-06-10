"""Validation functions for request data (Flask equivalent of Pydantic schemas)."""

from decimal import Decimal, InvalidOperation

VALID_ROLES = ("Sender", "Receiver")


def validate_register(data):
    """Validate user registration data.

    Args:
        data: dict with username, password, role fields.

    Returns:
        tuple: (cleaned_data_dict, None) on success or (None, error_string) on failure.
    """
    if not data or not isinstance(data, dict):
        return None, "Request body must be a JSON object"

    errors = []

    # Username validation
    username = data.get("username")
    if not username or not isinstance(username, str):
        errors.append("Username is required and must be a string")
    else:
        username = username.strip()
        if len(username) < 3:
            errors.append("Username must be at least 3 characters long")
        elif len(username) > 100:
            errors.append("Username must be at most 100 characters long")

    # Password validation
    password = data.get("password")
    if not password or not isinstance(password, str):
        errors.append("Password is required and must be a string")
    elif len(password) < 6:
        errors.append("Password must be at least 6 characters long")

    # Role validation
    role = data.get("role")
    if not role or not isinstance(role, str):
        errors.append("Role is required and must be a string")
    elif role not in VALID_ROLES:
        errors.append(f"Role must be one of: {', '.join(VALID_ROLES)}")

    if errors:
        return None, "; ".join(errors)

    cleaned = {
        "username": username.strip(),
        "password": password,
        "role": role,
    }
    return cleaned, None


def validate_login(data):
    """Validate user login data.

    Args:
        data: dict with username, password fields.

    Returns:
        tuple: (cleaned_data_dict, None) on success or (None, error_string) on failure.
    """
    if not data or not isinstance(data, dict):
        return None, "Request body must be a JSON object"

    errors = []

    username = data.get("username")
    if not username or not isinstance(username, str):
        errors.append("Username is required and must be a string")

    password = data.get("password")
    if not password or not isinstance(password, str):
        errors.append("Password is required and must be a string")

    if errors:
        return None, "; ".join(errors)

    cleaned = {
        "username": username.strip(),
        "password": password,
    }
    return cleaned, None


def validate_transaction(data):
    """Validate transaction creation data.

    Args:
        data: dict with amount, type, and optional purpose fields.

    Returns:
        tuple: (cleaned_data_dict, None) on success or (None, error_string) on failure.
    """
    if not data or not isinstance(data, dict):
        return None, "Request body must be a JSON object"

    errors = []

    # Amount validation
    amount = data.get("amount")
    if amount is None:
        errors.append("Amount is required")
    else:
        try:
            amount_decimal = Decimal(str(amount))
            if amount_decimal <= 0:
                errors.append("Amount must be greater than 0")
            elif amount_decimal >= Decimal("10000000000"):
                errors.append("Amount is too large")
        except (InvalidOperation, ValueError, TypeError):
            errors.append("Amount must be a valid number")

    # Purpose validation (optional)
    purpose = data.get("purpose")
    if purpose is not None and not isinstance(purpose, str):
        errors.append("Purpose must be a string")

    # Type validation (optional)
    txn_type = data.get("type", "Payment")
    if txn_type not in ("Payment", "Request", "Debt"):
        errors.append("Type must be one of: Payment, Request, Debt")

    if errors:
        return None, "; ".join(errors)

    cleaned = {
        "amount": Decimal(str(amount)),
        "purpose": purpose.strip() if purpose else None,
        "type": txn_type,
    }
    return cleaned, None
