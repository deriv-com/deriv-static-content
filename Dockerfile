# Use an official nginx
FROM nginx:alpine

# Copy the build folder to html hosting path 
COPY . /usr/share/nginx/html
