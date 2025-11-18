#!/bin/bash
# Este script se ejecuta después del deploy en Elastic Beanstalk
# Sobrescribe la configuración de Nginx para aceptar archivos grandes

echo "client_max_body_size 100M;" > /etc/nginx/conf.d/proxy.conf

# Reinicia Nginx para aplicar la configuración
service nginx restart
