package com.example.auth.exception;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

/**
 * Gestionnaire global d'exceptions appliqué à TOUS les contrôleurs REST.
 *
 * Annotation @RestControllerAdvice : Spring intercepte les exceptions levées
 * dans n'importe quel contrôleur et passe par les @ExceptionHandler de cette
 * classe avant de retourner une réponse au client. Cela évite de devoir
 * gérer les try/catch dans chaque méthode de contrôleur.
 *
 * Aujourd'hui : un seul handler pour les RuntimeException qui retourne 400
 * avec le message de l'exception. À étendre selon les besoins (validation,
 * authentification, autorisation, ressource introuvable, ...).
 */
@RestControllerAdvice
public class GlobalExceptionHandler {

    /**
     * Capture toutes les RuntimeException non gérées spécifiquement et les
     * transforme en réponse JSON 400 Bad Request avec le message d'erreur.
     *
     * @param ex exception capturée
     * @return JSON contenant la clé "error" avec le message lisible
     */
    @ExceptionHandler(RuntimeException.class)
    @ResponseStatus(HttpStatus.BAD_REQUEST)
    public Map<String, Object> handleRuntimeException(RuntimeException ex) {

        Map<String, Object> response = new HashMap<>();
        response.put("error", ex.getMessage());

        return response;
    }
}