# Générateur aléatoire de phrases gramaticalements correctes

## Lancer l'application

- Créer et remplir le fichier `.env`. (.env.dev ou .env.production)

- Lancer l'application :
```shell
#Développement
$ docker-compose up --build

#Debug
$ docker-compose -f docker-compose.yml -f docker-compose.debug.yml up --build

#Linter
$ docker-compose -f docker-compose.yml -f docker-compose.debug.yml run ra_pha npm run lint

#Production
$ docker-compose -f docker-compose.yml -f docker-compose.production.yml up --build
```
