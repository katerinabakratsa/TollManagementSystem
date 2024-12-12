from flask import Flask, jsonify
import mysql.connector
import csv
from flask import request
from werkzeug.utils import secure_filename  # Ασφαλής αποθήκευση αρχείων

app = Flask(__name__)

# Σύνδεση με τη βάση δεδομένων
def get_db_connection():
    return mysql.connector.connect(
        host="10.255.219.31",  # Δημόσια IP της βάσης
        user="teamUser",       # Username της MySQL
        password="dreamteam24",   # Password της MySQL
        database="toll_management",  # Όνομα της βάσης
        port=3306 
    )

@app.route('/admin/healthcheck', methods=['GET'])
def healthcheck():
    try:
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)

        # Ερωτήματα για συλλογή στατιστικών
        cursor.execute("SELECT COUNT(*) as n_stations FROM TollStations")
        n_stations = cursor.fetchone()["n_stations"]

        cursor.execute("SELECT COUNT(*) as n_tags FROM TollPasses")
        n_tags = cursor.fetchone()["n_tags"]

        cursor.execute("SELECT COUNT(*) as n_passes FROM TollPasses")
        n_passes = cursor.fetchone()["n_passes"]

        cursor.close()
        conn.close()

        # Επιστροφή JSON με τα στατιστικά
        return jsonify({
            "status": "OK",
            "dbconnection": "host=10.255.219.31;user=teamUser;password=dreamteam24;database=toll_management;port=3306",
            "n_stations": n_stations,
            "n_tags": n_tags,
            "n_passes": n_passes
        }), 200
    except Exception as e:
        return jsonify({
            "status": "failed",
            "dbconnection": "host=10.255.219.31;user=teamUser;password=dreamteam24;database=toll_management;port=3306",
            "error": str(e)
        }), 401

@app.route('/admin/resetstations', methods=['POST'])
def reset_stations():
    try:
        conn = get_db_connection()
        cursor = conn.cursor()

        # Διαγραφή όλων των σταθμών
        cursor.execute("DELETE FROM TollStations")

        # Αρχικοποίηση από το αρχείο CSV
        with open('tollstations2024.csv', mode='r', encoding='utf-8') as file:
            csv_reader = csv.reader(file)
            next(csv_reader)  # Παράκαμψη της πρώτης γραμμής (headers)
            for row in csv_reader:
                cursor.execute(
                    "INSERT INTO TollStations (stationID, name, location) VALUES (%s, %s, %s)",
                    (row[0], row[1], row[2])
                )

        conn.commit()
        cursor.close()
        conn.close()

        return jsonify({"status": "OK"})
    except Exception as e:
        return jsonify({"status": "failed", "info": str(e)}), 500

@app.route('/admin/resetpasses', methods=['POST'])
def reset_passes():
    try:
        conn = get_db_connection()
        cursor = conn.cursor()

        # Διαγραφή όλων των διελεύσεων
        cursor.execute("DELETE FROM TollPasses")

        cursor.execute("DELETE FROM Tags") 
        cursor.execute("DELETE FROM Users")  # Διαγραφή χρηστών
        cursor.execute(
            "INSERT INTO Users (username, password) VALUES (%s, %s)",
            ('admin', 'freepasses4all')
        )

        conn.commit()
        cursor.close()
        conn.close()

        return jsonify({"status": "OK"})
    except Exception as e:
        return jsonify({"status": "failed", "error": str(e)}), 500

@app.route('/admin/addpasses', methods=['POST'])
def add_passes():
    try:
        if 'file' not in request.files:
            return jsonify({"status": "failed", "info": "No file part in the request"}), 400
        file = request.files['file']

        if file.filename == '':
            return jsonify({"status": "failed", "info": "No file selected"}), 400

        # Ασφαλής αποθήκευση του αρχείου
        filename = secure_filename(file.filename)
        file.save(filename)

        conn = get_db_connection()
        cursor = conn.cursor()

# Ανάγνωση και εισαγωγή δεδομένων από το CSV
        with open(filename, mode='r', encoding='utf-8') as csvfile:
            csv_reader = csv.reader(csvfile)
            next(csv_reader)  # Παράκαμψη headers
            for row in csv_reader:
                cursor.execute(
                    "INSERT INTO TollPasses (timestamp, tollID, tagRef, tagHomeID, charge) VALUES (%s, %s, %s, %s, %s)",
                    (row[0], row[1], row[2], row[3], row[4])
                )

                # Αν υπάρχει πίνακας Tags, εισάγουμε δεδομένα
                cursor.execute(
                    "INSERT INTO Tags (tagID, tagProvider) VALUES (%s, %s) ON DUPLICATE KEY UPDATE tagID=tagID",
                    (row[2], row[3])  # το φτιαχνουμε αναλογα με τις στηλες του csv
                )

        conn.commit()
        cursor.close()
        conn.close()

        return jsonify({"status": "OK"})
    except Exception as e:
        return jsonify({"status": "failed", "info": str(e)}), 500


# Εκκίνηση της εφαρμογής
if __name__ == '__main__':
    app.run(port=9115)
