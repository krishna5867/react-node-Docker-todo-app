FROM node:22.12.0 as build

WORKDIR /app
COPY package*.json ./
RUN npm install

# COPY package*.json ./
# RUN npm install

COPY . .
# RUN npm run build

# FROM nginx:alpine
# COPY nginx.conf /etc/nginx/conf.d/default.conf
# COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 3000

CMD ["npm", "run", "dev"]