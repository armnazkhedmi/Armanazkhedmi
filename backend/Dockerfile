FROM node:20-alpine
WORKDIR /app
COPY package.json ./
COPY backend/package.json ./backend/package.json
RUN npm install --omit=dev --workspace @armnaz/backend
COPY backend/src ./backend/src
COPY database ./database
EXPOSE 8080
CMD ["npm","--workspace","@armnaz/backend","start"]
