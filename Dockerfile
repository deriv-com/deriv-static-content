# Use an official nginx
FROM nginx:alpine

# Copy the build folder to html hosting path 
COPY . /usr/share/nginx/html
COPY ./static.deriv.app.conf /etc/nginx/conf.d/default.conf
