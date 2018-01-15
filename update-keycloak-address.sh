keycloak_ip=`sudo docker inspect -f "{{ .NetworkSettings.IPAddress }}" keycloak`
sed_exec=''
echo "Updating /etc/hosts to include '$keycloak_ip keycloak'"

if grep -q keycloak /etc/hosts; then
    sed_exec="sudo sed -i -e 's/.* keycloak/$keycloak_ip keycloak/' /etc/hosts"
else 
    sed_exec="sudo sed -i -e '1 s/^/$keycloak_ip keycloak\n/' /etc/hosts"
fi

eval $sed_exec
