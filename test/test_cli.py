import subprocess
import json
import pytest
import re 
import os

CLI_EXECUTABLE = "python se2424.py"

@pytest.fixture
def login_token():
    """Κάνει login και επιστρέφει το token"""
    result = subprocess.run(
        f"{CLI_EXECUTABLE} login --username admin --passw freepasses4all",
        shell=True,
        capture_output=True,
        text=True
    )
    match = re.search(r'"token":\s*"([a-zA-Z0-9\-]+)"', result.stdout)
    if match:
        return match.group(1)  # Παίρνει μόνο το token
    pytest.fail("Login failed!")  # Αν δεν επιστρέψει token, αποτυγχάνει το τεστ

def test_login():
    """Τεστάρει το login και επιβεβαιώνει ότι λαμβάνουμε token"""
    result = subprocess.run(
        f"{CLI_EXECUTABLE} login --username admin --passw freepasses4all",
        shell=True,
        capture_output=True,
        text=True
    )
    assert result.returncode == 0
    assert "Login successful." in result.stdout
    assert "Token saved" in result.stdout  # Επιβεβαίωση ότι το token αποθηκεύτηκε


def test_healthcheck():
    """Τεστάρει το healthcheck του API"""
    result = subprocess.run(
        f"{CLI_EXECUTABLE} healthcheck",
        shell=True,
        capture_output=True,
        text=True
    )
    assert result.returncode == 0
    assert "dbconnection" in result.stdout.lower()

def test_toll_station_passes():
    """Τεστάρει την ανάκτηση διελεύσεων από σταθμό"""
    result = subprocess.run(
        f"{CLI_EXECUTABLE} tollstationpasses --station NAO30 --from_date 20220101 --to_date 20220131",
        shell=True,
        capture_output=True,
        text=True
    )
    assert result.returncode == 0
    assert "nPasses" in result.stdout

def test_logout():
    """Τεστάρει το logout"""
    result = subprocess.run(
        f"{CLI_EXECUTABLE} logout",
        shell=True,
        capture_output=True,
        text=True
    )
    assert result.returncode == 0
    assert "Logout successful." in result.stdout or "You are not logged in." in result.stdout

def test_reset_stations():
    """Τεστάρει την επαναφορά των σταθμών"""
    result = subprocess.run(
        f"{CLI_EXECUTABLE} resetstations",
        shell=True,
        capture_output=True,
        text=True
    )
    assert result.returncode == 0
    assert "Stations reset successfully." in result.stdout

def test_reset_passes(login_token):
    result = subprocess.run(
        f"{CLI_EXECUTABLE} resetpasses --token {login_token}",
        shell=True,
        capture_output=True,
        text=True
    )
    assert result.returncode == 0
    assert "Passes reset successfully." in result.stdout

def test_pass_analysis():
    """Τεστάρει την ανάλυση διελεύσεων"""
    result = subprocess.run(
        f"{CLI_EXECUTABLE} passanalysis --stationop AM --tagop EG --from_date 20220101 --to_date 20230101",
        shell=True,
        capture_output=True,
        text=True
    )
    assert result.returncode == 0
    assert "nPasses" in result.stdout

def test_passes_cost():
    """Τεστάρει το κόστος διελεύσεων"""
    result = subprocess.run(
        f"{CLI_EXECUTABLE} passescost --stationop NAO --tagop EG --from_date 20220101 --to_date 20220131",
        shell=True,
        capture_output=True,
        text=True
    )
    assert result.returncode == 0
    assert "passesCost" in result.stdout

def test_charges_by():
    """Τεστάρει τις χρεώσεις από άλλους operators"""
    result = subprocess.run(
        f"{CLI_EXECUTABLE} chargesby --opid NAO --from_date 20220101 --to_date 20220131",
        shell=True,
        capture_output=True,
        text=True
    )
    assert result.returncode == 0
    assert "vOpList" in result.stdout

def test_add_passes():
    """Τεστάρει την προσθήκη διελεύσεων από CSV"""
    result = subprocess.run(
        f"{CLI_EXECUTABLE} addpasses --source passes-sample.csv",
        shell=True,
        capture_output=True,
        text=True
    )
    assert result.returncode == 0
    assert "Passes added successfully." in result.stdout


def test_list_users():
    """Τεστάρει την ανάκτηση λίστας χρηστών"""
    result = subprocess.run(
        f"{CLI_EXECUTABLE} users",
        shell=True,
        capture_output=True,
        text=True
    )
    assert result.returncode == 0
    assert "username" in result.stdout  # Ελέγχει ότι εμφανίζεται τουλάχιστον ένας χρήστης
