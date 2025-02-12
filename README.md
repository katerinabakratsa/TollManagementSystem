# 🚦 Toll Management System

##  Project Description
The **Toll Management System** is a software application designed for managing toll interoperability. It facilitates data exchange for toll passages and financial transactions between different toll operators. The system consists of:
- **Backend (Flask, MySQL)**: Implements the REST API for data storage and retrieval.
- **CLI Client**: Allows interaction with the system via command-line interface.
- **Frontend (React with Vite)**: Provides a web interface for data visualization and management.

---

## 🛠 Technologies Used
- **Backend:** Python (Flask), MySQL
- **Frontend:** React (Vite), TailwindCSS
- **CLI Client:** Python 
- **Database:** MySQL
- **API Format:** RESTful, JSON, CSV
- **Testing:** Postman
- **HTTPS:** self-signed certificate

---

##  Installation Guide

###   Clone the Repository
```bash
git clone https://github.com/ntua/softeng24-24.git
cd softeng24-24
```

###   Setup Backend
#### Install dependencies
```bash
cd back-end
pip install -r requirements.txt
```

#### **Create and Connect to the Database**
```bash
mysql -u root -p
CREATE DATABASE toll_management;
```

#### **Run the Backend (Flask)**
```bash
python app.py
```
The API will be available at:  
🔗 `https://localhost:9115/api`

---

### 🔹 **3. Setup Frontend**
#### Install dependencies
```bash
cd ../frontend
npm install
```

#### **Run the Frontend**
```bash
npm run dev
```
The frontend will be available at:  
🔗 `https://localhost:5173/`
---

### 🔹 **4. Using the CLI Client**
The CLI client allows interaction with the API via terminal.
```bash
cd ../cli-client
python se2424.py
```
#### 📌 **Example Command**
```bash
python cli.py tollstationpasses --station NAO01 --from 20240101 --to 20240131
```

---


## 🛠 **Important Configurations**
1. **Using HTTPS with a self-signed SSL certificate**
   - The API must run over HTTPS.
   - Use `ssl_context=('cert.pem', 'key.pem')` in Flask.

---
## TEAM MEMBERS
Antonis Adamidis
Fany Kalogianni
Katerina Bakratsa
Alexandra Moraitaki
Thanasis Tsiatouras

---
