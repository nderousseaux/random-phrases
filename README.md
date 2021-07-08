# Générateur aléatoire de phrases gramaticalements correctes

## Lancer l'application

- Créer et remplir le fichier `.env`. (.env.dev ou .env.production)

- Lancer l'application :
```shell
#Développement
$ docker-compose --build up

#Debug
$ docker-compose --build -f docker-compose.yml -f docker-compose.debug.yml up

#Linter
$ docker-compose --build -f docker-compose.yml -f docker-compose.debug.yml run ra_pha npm run lint

#Production
$ docker-compose --build -f docker-compose.yml -f docker-compose.production.yml up
```
