FROM node:8
WORKDIR /app
ENV METEOR_ALLOW_SUPERUSER=true
ADD . .
RUN curl "https://install.meteor.com/" | sh
EXPOSE 3000
WORKDIR /app/
CMD ["meteor"]