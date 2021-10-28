# Use an official nginx
FROM nginx:alpine

# Copy the build folder to html hosting path 
COPY . /usr/share/nginx/html
RUN mv /usr/share/nginx/html/static.deriv.com.conf /etc/nginx/conf.d/default.conf
