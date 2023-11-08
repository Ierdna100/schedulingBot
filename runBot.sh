# #!/bin/bash
# set -o pipefail

# while [ true ]
# do
	node app.js | tee -a ./outputlog.txt
	# echo $?
# done
sleep 86400
