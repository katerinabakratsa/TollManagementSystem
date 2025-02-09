python se2424.py logout
read -r -p "Press Enter to continue..."
python se2424.py login --username [your username] --passw [your password]
read -r -p "Press Enter to continue..."
python se2424.py healthcheck
read -r -p "Press Enter to continue..."
python se2424.py resetpasses
read -r -p "Press Enter to continue..."
python se2424.py healthcheck
read -r -p "Press Enter to continue..."
python se2424.py resetstations
read -r -p "Press Enter to continue..."
python se2424.py healthcheck
read -r -p "Press Enter to continue..."
python se2424.py admin --addpasses --source passes24.csv
read -r -p "Press Enter to continue..."
python se2424.py healthcheck
read -r -p "Press Enter to continue..."
python se2424.py tollstationpasses --station AM08 --from 20220121 --to 20220204 --format json
read -r -p "Press Enter to continue..."
python se2424.py tollstationpasses --station NAO04 --from 20220121 --to 20220204 --format csv
read -r -p "Press Enter to continue..."
python se2424.py tollstationpasses --station NO01 --from 20220121 --to 20220204 --format csv
read -r -p "Press Enter to continue..."
python se2424.py tollstationpasses --station OO03 --from 20220121 --to 20220204 --format csv
read -r -p "Press Enter to continue..."
python se2424.py tollstationpasses --station XXX --from 20220121 --to 20220204 --format csv
read -r -p "Press Enter to continue..."
python se2424.py tollstationpasses --station OO03 --from 20220121 --to 20220204 --format YYY
read -r -p "Press Enter to continue..."
python se2424.py errorparam --station OO03 --from 20220121 --to 20220204 --format csv
read -r -p "Press Enter to continue..."
python se2424.py tollstationpasses --station AM08 --from 20220122 --to 20220202 --format json
read -r -p "Press Enter to continue..."
python se2424.py tollstationpasses --station NAO04 --from 20220122 --to 20220202 --format csv
read -r -p "Press Enter to continue..."
python se2424.py tollstationpasses --station NO01 --from 20220122 --to 20220202 --format csv
read -r -p "Press Enter to continue..."
python se2424.py tollstationpasses --station OO03 --from 20220122 --to 20220202 --format csv
read -r -p "Press Enter to continue..."
python se2424.py tollstationpasses --station XXX --from 20220122 --to 20220202 --format csv
read -r -p "Press Enter to continue..."
python se2424.py tollstationpasses --station OO03 --from 20220122 --to 20220202 --format YYY
read -r -p "Press Enter to continue..."
python se2424.py passanalysis --stationop AM --tagop NAO --from 20220121 --to 20220204 --format json
read -r -p "Press Enter to continue..."
python se2424.py passanalysis --stationop NAO --tagop AM --from 20220121 --to 20220204 --format csv
read -r -p "Press Enter to continue..."
python se2424.py passanalysis --stationop NO --tagop OO --from 20220121 --to 20220204 --format csv
read -r -p "Press Enter to continue..."
python se2424.py passanalysis --stationop OO --tagop KO --from 20220121 --to 20220204 --format csv
read -r -p "Press Enter to continue..."
python se2424.py passanalysis --stationop XXX --tagop KO --from 20220121 --to 20220204 --format csv
read -r -p "Press Enter to continue..."
python se2424.py passanalysis --stationop AM --tagop NAO --from 20220122 --to 20220202 --format json
read -r -p "Press Enter to continue..."
python se2424.py passanalysis --stationop NAO --tagop AM --from 20220122 --to 20220202 --format csv
read -r -p "Press Enter to continue..."
python se2424.py passanalysis --stationop NO --tagop OO --from 20220122 --to 20220202 --format csv
read -r -p "Press Enter to continue..."
python se2424.py passanalysis --stationop OO --tagop KO --from 20220122 --to 20220202 --format csv
read -r -p "Press Enter to continue..."
python se2424.py passanalysis --stationop XXX --tagop KO --from 20220122 --to 20220202 --format csv
read -r -p "Press Enter to continue..."
python se2424.py passescost --stationop AM --tagop NAO --from 20220121 --to 20220204 --format json
read -r -p "Press Enter to continue..."
python se2424.py passescost --stationop NAO --tagop AM --from 20220121 --to 20220204 --format csv
read -r -p "Press Enter to continue..."
python se2424.py passescost --stationop NO --tagop OO --from 20220121 --to 20220204 --format csv
read -r -p "Press Enter to continue..."
python se2424.py passescost --stationop OO --tagop KO --from 20220121 --to 20220204 --format csv
read -r -p "Press Enter to continue..."
python se2424.py passescost --stationop XXX --tagop KO --from 20220121 --to 20220204 --format csv
read -r -p "Press Enter to continue..."
python se2424.py passescost --stationop AM --tagop NAO --from 20220122 --to 20220202 --format json
read -r -p "Press Enter to continue..."
python se2424.py passescost --stationop NAO --tagop AM --from 20220122 --to 20220202 --format csv
read -r -p "Press Enter to continue..."
python se2424.py passescost --stationop NO --tagop OO --from 20220122 --to 20220202 --format csv
read -r -p "Press Enter to continue..."
python se2424.py passescost --stationop OO --tagop KO --from 20220122 --to 20220202 --format csv
read -r -p "Press Enter to continue..."
python se2424.py passescost --stationop XXX --tagop KO --from 20220122 --to 20220202 --format csv
read -r -p "Press Enter to continue..."
python se2424.py chargesby --opid NAO --from 20220121 --to 20220204 --format json
read -r -p "Press Enter to continue..."
python se2424.py chargesby --opid GE --from 20220121 --to 20220204 --format csv
read -r -p "Press Enter to continue..."
python se2424.py chargesby --opid OO --from 20220121 --to 20220204 --format csv
read -r -p "Press Enter to continue..."
python se2424.py chargesby --opid KO --from 20220121 --to 20220204 --format csv
read -r -p "Press Enter to continue..."
python se2424.py chargesby --opid NO --from 20220121 --to 20220204 --format csv
read -r -p "Press Enter to continue..."
python se2424.py chargesby --opid NAO --from 20220122 --to 20220202 --format json
read -r -p "Press Enter to continue..."
python se2424.py chargesby --opid GE --from 20220122 --to 20220202 --format csv
read -r -p "Press Enter to continue..."
python se2424.py chargesby --opid OO --from 20220122 --to 20220202 --format csv
read -r -p "Press Enter to continue..."
python se2424.py chargesby --opid KO --from 20220122 --to 20220202 --format csv
read -r -p "Press Enter to continue..."
python se2424.py chargesby --opid NO --from 20220122 --to 20220202 --format csv
read -r -p "Press Enter to continue..."