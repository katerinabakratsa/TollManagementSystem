import unittest
from unittest.mock import patch
import se2424  # Εισάγουμε το CLI script ως Python module

class TestCLI(unittest.TestCase):

    @patch('se2424.login')  # Mockάρουμε το API login request
    def test_login_function(self, mock_login):
        """Τεστάρει τη συνάρτηση login() του CLI χωρίς subprocess"""
        mock_login.return_value = "mocked-token"  # Προσομοίωση API απάντησης

        result = se2424.login("admin", "freepasses4all")  # Καλούμε τη login() απευθείας
        self.assertEqual(result, "mocked-token")  # Πρέπει να επιστρέψει το token

    @patch('se2424.logout')
    def test_logout_function(self, mock_logout):
        """Τεστάρει τη συνάρτηση logout() του CLI"""
        mock_logout.return_value = "Logout successful."

        result = se2424.logout()  # Καλούμε τη logout() απευθείας
        self.assertEqual(result, "Logout successful.")

    @patch('se2424.healthcheck')  
    def test_healthcheck_function(self, mock_healthcheck):
        """Τεστάρει τη healthcheck() του CLI"""
        mock_healthcheck.return_value = {"dbconnection": "connected"}

        result = se2424.healthcheck()
        self.assertEqual(result, {"dbconnection": "connected"})

    @patch('se2424.toll_station_passes')
    def test_toll_station_passes_function(self, mock_toll_station_passes):
        """Τεστάρει την ανάκτηση διελεύσεων από σταθμό"""
        mock_toll_station_passes.return_value = {"nPasses": 5}

        result = se2424.toll_station_passes("NAO30", "20220101", "20220131")
        self.assertEqual(result["nPasses"], 5)

    @patch('se2424.pass_analysis')
    def test_pass_analysis_function(self, mock_pass_analysis):
        """Τεστάρει την ανάλυση διελεύσεων"""
        mock_pass_analysis.return_value = {"nPasses": 10}

        result = se2424.pass_analysis("AM", "EG", "20220101", "20230101")
        self.assertEqual(result["nPasses"], 10)

    @patch('se2424.passes_cost')
    def test_passes_cost_function(self, mock_passes_cost):
        """Τεστάρει το κόστος διελεύσεων"""
        mock_passes_cost.return_value = {"passesCost": 150.5}

        result = se2424.passes_cost("NAO", "EG", "20220101", "20220131")
        self.assertEqual(result["passesCost"], 150.5)

    @patch('se2424.charges_by')
    def test_charges_by_function(self, mock_charges_by):
        """Τεστάρει τις χρεώσεις από άλλους operators"""
        mock_charges_by.return_value = {"vOpList": [{"opid": "NAO", "nPasses": 3, "passesCost": 50.0}]}

        result = se2424.charges_by("NAO", "20220101", "20220131")
        self.assertEqual(result["vOpList"][0]["opid"], "NAO")

    @patch('se2424.reset_stations')
    def test_reset_stations_function(self, mock_reset_stations):
        """Τεστάρει την επαναφορά των σταθμών"""
        mock_reset_stations.return_value = "Stations reset successfully."

        result = se2424.reset_stations()
        self.assertEqual(result, "Stations reset successfully.")

    @patch('se2424.reset_passes')
    def test_reset_passes_function(self, mock_reset_passes):
        """Τεστάρει την επαναφορά των διελεύσεων"""
        mock_reset_passes.return_value = "Passes reset successfully."

        result = se2424.reset_passes()
        self.assertEqual(result, "Passes reset successfully.")

    @patch('se2424.add_passes')
    def test_add_passes_function(self, mock_add_passes):
        """Τεστάρει την προσθήκη διελεύσεων από CSV"""
        mock_add_passes.return_value = "Passes added successfully."

        result = se2424.add_passes("passes-sample.csv")
        self.assertEqual(result, "Passes added successfully.")

    @patch('se2424.list_users')
    def test_list_users_function(self, mock_list_users):
        """Τεστάρει την ανάκτηση λίστας χρηστών"""
        mock_list_users.return_value = [{"username": "admin"}, {"username": "user1"}]

        result = se2424.list_users()
        self.assertEqual(len(result), 2)
        self.assertEqual(result[0]["username"], "admin")

if __name__ == '__main__':
    unittest.main()
