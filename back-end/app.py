from flask import Flask, jsonify, request, make_response
import mysql.connector
import csv
import uuid
from werkzeug.utils import secure_filename  # Ασφαλής αποθήκευση αρχείων

app = Flask(__name__)

# Σύνδεση με τη βάση δεδομένων
def get_db_connection():
    return mysql.connector.connect(
        host="localhost",  # Δημόσια IP της βάσης
        user="root",       # Username της MySQL
        password="alexandra",   # Password της MySQL
        database="toll_management",  # Όνομα της βάσης
<<<<<<< HEAD
        port=3306
=======
        charset="utf8mb4" 
>>>>>>> cc26cec (Description of changes made in restapi_feature)
    )

# Token storage for simplicity (in-memory, should use a DB in production)
tokens = {}

# Helper για μορφή JSON/CSV
def format_response(data, format_type):
    if format_type == "csv":
        if not isinstance(data, list) or len(data) == 0:
            return make_response("No data to return", 204)
        csv_data = ",".join(data[0].keys()) + "\n"  # Headers
        for row in data:
            csv_data += ",".join(map(str, row.values())) + "\n"
        response = make_response(csv_data)
        response.headers["Content-Type"] = "text/csv"
        return response
    return jsonify(data)

# /login
@app.route('/api/login', methods=['POST'])
def login():
    try:
        username = request.form.get('username')
        password = request.form.get('password')

        if not username or not password:
            return jsonify({"status": "failed", "info": "Missing username or password"}), 400

        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)

        cursor.execute("SELECT * FROM Users WHERE username = %s AND password = %s", (username, password))
        user = cursor.fetchone()

        cursor.close()
        conn.close()

        if not user:
            return jsonify({"status": "failed", "info": "Invalid credentials"}), 401

        token = str(uuid.uuid4())
        tokens[token] = username

        return jsonify({"status": "OK", "token": token}), 200
    except Exception as e:
        return jsonify({"status": "failed", "info": str(e)}), 500

# /logout
@app.route('/api/logout', methods=['POST'])
def logout():
    try:
        token = request.headers.get('X-OBSERVATORY-AUTH')

        if not token or token not in tokens:
            return jsonify({"status": "failed", "info": "Invalid or missing token"}), 401

        del tokens[token]

        return '', 200
    except Exception as e:
        return jsonify({"status": "failed", "info": str(e)}), 500

# /admin/healthcheck
@app.route('/api/admin/healthcheck', methods=['GET'])
def healthcheck():
    try:
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)

<<<<<<< HEAD
        cursor.execute("SELECT COUNT(*) as n_stations FROM TollStations")
        n_stations = cursor.fetchone()["n_stations"]

        cursor.execute("SELECT COUNT(*) as n_tags FROM Tags")
=======
        cursor.execute("SELECT COUNT(*) as n_stations FROM tollStations")
        n_stations = cursor.fetchone()["n_stations"]

        cursor.execute("SELECT COUNT(DISTINCT tagRef) as n_tags FROM tollPasses")
>>>>>>> cc26cec (Description of changes made in restapi_feature)
        n_tags = cursor.fetchone()["n_tags"]

        cursor.execute("SELECT COUNT(*) as n_passes FROM tollPasses")
        n_passes = cursor.fetchone()["n_passes"]

        cursor.close()
        conn.close()

        if n_stations == 0 and n_tags == 0 and n_passes == 0:
            return '', 204  # No content

        format_type = request.args.get("format", "json")
        data = {
            "status": "OK",
            "dbconnection": "connected",
            "n_stations": n_stations,
            "n_tags": n_tags,
            "n_passes": n_passes
        }
        return format_response([data], format_type)

    except Exception as e:
        return jsonify({
            "status": "failed",
            "dbconnection": "disconnected",
            "error": str(e)
        }), 500

# /admin/resetstations
@app.route('/api/admin/resetstations', methods=['POST'])
def reset_stations():
    try:
        conn = get_db_connection()
        cursor = conn.cursor()

<<<<<<< HEAD
        cursor.execute("DELETE FROM TollStations")
=======
        cursor.execute("DELETE FROM tollStations")
>>>>>>> cc26cec (Description of changes made in restapi_feature)

        with open('tollstations2024.csv', mode='r', encoding='utf-8') as file:
            csv_reader = csv.reader(file)
            next(csv_reader)  # Παράκαμψη της πρώτης γραμμής (headers)
            for row in csv_reader:
                query = (
                    "INSERT INTO tollStations (OpID, Operator, TollID, Name, PM, Locality, Road, Latitude, Longitude, Email, Price1, Price2, Price3, Price4) "
                    "VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)"
                ),
                cursor.execute(
                    "INSERT INTO tollStations (OpID, Operator, TollID, Name, PM, Locality, Road, Latitude, Longitude, Email, Price1, Price2, Price3, Price4) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)",
                    (row[0], row[1], row[2], row[3], row[4], row[5], row[6], row[7], row[8], row[9], row[10], row[11], row[12], row[13])
                )

        conn.commit()
        cursor.close()
        conn.close()

        return jsonify({"status": "OK"}), 200
    except FileNotFoundError:
        return jsonify({"status": "failed", "info": "CSV file not found"}), 400
    except Exception as e:
        return jsonify({"status": "failed", "info": str(e)}), 500

# /admin/resetpasses
@app.route('/api/admin/resetpasses', methods=['POST'])
def reset_passes():
    try:
        if not request.headers.get("Authorization"):
            return jsonify({"status": "failed", "info": "Missing Authorization header"}), 401

        conn = get_db_connection()
        cursor = conn.cursor()

<<<<<<< HEAD
        cursor.execute("DELETE FROM TollPasses")
        cursor.execute("DELETE FROM Tags")
=======
        cursor.execute("DELETE FROM tollPasses")
>>>>>>> cc26cec (Description of changes made in restapi_feature)
        cursor.execute("DELETE FROM Users")
        cursor.execute(
            "INSERT INTO Users (username, password) VALUES (%s, %s)",
            ('admin', 'freepasses4all')
        )

        conn.commit()
        cursor.close()
        conn.close()

        return jsonify({"status": "OK"}), 200
    except Exception as e:
        return jsonify({"status": "failed", "info": str(e)}), 500

# /admin/addpasses
@app.route('/api/admin/addpasses', methods=['POST'])
def add_passes():
    try:
        if 'file' not in request.files:
            return jsonify({"status": "failed", "info": "No file part in the request"}), 400

        file = request.files['file']
        if file.filename == '':
            return jsonify({"status": "failed", "info": "No file selected"}), 400

        filename = secure_filename(file.filename)
        file.save(filename)

        conn = get_db_connection()
        cursor = conn.cursor()

        with open(filename, mode='r', encoding='utf-8') as csvfile:
            csv_reader = csv.reader(csvfile)
            next(csv_reader)  # Παράκαμψη headers
            for row in csv_reader:
                cursor.execute(
                    "INSERT INTO tollPasses (timestamp, tollID, tagRef, tagHomeID, charge) VALUES (%s, %s, %s, %s, %s)",
                    (row[0], row[1], row[2], row[3], row[4])
                )
<<<<<<< HEAD
                cursor.execute(
                    "INSERT INTO Tags (tagID, tagProvider) VALUES (%s, %s) ON DUPLICATE KEY UPDATE tagProvider=VALUES(tagProvider)",
                    (row[2], row[3])
                )
=======
>>>>>>> cc26cec (Description of changes made in restapi_feature)

        conn.commit()
        cursor.close()
        conn.close()

        return jsonify({"status": "OK"}), 200
    except FileNotFoundError:
        return jsonify({"status": "failed", "info": "File not found"}), 400
    except Exception as e:
        return jsonify({"status": "failed", "info": str(e)}), 500

# Εκκίνηση της εφαρμογής
if __name__ == '__main__':
    app.run(port=9115)
