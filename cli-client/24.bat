@echo off
echo Running CLI tests...

:: Μετακίνηση στον φάκελο του CLI
cd /d C:\Users\USER\Desktop\TL\tollsystem\softeng24-24\cli-client

:: Logout & Login
python se2424.py logout
pause
python se2424.py login --username admin --passw freepasses4all
pause
python se2424.py healthcheck
pause

:: Reset passes & stations
python se2424.py resetpasses
pause
python se2424.py healthcheck
pause
python se2424.py resetstations
pause
python se2424.py healthcheck
pause

:: Προσθήκη αρχείου διελεύσεων
python se2424.py addpasses --source passes24.csv
pause
python se2424.py healthcheck
pause

:: ==========================================
:: TOLL STATION PASSES QUERIES
:: ==========================================
:: CLI code:
:: endpoint = f"tollStationPasses/tollStationID/{station}/date_from/{from_date}/date_to/{to_date}"

python se2424.py tollstationpasses --station AM08 --from_date 20220121 --to_date 20220204 --format json
pause
python se2424.py tollstationpasses --station NAO04 --from_date 20220121 --to_date 20220204 --format csv
pause
python se2424.py tollstationpasses --station NO01 --from_date 20220121 --to_date 20220204 --format csv
pause
python se2424.py tollstationpasses --station OO03 --from_date 20220121 --to_date 20220204 --format csv
pause
python se2424.py tollstationpasses --station XXX --from_date 20220121 --to_date 20220204 --format csv
pause

:: Άγνωστη εντολή: errorparam
python se2424.py errorparam --station OO03 --from_date 20220121 --to_date 20220204 --format csv
pause

python se2424.py tollstationpasses --station AM08 --from_date 20220122 --to_date 20220202 --format json
pause
python se2424.py tollstationpasses --station NAO04 --from_date 20220122 --to_date 20220202 --format csv
pause
python se2424.py tollstationpasses --station NO01 --from_date 20220122 --to_date 20220202 --format csv
pause
python se2424.py tollstationpasses --station OO03 --from_date 20220122 --to_date 20220202 --format csv
pause
python se2424.py tollstationpasses --station XXX --from_date 20220122 --to_date 20220202 --format csv
pause
python se2424.py tollstationpasses --station OO03 --from_date 20220122 --to_date 20220202 --format YYY
pause

:: ==========================================
:: PASS ANALYSIS QUERIES
:: ==========================================
:: CLI code:
:: endpoint = f"passAnalysis/stationOpID/{stationop}/tagOpID/{tagop}/date_from/{from_date}/date_to/{to_date}"

python se2424.py passanalysis --stationop AM --tagop NAO --from_date 20220121 --to_date 20220204 --format json
pause
python se2424.py passanalysis --stationop NAO --tagop AM --from_date 20220121 --to_date 20220204 --format csv
pause
python se2424.py passanalysis --stationop NO --tagop OO --from_date 20220121 --to_date 20220204 --format csv
pause
python se2424.py passanalysis --stationop OO --tagop KO --from_date 20220121 --to_date 20220204 --format csv
pause
python se2424.py passanalysis --stationop XXX --tagop KO --from_date 20220121 --to_date 20220204 --format csv
pause

python se2424.py passanalysis --stationop AM --tagop NAO --from_date 20220122 --to_date 20220202 --format json
pause
python se2424.py passanalysis --stationop NAO --tagop AM --from_date 20220122 --to_date 20220202 --format csv
pause
python se2424.py passanalysis --stationop NO --tagop OO --from_date 20220122 --to_date 20220202 --format csv
pause
python se2424.py passanalysis --stationop OO --tagop KO --from_date 20220122 --to_date 20220202 --format csv
pause
python se2424.py passanalysis --stationop XXX --tagop KO --from_date 20220122 --to_date 20220202 --format csv
pause

:: ==========================================
:: PASSES COST QUERIES
:: ==========================================
:: CLI code:
:: endpoint = f"passesCost/{stationop}/{tagop}/{from_date}/{to_date}"

python se2424.py passescost --stationop "tollOpID/AM" --tagop "tagOpID/NAO" --from_date "date_from/20220121" --to_date "date_to/20220204" --format json
pause
python se2424.py passescost --stationop "tollOpID/NAO" --tagop "tagOpID/AM" --from_date "date_from/20220121" --to_date "date_to/20220204" --format csv
pause
python se2424.py passescost --stationop "tollOpID/NO" --tagop "tagOpID/OO" --from_date "date_from/20220121" --to_date "date_to/20220204" --format csv
pause
python se2424.py passescost --stationop "tollOpID/OO" --tagop "tagOpID/KO" --from_date "date_from/20220121" --to_date "date_to/20220204" --format csv
pause
python se2424.py passescost --stationop "tollOpID/XXX" --tagop "tagOpID/KO" --from_date "date_from/20220121" --to_date "date_to/20220204" --format csv
pause

python se2424.py passescost --stationop "tollOpID/AM" --tagop "tagOpID/NAO" --from_date "date_from/20220122" --to_date "date_to/20220202" --format json
pause
python se2424.py passescost --stationop "tollOpID/NAO" --tagop "tagOpID/AM" --from_date "date_from/20220122" --to_date "date_to/20220202" --format csv
pause

:: ==========================================
:: CHARGES QUERIES
:: ==========================================
:: Flask route: /api/chargesBy/tollOpID/<tollOpID>/date_from/<from_date>/date_to/<to_date>

python se2424.py chargesby --opid NAO --from_date 20220121 --to_date 20220204 --format json
pause
python se2424.py chargesby --opid GE --from_date 20220121 --to_date 20220204 --format csv
pause
python se2424.py chargesby --opid OO --from_date 20220121 --to_date 20220204 --format csv
pause
python se2424.py chargesby --opid KO --from_date 20220121 --to_date 20220204 --format csv
pause
python se2424.py chargesby --opid NO --from_date 20220121 --to_date 20220204 --format csv
pause

echo All commands executed successfully!
pause
