import requests
import pytest

BASE_URL = "https://localhost:9115/api"
HEADERS = {"Content-Type": "application/json"}
VERIFY_SSL = False  # Απενεργοποίηση SSL για self-signed cert

# 🔹 1. Healthcheck
def test_healthcheck():
    response = requests.get(f"{BASE_URL}/admin/healthcheck", verify=VERIFY_SSL)
    assert response.status_code == 200
    data = response.json()
    print(f"Healthcheck Response: {data}")  # Debugging print
    if isinstance(data, list):
        data = data[0]  # Αν είναι λίστα, παίρνουμε το πρώτο στοιχείο
    assert data["status"] == "OK"
    assert data["dbconnection"] == "connected"

# 🔹 2. Users (Admin)
def test_get_users():
    response = requests.get(f"{BASE_URL}/admin/users", verify=VERIFY_SSL)
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)
    assert len(data) > 0  # Πρέπει να υπάρχουν χρήστες

# 🔹 3. Login & Logout
def test_login_logout():
    login_data = {"username": "admin", "password": "freepasses4all"}
    response = requests.post(f"{BASE_URL}/login", data=login_data, verify=VERIFY_SSL)
    assert response.status_code == 200
    token = response.json().get("token")
    assert token is not None

    # Logout
    headers = {"X-OBSERVATORY-AUTH": token}
    response = requests.post(f"{BASE_URL}/logout", headers=headers, verify=VERIFY_SSL)
    assert response.status_code == 200

# 🔹 4. Toll Station Passes
def test_toll_station_passes():
    station_id = "NAO30"
    from_date = "20220101"
    to_date = "20220131"
    response = requests.get(
        f"{BASE_URL}/tollStationPasses/tollStationID/{station_id}/date_from/{from_date}/date_to/{to_date}",
        verify=VERIFY_SSL
    )
    assert response.status_code == 200
    data = response.json()
    assert "nPasses" in data
    assert isinstance(data["passList"], list)

# 🔹 5. Passes Cost
def test_passes_cost():
    tollOpID = "NAO"
    tagOpID = "EG"
    from_date = "20220101"
    to_date = "20220131"
    response = requests.get(
        f"{BASE_URL}/passesCost/tollOpID/{tollOpID}/tagOpID/{tagOpID}/date_from/{from_date}/date_to/{to_date}",
        verify=VERIFY_SSL
    )
    assert response.status_code == 200
    data = response.json()
    assert "nPasses" in data
    assert "passesCost" in data

# 🔹 6. Charges by Toll Operator
def test_charges_by():
    tollOpID = "NAO"
    from_date = "20220101"
    to_date = "20220131"
    response = requests.get(
        f"{BASE_URL}/chargesBy/tollOpID/{tollOpID}/date_from/{from_date}/date_to/{to_date}",
        verify=VERIFY_SSL
    )
    assert response.status_code == 200
    data = response.json()
    assert "vOpList" in data
    assert isinstance(data["vOpList"], list)

# 🔹 7. Pass Analysis
def test_pass_analysis():
    stationOpID = "AM"
    tagOpID = "EG"
    from_date = "20220101"
    to_date = "20230101"
    response = requests.get(
        f"{BASE_URL}/passAnalysis/stationOpID/{stationOpID}/tagOpID/{tagOpID}/date_from/{from_date}/date_to/{to_date}",
        verify=VERIFY_SSL
    )
    assert response.status_code == 200
    data = response.json()
    print(f"Pass Analysis Response: {data}")  # Debugging print
    if isinstance(data, list):
        data = data[0]  # Αν είναι λίστα, παίρνουμε το πρώτο στοιχείο
    assert "nPasses" in data
    assert isinstance(data["passList"], list)

# 🔹 9. Toll Stations
def test_toll_stations():
    # Κάνουμε login για να πάρουμε token
    login_data = {"username": "admin", "password": "freepasses4all"}
    login_response = requests.post(f"{BASE_URL}/login", data=login_data, verify=VERIFY_SSL)
    assert login_response.status_code == 200
    token = login_response.json().get("token")
    
    headers = {"X-OBSERVATORY-AUTH": token}
    response = requests.get(f"{BASE_URL}/admin/tollstations", headers=headers, verify=VERIFY_SSL)
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)

# 🔹 10. Reset Stations
def test_reset_stations():
    response = requests.post(f"{BASE_URL}/admin/resetstations", verify=VERIFY_SSL)
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "OK"

# 🔹 11. Reset Passes
def get_auth_token():
    """ Κάνει login και επιστρέφει το πραγματικό token """
    login_data = {"username": "admin", "password": "freepasses4all"}
    response = requests.post(f"{BASE_URL}/login", data=login_data, verify=VERIFY_SSL)
    assert response.status_code == 200, f"Login failed: {response.text}"
    return response.json().get("token")

def test_reset_passes():
    """ Χρησιμοποιεί το σωστό token για να κάνει reset passes """
    token = get_auth_token()  # Παίρνει το πραγματικό token
    headers = {"X-OBSERVATORY-AUTH": token}  # Χρησιμοποιεί το token στο request

    response = requests.post(f"{BASE_URL}/admin/resetpasses", headers=headers, verify=VERIFY_SSL)
    assert response.status_code == 200, f"Reset passes failed: {response.text}"
    
    data = response.json()
    assert data["status"] == "OK"


# 🔹 12. Upload Passes CSV
def test_upload_passes_csv():
    files = {'file': ('passes-sample.csv', open('passes-sample.csv', 'rb'), 'text/csv')}
    response = requests.post(f"{BASE_URL}/admin/addpasses", files=files, verify=VERIFY_SSL)
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "OK"

# 🔹 13. Get Passes (Authenticated)
def test_get_passes():
    login_data = {"username": "admin", "password": "freepasses4all"}
    login_response = requests.post(f"{BASE_URL}/login", data=login_data, verify=VERIFY_SSL)
    token = login_response.json().get("token")

    headers = {"X-OBSERVATORY-AUTH": token}
    response = requests.get(f"{BASE_URL}/passes", headers=headers, verify=VERIFY_SSL)
    assert response.status_code == 200
    assert isinstance(response.json(), list)


    # 🔹 14.1. Failed Login (Wrong Credentials)
def test_failed_login():
    login_data = {"username": "wronguser", "password": "wrongpassword"}
    response = requests.post(f"{BASE_URL}/login", data=login_data, verify=VERIFY_SSL)
    assert response.status_code == 401  # Unauthorized

# 🔹 14.2. Access API Without Token
def test_access_without_token():
    response = requests.get(f"{BASE_URL}/passes", verify=VERIFY_SSL)
    assert response.status_code == 401  # Unauthorized

# 🔹 14.3. Use Expired/Invalid Token
def test_invalid_token():
    headers = {"X-OBSERVATORY-AUTH": "invalid_token"}
    response = requests.get(f"{BASE_URL}/passes", headers=headers, verify=VERIFY_SSL)
    assert response.status_code == 401  # Unauthorized

# 🔹 15.2. Non-existent Toll Station
def test_non_existent_toll_station():
    response = requests.get(f"{BASE_URL}/tollStationPasses/tollStationID/INVALID/date_from/20220101/date_to/20220131", verify=VERIFY_SSL)
    assert response.status_code == 404  # Not Found

# 🔹 15.3. Invalid Date Format
def test_invalid_date_format():
    response = requests.get(f"{BASE_URL}/tollStationPasses/tollStationID/NAO30/date_from/01-01-2022/date_to/31-01-2022", verify=VERIFY_SSL)
    assert response.status_code == 400  # Bad Request

def test_add_passes():
    login_data = {"username": "admin", "password": "freepasses4all"}
    login_response = requests.post(f"{BASE_URL}/login", data=login_data, verify=VERIFY_SSL)
    token = login_response.json().get("token")
    
    headers = {"X-OBSERVATORY-AUTH": token}
    files = {'file': ('passes-sample.csv', open('passes-sample.csv', 'rb'), 'text/csv')}
    
    response = requests.post(f"{BASE_URL}/admin/addpasses", headers=headers, files=files, verify=VERIFY_SSL)
    assert response.status_code == 200, f"Failed to upload passes: {response.text}"
    data = response.json()
    assert data["status"] == "OK"


def test_list_users():
    login_data = {"username": "admin", "password": "freepasses4all"}
    login_response = requests.post(f"{BASE_URL}/login", data=login_data, verify=VERIFY_SSL)
    token = login_response.json().get("token")

    headers = {"X-OBSERVATORY-AUTH": token}
    response = requests.get(f"{BASE_URL}/admin/users", headers=headers, verify=VERIFY_SSL)
    
    assert response.status_code == 200, f"Failed to get users: {response.text}"
    data = response.json()
    assert isinstance(data, list)
    assert len(data) > 0  # Πρέπει να υπάρχουν χρήστες