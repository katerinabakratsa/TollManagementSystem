from flask import Flask, jsonify, request, make_response
import mysql.connector
import csv
import uuid
from werkzeug.utils import secure_filename  # Ασφαλής αποθήκευση αρχείων
from collections import OrderedDict
from datetime import datetime
from flask import redirect



app = Flask(__name__)
@app.before_request
def enforce_https():
    if request.url.startswith('http://'):
        url = request.url.replace('http://', 'https://', 1)
        return redirect(url, code=301)

# Σύνδεση με τη βάση δεδομένων
def get_db_connection():
    return mysql.connector.connect(
        host="localhost",  # Δημόσια IP της βάσης
        port=3006,
        user="root",       # Username της MySQL
        password="Ddffgg456",   # Password της MySQL
        database="toll_management",  # Όνομα της βάσης
        charset="utf8mb4"
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
            # Δημιουργία passID από timestamp και tollID
            timestamp_str = p['timestamp'].strftime('%Y%m%d%H%M%S')
            pass_id = f"{timestamp_str}_{stationID}"

            # Υπολογισμός passType
            pass_type = "Home" if p['tagHomeID'] == station_opid else "Visitor"
            
            
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

            # Δημιουργία εγγραφής για κάθε διέλευση
            pass_list.append(OrderedDict([
                ("passIndex", index),
                ("passID", pass_id),
                ("timestamp", p['timestamp'].strftime('%Y-%m-%d %H:%M:%S')),
                ("tagID", p['tagID']),
                ("tagProvider", p['tagHomeID']),  # tagProvider = tagHomeID
                ("passType", pass_type),
                ("passCharge", p['charge'])
            ]))



        # Επιστροφή αποτελέσματος στην επιθυμητή μορφή
        format_type = request.args.get("format", "json")
        return format_response([response], format_type)

    except Exception as e:
        return jsonify({
            "status": "failed",
            "info": str(e)
        }), 500
    finally:
        cursor.close()
        conn.close()


@app.route('/api/passAnalysis/stationOpID/<stationOpID>/tagOpID/<tagOpID>/date_from/<from_date>/date_to/<to_date>', methods=['GET'])
def pass_analysis(stationOpID, tagOpID, from_date, to_date):
   
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

        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)

        # Έλεγχος αν υπάρχει ο operator του σταθμού στον πίνακα tollStations
        cursor.execute(
            "SELECT 1 FROM tollStations WHERE OpID = %s",
            (stationOpID,)
        )
        station = cursor.fetchone()
        if not station:
            return jsonify({
                "status": "failed",
                "info": "Station operator not found"
            }), 404
        
       

        # Ανάκτηση διελεύσεων
        cursor.execute("""
           SELECT 
            p.timestamp,
            p.tagRef AS tagID,
            p.tollID AS stationID,
            p.charge AS passCharge
        FROM tollPasses p
        INNER JOIN tollStations s ON p.tollID = s.TollID
        WHERE p.tagHomeID = %s 
        AND s.OpID = %s
        AND DATE(p.timestamp) BETWEEN %s AND %s
        ORDER BY p.timestamp ASC
        """, (tagOpID, stationOpID, from_date_formatted, to_date_formatted))


        
        passes = cursor.fetchall()
        pass_list = []

        # Δημιουργία λίστας διελεύσεων
        for index, p in enumerate(passes, start=1):
            # Δημιουργία passID από timestamp και stationID
            timestamp_str = p['timestamp'].strftime('%Y%m%d%H%M%S')
            pass_id = f"{timestamp_str}_{p['stationID']}"

            # Δημιουργία εγγραφής για κάθε διέλευση
            pass_list.append({
                "passIndex": index,
                "passID": pass_id,
                "stationID": p['stationID'],
                "timestamp": p['timestamp'].strftime('%Y-%m-%d %H:%M:%S'),
                "tagID": p['tagID'],
                "passCharge": float(p['passCharge'])
            })


        # Δημιουργία απάντησης
        response = {
            "stationOpID": stationOpID,
            "tagOpID": tagOpID,
            "requestTimestamp": datetime.now().strftime('%Y-%m-%d %H:%M:%S'),
            "periodFrom": from_date_formatted,
            "periodTo": to_date_formatted,
            "nPasses": len(pass_list),
            "passList": pass_list
        }

        # Επιστροφή αποτελέσματος στην επιθυμητή μορφή
        format_type = request.args.get("format", "json")
        return format_response([response], format_type)
    
    

    except Exception as e:
        return jsonify({
            "status": "failed",
            "info": str(e)
        }), 500
    
    

    finally:
        cursor.close()
        conn.close()



# Εκκίνηση της εφαρμογής
if __name__ == '__main__':
    app.run(port=9115,ssl_context=('cert.pem', 'key.pem'))


