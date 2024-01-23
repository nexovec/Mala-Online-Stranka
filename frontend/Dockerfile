# Step 1: Build the application
FROM node:21 AS builder
WORKDIR /app
COPY package.json package-lock.json ./
RUN yarn install
RUN npm install

COPY . .
RUN npm run build

# Step 2: Set up the production environment
FROM nginx:stable-alpine
COPY --from=builder /app/build /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 3000
CMD ["nginx", "-g", "daemon off;"]