package com.example.auth.controller;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * Contrôleur de health-check minimal.
 *
 * Sert à vérifier rapidement (curl, navigateur, monitoring) que l'application
 * Spring Boot a démarré correctement et que le serveur HTTP répond. Utile
 * dans le contexte CI/CD pour confirmer qu'un container Docker est sain
 * avant de lui envoyer du trafic réel.
 */
@RestController
public class HomeController {

    /**
     * Endpoint racine de l'application.
     *
     * @return message texte plain confirmant que le service est opérationnel
     */
    @GetMapping("/")
    public String home() {
        return "TP_5 Docker et GitHub Actions fonctionne";
    }
}