import pytest
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

# Global test data
TEST_EMAIL = "tester_qa@example.com"
TEST_PASSWORD = "Password123!"
auth_token = ""
category_id = 0
product_id = 0

def test_1_root():
    """Verify backend health check."""
    response = client.get("/")
    assert response.status_code == 200
    assert response.json()["status"] == "active"

def test_2_register_user():
    """Test user registration."""
    global TEST_EMAIL
    response = client.post("/api/auth/register", json={
        "full_name": "QA Tester",
        "email": TEST_EMAIL,
        "password": TEST_PASSWORD,
        "role": "admin"
    })
    # If user already exists, it's 400; if new, 201
    assert response.status_code in [201, 400]

def test_3_login():
    """Test JWT login & token issuance."""
    global auth_token
    response = client.post("/api/auth/login", json={
        "email": TEST_EMAIL,
        "password": TEST_PASSWORD
    })
    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
    auth_token = data["access_token"]

def test_4_create_category():
    """Test category creation."""
    global category_id, auth_token
    headers = {"Authorization": f"Bearer {auth_token}"}
    response = client.post("/api/categories", json={
        "name": "Audio & Sound",
        "description": "Headphones and Speakers"
    }, headers=headers)
    
    assert response.status_code in [201, 400]
    # Grab whatever category exists
    cat_list = client.get("/api/categories").json()
    assert len(cat_list) > 0
    category_id = cat_list[0]["id"]

def test_5_create_product():
    """Test product creation with stock."""
    global product_id, category_id, auth_token
    headers = {"Authorization": f"Bearer {auth_token}"}
    response = client.post("/api/products", json={
        "title": "Studio Pro Headphones",
        "description": "High resolution audio monitors",
        "price": 4999.0,
        "stock_quantity": 10,
        "category_id": category_id
    }, headers=headers)
    assert response.status_code == 201
    product_id = response.json()["id"]

def test_6_search_product():
    """Test product search query."""
    response = client.get("/api/products?search=Studio")
    assert response.status_code == 200
    data = response.json()
    assert data["total"] >= 1

def test_7_cart_and_checkout_flow():
    """Test complete shopping flow: Add to Cart -> Checkout -> Stock Deduction."""
    global product_id, auth_token
    headers = {"Authorization": f"Bearer {auth_token}"}

    # 1. Add to cart
    cart_res = client.post("/api/cart", json={
        "product_id": product_id,
        "quantity": 2
    }, headers=headers)
    assert cart_res.status_code == 201

    # 2. View cart
    view_cart = client.get("/api/cart", headers=headers)
    assert view_cart.status_code == 200
    assert view_cart.json()["total_items"] >= 2

    # 3. Checkout
    checkout_res = client.post("/api/orders/checkout", json={
        "shipping_address": "77 Testing Boulevard, Tech Park, Chennai - 600096"
    }, headers=headers)
    assert checkout_res.status_code == 201
    order_data = checkout_res.json()
    assert order_data["status"] == "pending"

    # 4. Verify stock was deducted (10 - 2 = 8)
    product_res = client.get(f"/api/products/{product_id}")
    assert product_res.status_code == 200
    assert product_res.json()["stock_quantity"] == 8

def test_8_admin_analytics():
    """Verify Admin Analytics calculates revenue and orders."""
    global auth_token
    headers = {"Authorization": f"Bearer {auth_token}"}
    response = client.get("/api/admin/analytics", headers=headers)
    assert response.status_code == 200
    data = response.json()
    assert data["total_revenue"] > 0
    assert data["total_orders"] > 0