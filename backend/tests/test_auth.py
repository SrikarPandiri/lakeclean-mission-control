import pytest
from fastapi.testclient import TestClient
from backend.app.core.security import hash_password
from backend.app.models.models import User, Profile
from backend.scripts.create_admin import setup_admin

def test_register_operator(client: TestClient, db):
    payload = {
        "email": "researcher@lakeclean.demo",
        "password": "Password123!",
        "display_name": "Dr. Sarah Chen"
    }
    res = client.post("/api/auth/register", json=payload)
    assert res.status_code == 201
    data = res.json()
    assert "access_token" in data
    assert data["token_type"] == "bearer"
    assert data["user"]["email"] == "researcher@lakeclean.demo"
    assert data["user"]["role"] == "operator"  # Must strictly default to operator

def test_register_duplicate_email(client: TestClient):
    payload = {
        "email": "duplicate@lakeclean.demo",
        "password": "Password123!",
        "display_name": "First User"
    }
    res1 = client.post("/api/auth/register", json=payload)
    assert res1.status_code == 201

    res2 = client.post("/api/auth/register", json=payload)
    assert res2.status_code == 400
    assert "already exists" in res2.json()["detail"].lower()

def test_login_flow(client: TestClient):
    # Register user
    email = "testlogin@lakeclean.demo"
    password = "CorrectPassword123!"
    client.post("/api/auth/register", json={
        "email": email,
        "password": password,
        "display_name": "Login Tester"
    })

    # Successful login
    login_res = client.post("/api/auth/login", json={
        "email": email,
        "password": password,
        "remember_me": True
    })
    assert login_res.status_code == 200
    token = login_res.json()["access_token"]
    assert token is not None

    # Failed login - bad password
    bad_res = client.post("/api/auth/login", json={
        "email": email,
        "password": "WrongPassword999!"
    })
    assert bad_res.status_code == 401

    # Failed login - bad email
    unknown_res = client.post("/api/auth/login", json={
        "email": "nonexistent@lakeclean.demo",
        "password": password
    })
    assert unknown_res.status_code == 401

def test_guest_session(client: TestClient):
    res = client.post("/api/auth/guest")
    assert res.status_code == 200
    data = res.json()
    assert "access_token" in data
    assert data["user"]["role"] == "guest"
    assert "guest-" in data["user"]["id"]

    # Verify guest token works on /auth/me
    token = data["access_token"]
    me_res = client.get("/api/auth/me", headers={"Authorization": f"Bearer {token}"})
    assert me_res.status_code == 200
    assert me_res.json()["role"] == "guest"

def test_admin_role_enforcement(client: TestClient, db):
    # 1. Setup admin using secure setup helper
    admin_email = "admin@lakeclean.demo"
    admin_pw = "AdminSecret2026!"
    setup_admin(email=admin_email, password=admin_pw, name="Admin Lead", force=True, db=db)

    # Login as admin
    admin_login = client.post("/api/auth/login", json={"email": admin_email, "password": admin_pw})
    admin_token = admin_login.json()["access_token"]

    # 2. Register regular operator
    op_email = "operator1@lakeclean.demo"
    op_pw = "OperatorPw123!"
    op_reg = client.post("/api/auth/register", json={
        "email": op_email,
        "password": op_pw,
        "display_name": "Normal Operator"
    })
    op_token = op_reg.json()["access_token"]
    op_id = op_reg.json()["user"]["id"]

    # 3. Guest token
    guest_res = client.post("/api/auth/guest")
    guest_token = guest_res.json()["access_token"]

    # Test 6: Guests cannot access administrator features (403 Forbidden)
    res_guest = client.get("/api/admin/users", headers={"Authorization": f"Bearer {guest_token}"})
    assert res_guest.status_code == 403

    # Test 7: Operators cannot access administrator features or promote themselves (403 Forbidden)
    res_op = client.get("/api/admin/users", headers={"Authorization": f"Bearer {op_token}"})
    assert res_op.status_code == 403

    promote_self = client.patch(
        f"/api/admin/users/{op_id}/role",
        headers={"Authorization": f"Bearer {op_token}"},
        json={"role": "admin"}
    )
    assert promote_self.status_code == 403

    # 4. Administrator CAN access users list
    res_admin = client.get("/api/admin/users", headers={"Authorization": f"Bearer {admin_token}"})
    assert res_admin.status_code == 200
    users_list = res_admin.json()
    assert len(users_list) >= 2

    # Administrator CAN promote operator
    promote_res = client.patch(
        f"/api/admin/users/{op_id}/role",
        headers={"Authorization": f"Bearer {admin_token}"},
        json={"role": "admin"}
    )
    assert promote_res.status_code == 200
    assert promote_res.json()["role"] == "admin"

def test_password_reset_flow(client: TestClient):
    email = "reset_user@lakeclean.demo"
    password = "OldPassword123!"
    client.post("/api/auth/register", json={
        "email": email,
        "password": password,
        "display_name": "Reset Tester"
    })

    # Request reset token
    forgot_res = client.post("/api/auth/forgot-password", json={"email": email})
    assert forgot_res.status_code == 200
    reset_token = forgot_res.json().get("demo_reset_token")
    assert reset_token is not None

    # Reset with valid token
    new_password = "BrandNewPassword2026!"
    reset_res = client.post("/api/auth/reset-password", json={
        "token": reset_token,
        "new_password": new_password
    })
    assert reset_res.status_code == 200

    # Old password no longer works
    old_login = client.post("/api/auth/login", json={"email": email, "password": password})
    assert old_login.status_code == 401

    # New password works
    new_login = client.post("/api/auth/login", json={"email": email, "password": new_password})
    assert new_login.status_code == 200
