package com.example.auth;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

/**
 * Point d'entrée principal de l'application Spring Boot.
 *
 * Cette application est un service d'authentification autonome qui implémente
 * un protocole HMAC challenge-response pour ne jamais exposer le mot de passe
 * en clair sur le réseau, même en cas d'interception du trafic.
 *
 * Le flux d'authentification est :
 *  1. Le client demande un nonce serveur (random + timestamp).
 *  2. Le client calcule un proof = HMAC(password_derivé, nonce_serveur + nonce_client).
 *  3. Le serveur recalcule le proof attendu et vérifie l'égalité.
 *  4. En cas de succès, un JWT est émis.
 *
 * Le projet est totalement indépendant du backend Laravel SkillHub : il a sa
 * propre base MySQL et son propre cycle de vie. Il sert de "preuve de concept"
 * pour la soutenance sur la sécurité d'authentification avancée.
 *
 * Annotation @SpringBootApplication : combine @Configuration, @EnableAutoConfiguration
 * et @ComponentScan pour démarrer Spring Boot avec la configuration par défaut.
 *
 * @author Poun
 * @version 1.0
 */
@SpringBootApplication
public class AuthApplication {

    /**
     * Méthode main de lancement de l'application Spring Boot.
     * SpringApplication.run amorce le contexte Spring, démarre Tomcat embarqué,
     * lit application.properties et expose les endpoints sur le port défini
     * (8000 par défaut, voir application.properties).
     *
     * @param args arguments CLI passés au démarrage (rarement utilisés ici)
     */
    public static void main(String[] args) {
        SpringApplication.run(AuthApplication.class, args);
    }
}
