# 🛠 Toll Management Backend

##  Project Description
The **Toll Management Backend** is a Flask-based REST API that manages toll station data, vehicle crossings, and financial transactions between different toll operators. It connects to a **MySQL database** and provides JSON and CSV responses for interoperability.

---

## 🛠 Technologies Used
- **Framework:** Flask (Python)
- **Database:** MySQL
- **Data Formats:** JSON, CSV
- **Security:** HTTPS with self-signed certificate
- **Testing:** Postman

---

##  Installation Guide

### 🔹 **1. Clone the Repository**
```bash
git clone https://github.com/ntua/softeng24-24.git
cd softeng24-24/back-end
```

### 🔹 **2. Setup the Database**
#### **Create the MySQL Database**
Open MySQL:
```bash
mysql -u root -p
```

```bash
Create the database:
```

```bash
CREATE DATABASE toll_management;
EXIT;
```

Import the provided database schema and initial data:

```bash
mysql -u root -p toll_management < backend/data_dump.sql
```

This will create all necessary tables and insert sample data.

### 🔹 **3. Install Dependencies**
Ensure you have Python installed, then install required dependencies:
```bash
pip install -r requirements.txt
```


### 🔹 **4. Run the Backend Server**
```bash
python app.py
```
The API will be available at:
🔗 `https://localhost:9115/api`

---

## 🛠 **Important Configurations**
1. **Using HTTPS with a self-signed SSL certificate**
   - The API must run over HTTPS.
   - Use `ssl_context=('cert.pem', 'key.pem')` in Flask.

2. **Database Connection**
   - Ensure the MySQL server is running before launching the backend.



