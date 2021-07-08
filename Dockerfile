#####################
#		Base		#
#####################
FROM node:12.18-alpine as base

WORKDIR /usr/src/app

# Installing dependencies
COPY ["package.json", "package-lock.json*", "npm-shrinkwrap.json*", "./"]
RUN npm install && mv node_modules ../

# With docker-compose, this copy will be overrindden by volume.
COPY . .

# With docker-compose, this port will be overridden.
EXPOSE 3000

# With docker-compose, this entry point will be overridden.
CMD ["npm", "start"]

#####################
#		Dev			#
#####################
FROM base as dev

ENV NODE_ENV=development

# Installing dev dependencies
RUN npm install -g nodemon
RUN npm install -g eslint

# With docker-compose, this port will be overridden.
EXPOSE 3000 9229

# With docker-compose, this entry point will be overridden.
CMD ["npm", "run", "debug"]


#####################
#	Production		#
#####################
FROM base as production

ENV NODE_ENV=production

# With docker-compose, this port will be overridden.
EXPOSE 3000

# With docker-compose, this entry point will be overridden.
CMD ["npm", "run", "start"]
