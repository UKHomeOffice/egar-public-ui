public_ui_ip=`sudo docker inspect -f "{{ .NetworkSettings.IPAddress }}" public-ui`

echo "Updating ./.vscode/launch.json to include the public-ui address '\"address\": \"$public_ui_ip\"'"

sed_exec="sudo sed -i -e 's/\"address\".*\"/\"address\": \"$public_ui_ip\"/g' ./.vscode/launch.json"

echo "$sed_exec"
eval $sed_exec
