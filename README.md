# Générateur aléatoire de phrases gramaticalements correctes

## Lancer l'application

- Créer et remplir le fichier `.env`. (.env.dev ou .env.production)

- Lancer l'application :
```shell
#Développement
$ docker-compose --build up

#Debug
$ docker-compose --build -f docker-compose.yml -f docker-compose.debug.yml up

#Production
$ docker-compose --build -f docker-compose.yml -f docker-compose.production.yml up
```
