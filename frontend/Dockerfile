FROM node
ENV NEXT_PUBLIC_MAPBOX_TOKEN=pk.eyJ1IjoiemlkYW5raGFyaXNtYSIsImEiOiJjbG8zemN5cWswMnBpMmpudXEyYWZta2M3In0.SnGCAMJEYUBkaGMwZCQMpA
ENV NEXT_PUBLIC_BACKEND_URL="http://localhost:8080"
ENV NEXT_PUBLIC_WS_URL="ws://localhost:8080"
WORKDIR /app
COPY package*.json ./
RUN npm i
COPY . .
EXPOSE 3000
CMD ["npm", "run", "dev"]
