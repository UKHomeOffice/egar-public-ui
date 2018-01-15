workflow_api_proxy_ip=`sudo docker inspect -f "{{ .NetworkSettings.IPAddress }}" workflow-api-proxy`
sed_exec=''
echo "Updating /etc/hosts to include '$workflow_api_proxy_ip workflow-api-proxy'"

if grep -q keycloak /etc/hosts; then
    sed_exec="sudo sed -i -e 's/.* workflow-api-proxy/$workflow_api_proxy_ip workflow-api-proxy/' /etc/hosts"
else 
    sed_exec="sudo sed -i -e '1 s/^/$workflow_api_proxy_ip workflow-api-proxy\n/' /etc/hosts"
fi

eval $sed_exec
