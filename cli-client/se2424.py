import argparse
import requests
import json

# Η βασική URL του API
API_BASE_URL = "https://localhost:9115/api"

# Παράβλεψη SSL warnings
import urllib3
urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)

# Global Token για Authentication
TOKEN = None

# Βοηθητική συνάρτηση για κλήση API
def call_api(endpoint, method="GET", data=None, params=None, headers=None, files=None):
    url = f"{API_BASE_URL}/{endpoint}"
    if not headers:
        headers = {}
    if TOKEN:
        headers["X-OBSERVATORY-AUTH"] = TOKEN

    try:
        # Εκτύπωση για debugging
        print(f"Calling URL: {url}")
        print(f"Params: {params}")
        print(f"Headers: {headers}")

        if method == "GET":
            response = requests.get(url, params=params, headers=headers, verify=False)
        elif method == "POST":
            response = requests.post(url, data=data, headers=headers, files=files, verify=False)
        else:
            print("Unsupported HTTP method")
            return None

        # Debugging για debugging
        print(f"Response Status Code: {response.status_code}")
        print(f"Response Headers: {response.headers}")
        print(f"Response Text: {response.text}")

        if response.status_code in [200, 201]:
            # Διαχείριση CSV
            if "text/csv" in response.headers.get("Content-Type", ""):
                print("CSV Response:")
                print(response.text)  # Εκτύπωση της CSV απόκρισης
                return response.text
            # Διαχείριση JSON
            return response.json()
        elif response.status_code == 204:
            print("No data to return")
            return None
        else:
            print(f"Error: {response.status_code} - {response.text}")
            return None
    except Exception as e:
        print(f"API Call Failed: {e}")
        return None

# Λειτουργία: Healthcheck
def healthcheck():
    data = call_api("admin/healthcheck", "GET")
    if data:
        print(json.dumps(data, indent=4))

# Λειτουργία: Login
def login(username, passw):
    global TOKEN
    data = {"username": username, "password": passw}
    response = call_api("login", "POST", data=data)
    if response and "token" in response:
        TOKEN = response["token"]
        print("Login successful. Token saved.")
    else:
        print("Login failed.")

# Λειτουργία: Logout
def logout():
    global TOKEN
    if not TOKEN:
        print("You are not logged in.")
        return
    response = call_api("logout", "POST")
    if response is None:
        print("Logout successful.")
        TOKEN = None

# Λειτουργία: Toll Station Passes
def toll_station_passes(station, from_date, to_date):
    endpoint = f"tollStationPasses/tollStationID/{station}/date_from/{from_date}/date_to/{to_date}"
    data = call_api(endpoint, "GET")
    if data:
        print(json.dumps(data, indent=4))

# Λειτουργία: Προσθήκη διελεύσεων από αρχείο CSV
def add_passes(source):
    with open(source, 'rb') as f:
        files = {'file': f}
        response = requests.post(f"{API_BASE_URL}/admin/addpasses", files=files, verify=False)
    if response.status_code == 200:
        print("Passes added successfully.")
    else:
        print(f"Error: {response.status_code} - {response.text}")

# Λειτουργία: Εμφάνιση λίστας χρηστών
def list_users():
    response = call_api("admin/users", "GET")
    if response:
        print(json.dumps(response, indent=4))

# Λειτουργία: Δημιουργία ή αλλαγή χρήστη
def user_mod(username, passw):
    data = {"username": username, "password": passw}
    response = call_api("admin/usermod", "POST", data=data)
    if response:
        print("User modified successfully.")
    else:
        print("Failed to modify user.")

# Λειτουργία: Reset stations
def reset_stations():
    response = call_api("admin/resetstations", "POST")
    if response:
        print("Stations reset successfully.")
    else:
        print("Failed to reset stations.")

# Λειτουργία: Reset passes
def reset_passes():
    response = call_api("admin/resetpasses", "POST")
    if response:
        print("Passes reset successfully.")
    else:
        print("Failed to reset passes.")

def pass_analysis(stationop, tagop, from_date, to_date):
    endpoint = f"passAnalysis/stationOpID/{stationop}/tagOpID/{tagop}/date_from/{from_date}/date_to/{to_date}"
    data = call_api(endpoint, "GET")
    if data:
        print(json.dumps(data, indent=4))

# Λειτουργία: Charges by operator
def charges_by(opid, from_date, to_date):
    endpoint = f"chargesBy/{opid}/{from_date}/{to_date}"
    data = call_api(endpoint, "GET")
    if data:
        print(json.dumps(data, indent=4))

# Λειτουργία: Passes cost
def passes_cost(stationop, tagop, from_date, to_date):
    endpoint = f"passesCost/{stationop}/{tagop}/{from_date}/{to_date}"
    data = call_api(endpoint, "GET")
    if data:
        print(json.dumps(data, indent=4))

# Ρύθμιση CLI
def setup_cli():
    parser = argparse.ArgumentParser(description="Toll Management CLI")
    parser.add_argument("scope", choices=[
        "healthcheck", "login", "logout", "tollstationpasses", "addpasses", "users", "usermod", "passanalysis", "resetstations", "resetpasses", "chargesby", "passescost"
    ], help="The action to perform.")
    parser.add_argument("--format", choices=["json", "csv"], default="csv", help="Format of the response.")
    parser.add_argument("--username", help="Username for login or usermod.")
    parser.add_argument("--passw", help="Password for login or usermod.")
    parser.add_argument("--station", help="Station ID for toll station passes.")
    parser.add_argument("--from_date", help="Start date (YYYYMMDD).")
    parser.add_argument("--to_date", help="End date (YYYYMMDD).")
    parser.add_argument("--source", help="Source file for addpasses.")
    parser.add_argument("--opid", help="Operator ID for chargesby or passescost.")
    parser.add_argument("--stationop", help="Station Operator ID for passescost.")
    parser.add_argument("--tagop", help="Tag Operator ID for passescost.")

    args = parser.parse_args()

    if args.scope == "healthcheck":
        healthcheck()
    elif args.scope == "login" and args.username and args.passw:
        login(args.username, args.passw)
    elif args.scope == "logout":
        logout()
    elif args.scope == "tollstationpasses" and args.station and args.from_date and args.to_date:
        toll_station_passes(args.station, args.from_date, args.to_date)
    elif args.scope == "addpasses" and args.source:
        add_passes(args.source)
    elif args.scope == "users":
        list_users()
    elif args.scope == "usermod" and args.username and args.passw:
        user_mod(args.username, args.passw)
    elif args.scope == "resetstations":
        reset_stations()
    elif args.scope == "resetpasses":
        reset_passes()
    elif args.scope == "chargesby" and args.opid and args.from_date and args.to_date:
        charges_by(args.opid, args.from_date, args.to_date)
    elif args.scope == "passescost" and args.stationop and args.tagop and args.from_date and args.to_date:
        passes_cost(args.stationop, args.tagop, args.from_date, args.to_date)
    elif args.scope == "passanalysis" and args.stationop and args.tagop and args.from_date and args.to_date:
        pass_analysis(args.stationop, args.tagop, args.from_date, args.to_date)
    else:
        print("Invalid or incomplete arguments. Use --help for usage information.")

if __name__ == "__main__":
    setup_cli()