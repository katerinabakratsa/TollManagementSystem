#app.py
from flask import Flask, jsonify, request, make_response
import mysql.connector
import csv
import uuid
from werkzeug.utils import secure_filename  # Ασφαλής αποθήκευση αρχείων
from collections import OrderedDict
from datetime import datetime
from flask import redirect

import logging

#extra added for frontend
from flask_cors import CORS  # Import CORS


app = Flask(__name__)

#extra added for frontend
# Enable CORS for all routes and allow specific origins
CORS(app, resources={
    r"/api/*": {
        "origins": "https://localhost:5173",
        "methods": ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
        "allow_headers": ["Content-Type", "Authorization", "X-OBSERVATORY-AUTH"],
        "expose_headers": ["X-OBSERVATORY-AUTH"],
    }
}, supports_credentials=True)

# Configure logging
logging.basicConfig(level=logging.DEBUG)


@app.before_request
def enforce_https():
    if request.url.startswith('http://'):
        url = request.url.replace('http://', 'https://', 1)
        return redirect(url, code=301)

# Σύνδεση με τη βάση δεδομένων
def get_db_connection():
    return mysql.connector.connect(
        host="localhost",  # Δημόσια IP της βάσης
        user="root",       # Username της MySQL
        password="sqlpass25*",   # Password της MySQL
        database="toll_management",  # Όνομα της βάσης
        charset="utf8mb4"
    )


# Token storage for simplicity (in-memory, should use a DB in production)
tokens = {}


# Helper για μορφή JSON/CSV
def format_response(data, format_type):
    if format_type == "csv":
        if not isinstance(data, list) or len(data) == 0:
            # Επιστροφή μόνο headers όταν δεν υπάρχουν δεδομένα
            headers = "No data available\n" if not isinstance(data, list) else ",".join(data[0].keys()) + "\n"
            response = make_response(headers)
            response.headers["Content-Type"] = "text/csv"
            return response

        # Δημιουργία CSV δεδομένων
        csv_data = ",".join(data[0].keys()) + "\n"  # Headers
        for row in data:
            csv_data += ",".join(map(str, row.values())) + "\n"
        response = make_response(csv_data)
        response.headers["Content-Type"] = "text/csv"
        return response
    
    # JSON Επιστροφή
    return jsonify(data)

@app.route('/api/admin/users', methods=['GET'])
def get_users():
    try:
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)

        # Ανάκτηση χρηστών από τη βάση δεδομένων
        cursor.execute("SELECT id, username FROM Users")
        users = cursor.fetchall()

        cursor.close()
        conn.close()

        # Επιστροφή της λίστας χρηστών
        return jsonify(users), 200
    except Exception as e:
        return jsonify({"status": "failed", "info": str(e)}), 500

# /login
@app.route('/api/login', methods=['POST'])
def login():
    try:
        username = request.form.get('username')
        password = request.form.get('password')

        # Debug logging: print the received credentials
        app.logger.debug(f"Received login attempt with username: '{username}' and password: '{password}'")


        if not username or not password:
            return jsonify({"status": "failed", "info": "Missing username or password"}), 400


        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)


        cursor.execute("SELECT * FROM Users WHERE username = %s AND password = %s", (username, password))
        user = cursor.fetchone()


        cursor.close()
        conn.close()


        if not user:
            # Log that no user was found
            app.logger.debug("No matching user found in the database.")
            return jsonify({"status": "failed", "info": "Invalid credentials"}), 401


        token = str(uuid.uuid4())
        tokens[token] = username


        return jsonify({"status": "OK", "token": token}), 200
    except Exception as e:
        app.logger.exception("Login error:")
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


        cursor.execute("SELECT COUNT(*) as n_stations FROM tollStations")
        n_stations = cursor.fetchone()["n_stations"]


        cursor.execute("SELECT COUNT(DISTINCT tagRef) as n_tags FROM tollPasses")
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
        }), 401


# /admin/resetstations
@app.route('/api/admin/resetstations', methods=['POST'])
def reset_stations():
    try:
        conn = get_db_connection()
        cursor = conn.cursor()


        cursor.execute("DELETE FROM tollStations")


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


        cursor.execute("DELETE FROM tollPasses")
        #cursor.execute("DELETE FROM Users")
        #cursor.execute(
         #   "INSERT INTO Users (username, password) VALUES (%s, %s)",
         #   ('admin', 'freepasses4all')
        #)


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


        with open('passes-sample.csv', mode='r', encoding='utf-8') as csvfile:
            csv_reader = csv.reader(csvfile)
            next(csv_reader)  # Παράκαμψη headers
            for row in csv_reader:
                cursor.execute(
                    "INSERT INTO tollPasses (timestamp, tollID, tagRef, tagHomeID, charge) VALUES (%s, %s, %s, %s, %s)",
                    (row[0], row[1], row[2], row[3], row[4])
                )


        conn.commit()
        cursor.close()
        conn.close()


        return jsonify({"status": "OK"}), 200
    except FileNotFoundError:
        return jsonify({"status": "failed", "info": "File not found"}), 400
    except Exception as e:
        return jsonify({"status": "failed", "info": str(e)}), 500
        

@app.route('/api/tollStationPasses/tollStationID/<stationID>/date_from/<from_date>/date_to/<to_date>', methods=['GET'])
def get_station_passes(stationID, from_date, to_date):
    conn = None
    cursor = None
    try:
        # Έλεγχος μορφής ημερομηνιών (YYYYMMDD)
        if not (len(from_date) == 8 and len(to_date) == 8 and 
                from_date.isdigit() and to_date.isdigit()):
            return jsonify({
                "status": "failed",
                "info": "Invalid date format. Use YYYYMMDD"
            }), 400

        # Μετατροπή ημερομηνιών σε κατάλληλη μορφή
        from datetime import datetime
        try:
            from_date_obj = datetime.strptime(from_date, '%Y%m%d')
            to_date_obj = datetime.strptime(to_date, '%Y%m%d')
            from_date_formatted = from_date_obj.strftime('%Y-%m-%d')
            to_date_formatted = to_date_obj.strftime('%Y-%m-%d')
        except ValueError:
            return jsonify({
                "status": "failed",
                "info": "Invalid date values"
            }), 400

        # Σύνδεση με βάση
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)

        # Έλεγχος αν υπάρχει ο σταθμός
        cursor.execute(
            "SELECT Operator, OpID FROM tollStations WHERE TollID = %s",
            (stationID,)
        )
        station = cursor.fetchone()
        if not station:
            return jsonify({
                "status": "failed",
                "info": "Station not found"
            }), 404

        station_operator = station["Operator"]
        station_opid = station["OpID"]

        # Ανάκτηση διελεύσεων
        cursor.execute("""
            SELECT 
                timestamp,
                tagRef as tagID,
                tagHomeID,
                charge
            FROM tollPasses
            WHERE tollID = %s 
            AND DATE(timestamp) BETWEEN %s AND %s
            ORDER BY timestamp ASC
        """, (stationID, from_date_formatted, to_date_formatted))
        
        passes = cursor.fetchall()
        pass_list = []

        # Δημιουργία λίστας διελεύσεων
        for index, p in enumerate(passes, start=1):
            timestamp_str = p['timestamp'].strftime('%Y%m%d%H%M%S')
            pass_id = f"{timestamp_str}_{stationID}"
            pass_type = "Home" if p['tagHomeID'] == station_opid else "Visitor"
            
            pass_list.append(OrderedDict([
                ("passIndex", index),
                ("passID", pass_id),
                ("timestamp", p['timestamp'].strftime('%Y-%m-%d %H:%M:%S')),
                ("tagID", p['tagID']),
                ("tagProvider", p['tagHomeID']),
                ("passType", pass_type),
                ("passCharge", p['charge'])
            ]))

        # Δημιουργία απάντησης
        response = {
            "stationID": stationID,
            "stationOperator": station_operator,
            "requestTimestamp": datetime.now().strftime('%Y-%m-%d %H:%M:%S'),
            "periodFrom": from_date_formatted,
            "periodTo": to_date_formatted,
            "nPasses": len(pass_list),
            "passList": pass_list
        }

        return jsonify(response), 200

    except Exception as e:
        return jsonify({
            "status": "failed",
            "info": str(e)
        }), 500

    finally:
        if cursor is not None:
            cursor.close()
        if conn is not None:
            conn.close()


@app.route('/api/passAnalysis/stationOpID/<stationOpID>/tagOpID/<tagOpID>/date_from/<from_date>/date_to/<to_date>', methods=['GET'])
def pass_analysis(stationOpID, tagOpID, from_date, to_date):
    """
    Ανάλυση διελεύσεων μεταξύ operators:
    Επιστρέφει λίστα με αναλυτικά στοιχεία για διελεύσεις (passList), όταν ένα tag που ανήκει σε έναν
    συγκεκριμένο operator (tagOpID) περνάει από σταθμούς που ανήκουν σε άλλον operator (stationOpID).
    """

    conn = None
    cursor = None
    
    try:
        # 1. Έλεγχος μορφής ημερομηνιών (YYYYMMDD)
        if not (len(from_date) == 8 and len(to_date) == 8 and from_date.isdigit() and to_date.isdigit()):
            return jsonify({
                "status": "failed",
                "info": "Invalid date format. Use YYYYMMDD"
            }), 400

        # 2. Μετατροπή ημερομηνιών σε datetime objects
        from datetime import datetime
        try:
            from_date_obj = datetime.strptime(from_date, '%Y%m%d')
            to_date_obj = datetime.strptime(to_date, '%Y%m%d')
        except ValueError:
            return jsonify({
                "status": "failed",
                "info": "Invalid date values. Use YYYYMMDD"
            }), 400

        # 3. Φιλική μορφή ημερομηνιών για χρήση στα SQL queries
        from_date_formatted = from_date_obj.strftime('%Y-%m-%d')
        to_date_formatted = to_date_obj.strftime('%Y-%m-%d')

        # 4. Σύνδεση με τη βάση
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)

        # 5. Έλεγχος αν υπάρχει ο operator του σταθμού (stationOpID) στον πίνακα tollStations με LIMIT 1
        cursor.execute("SELECT 1 FROM tollStations WHERE OpID = %s LIMIT 1", (stationOpID,))
        station_op_found = cursor.fetchone()
        if not station_op_found:
            return jsonify({
                "status": "failed",
                "info": f"Station operator with OpID={stationOpID} not found"
            }), 404

        # 6. Ερώτημα για τις διελεύσεις
        query = """
            SELECT 
                p.timestamp,
                p.tagRef AS tagID,
                p.tollID AS stationID,
                p.charge AS passCharge
            FROM tollPasses p
            INNER JOIN tollStations s ON p.tollID = s.TollID
            WHERE s.OpID = %s         -- operator του σταθμού
              AND p.tagHomeID = %s    -- operator του tag
              AND DATE(p.timestamp) BETWEEN %s AND %s
            ORDER BY p.timestamp ASC
        """
        cursor.execute(query, (stationOpID, tagOpID, from_date_formatted, to_date_formatted))
        passes = cursor.fetchall()

        # 7. Δημιουργία passList με passIndex, passID κλπ.
        pass_list = []
        for index, p in enumerate(passes, start=1):
            # passID: συνδυασμός timestamp + stationID
            timestamp_str = p['timestamp'].strftime('%Y%m%d%H%M%S')
            pass_id = f"{timestamp_str}_{p['stationID']}"

            pass_list.append({
                "passIndex":   index,
                "passID":      pass_id,
                "stationID":   p['stationID'],
                "timestamp":   p['timestamp'].strftime('%Y-%m-%d %H:%M:%S'),
                "tagID":       p['tagID'],
                "passCharge":  float(p['passCharge'])
            })

        # 8. Δημιουργία τελικού JSON αντικειμένου
        response = {
            "stationOpID":      stationOpID,
            "tagOpID":          tagOpID,
            "requestTimestamp": datetime.now().strftime('%Y-%m-%d %H:%M:%S'),
            "periodFrom":       from_date_formatted,
            "periodTo":         to_date_formatted,
            "nPasses":          len(pass_list),
            "passList":         pass_list
        }

        # Προαιρετικά: format (JSON / CSV)
        format_type = request.args.get("format", "json")
        return format_response([response], format_type)

    except Exception as e:
        return jsonify({
            "status": "failed",
            "info": str(e)
        }), 500

    finally:
        if cursor is not None:
            cursor.close()
        if conn is not None:
            conn.close()





@app.route('/api/passesCost/tollOpID/<tollOpID>/tagOpID/<tagOpID>/date_from/<from_date>/date_to/<to_date>', methods=['GET'])
def passes_cost(tollOpID, tagOpID, from_date, to_date):
    # Ορίζουμε από την αρχή None
    conn = None
    cursor = None
    
    try:
        # Έλεγχος μορφής ημερομηνιών (YYYYMMDD)
        if not (len(from_date) == 8 and len(to_date) == 8 and from_date.isdigit() and to_date.isdigit()):
            return jsonify({
                "status": "failed",
                "info": "Invalid date format. Use YYYYMMDD"
            }), 400
        
        from datetime import datetime
        try:
            from_date_obj = datetime.strptime(from_date, '%Y%m%d')
            to_date_obj = datetime.strptime(to_date, '%Y%m%d')
        except ValueError:
            return jsonify({
                "status": "failed",
                "info": "Invalid date values. Use YYYYMMDD"
            }), 400
        
        from_date_formatted = from_date_obj.strftime('%Y-%m-%d')
        to_date_formatted = to_date_obj.strftime('%Y-%m-%d')

        # Σύνδεση με τη βάση δεδομένων
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)

        # Υπολογισμός διελεύσεων και κόστους
        cursor.execute("""
            SELECT COUNT(*) AS nPasses, COALESCE(SUM(p.charge), 0) AS passesCost
            FROM tollPasses p
            INNER JOIN tollStations s ON p.tollID = s.TollID
            WHERE s.OpID = %s
              AND p.tagHomeID = %s
              AND DATE(p.timestamp) BETWEEN %s AND %s
        """, (tollOpID, tagOpID, from_date_formatted, to_date_formatted))

        result = cursor.fetchone()

        response = {
            "tollOpID": tollOpID,
            "tagOpID": tagOpID,
            "requestTimestamp": datetime.now().strftime('%Y-%m-%d %H:%M:%S'),
            "periodFrom": from_date_formatted,
            "periodTo": to_date_formatted,
            "nPasses": result["nPasses"],
            "passesCost": float(result["passesCost"])
        }

        return jsonify(response), 200

    except Exception as e:
        return jsonify({
            "status": "failed",
            "info": str(e)
        }), 500

    finally:
        if cursor is not None:
            cursor.close()
        if conn is not None:
            conn.close()


@app.route('/api/chargesBy/tollOpID/<tollOpID>/date_from/<from_date>/date_to/<to_date>', methods=['GET'])
def charges_by(tollOpID, from_date, to_date):
    conn = None
    cursor = None
    try:
        # Έλεγχος μορφής ημερομηνιών
        if not (len(from_date) == 8 and len(to_date) == 8 and from_date.isdigit() and to_date.isdigit()):
            return jsonify({
                "status": "failed",
                "info": "Invalid date format. Use YYYYMMDD"
            }), 400

        from datetime import datetime
        try:
            from_date_obj = datetime.strptime(from_date, '%Y%m%d')
            to_date_obj = datetime.strptime(to_date, '%Y%m%d')
        except ValueError:
            return jsonify({
                "status": "failed",
                "info": "Invalid date values. Use YYYYMMDD"
            }), 400

        from_date_formatted = from_date_obj.strftime('%Y-%m-%d')
        to_date_formatted = to_date_obj.strftime('%Y-%m-%d')

        # Σύνδεση με τη βάση
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)

        # Ερώτημα SQL για visiting operators
        cursor.execute("""
            SELECT
                p.tagHomeID AS visitingOpID,
                COUNT(*) AS nPasses,
                COALESCE(SUM(p.charge), 0) AS passesCost
            FROM tollPasses p
            INNER JOIN tollStations s ON p.tollID = s.TollID
            WHERE s.OpID = %s
              AND p.tagHomeID != %s
              AND DATE(p.timestamp) BETWEEN %s AND %s
            GROUP BY p.tagHomeID
        """, (tollOpID, tollOpID, from_date_formatted, to_date_formatted))

        # Ανάκτηση αποτελεσμάτων
        rows = cursor.fetchall()  # Αυτό διασφαλίζει ότι όλα τα αποτελέσματα ανακτώνται

        # Δημιουργία λίστας visiting operators
        vOpList = [
            {
                "visitingOpID": row["visitingOpID"],
                "nPasses": row["nPasses"],
                "passesCost": float(row["passesCost"])
            }
            for row in rows
        ]

        # Δημιουργία απάντησης
        response = {
            "tollOpID": tollOpID,
            "requestTimestamp": datetime.now().strftime('%Y-%m-%d %H:%M:%S'),
            "periodFrom": from_date_formatted,
            "periodTo": to_date_formatted,
            "vOpList": vOpList
        }

        return jsonify(response), 200

    except Exception as e:
        return jsonify({
            "status": "failed",
            "info": str(e)
        }), 500

    finally:
        if cursor is not None:
            cursor.close()
        if conn is not None:
            conn.close()  


@app.route('/api/passes', methods=['GET'])
def get_passes():
    try:
        # Authenticate the user
        token = request.headers.get('X-OBSERVATORY-AUTH')
        if not token or token not in tokens:
            return jsonify({"status": "failed", "info": "Invalid or missing token"}), 401
        
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)
        
        # Fetch all passes
        cursor.execute("SELECT * FROM tollPasses")
        passes = cursor.fetchall()
        
        cursor.close()
        conn.close()
        
        return jsonify(passes), 200
    except Exception as e:
        logging.exception("An error occurred while fetching passes.")
        return jsonify({"status": "failed", "info": str(e)}), 500

# app.py (continued)

@app.route('/api/admin/tollstations', methods=['GET'])
def get_tollstations():
    try:
        # Authenticate the user
        token = request.headers.get('X-OBSERVATORY-AUTH')
        if not token or token not in tokens:
            return jsonify({"status": "failed", "info": "Invalid or missing token"}), 401
        
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)
        
        # Fetch all toll stations
        cursor.execute("SELECT * FROM tollStations")
        tollstations = cursor.fetchall()
        
        cursor.close()
        conn.close()
        
        return jsonify(tollstations), 200
    except Exception as e:
        logging.exception("An error occurred while fetching toll stations.")
        return jsonify({"status": "failed", "info": str(e)}), 500


# Εκκίνηση της εφαρμογής
#if __name__ == '__main__':
#    app.run(port=9115,ssl_context=('new_cert.pem', 'new_key.pem'))
if __name__ == '__main__':
    app.run(
        host='0.0.0.0',  # Επιτρέπει τη σύνδεση από οποιαδήποτε διεύθυνση
        port=9115,
        ssl_context=('new_cert.pem', 'new_key.pem')  # Καθορίζει τα πιστοποιητικά για HTTPS
    )
