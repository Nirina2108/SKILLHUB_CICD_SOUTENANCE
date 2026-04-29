package com.example.auth.controller;

import com.example.auth.entity.User;
import com.example.auth.service.TokenService;
import com.example.auth.repository.UserRepository;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * Contrôleur REST pour la consultation des autres utilisateurs.
 *
 * Sert principalement à alimenter une éventuelle messagerie / interface
 * de sélection de contacts : un utilisateur connecté peut récupérer la
 * liste des autres utilisateurs (sans son propre profil).
 *
 * Endpoint protégé par token Bearer : la validité est vérifiée via TokenService
 * (qui consulte le champ token+token_expires_at de l'entité User en base).
 *
 * @author Nirina
 * @version 1.1
 */
@RestController
@RequestMapping("/api")
public class UserController {

    /** Repository utilisateur. */
    private final UserRepository userRepository;

    /** Service de validation du token. */
    private final TokenService tokenService;

    /**
     * Constructeur.
     *
     * @param userRepository repository utilisateur
     * @param tokenService service token
     */
    public UserController(UserRepository userRepository, TokenService tokenService) {
        this.userRepository = userRepository;
        this.tokenService = tokenService;
    }

    /**
     * Retourne la liste de tous les utilisateurs.
     * Necessite un token Bearer valide.
     *
     * @param authorizationHeader header Authorization
     * @return liste des utilisateurs
     */
    @GetMapping("/users")
    public Object getUsers(
            @RequestHeader(value = "Authorization", required = false) String authorizationHeader
    ) {
        Map<String, Object> error = new HashMap<>();

        User requester = tokenService.getUserFromToken(authorizationHeader);

        if (requester == null) {
            error.put("error", "Token manquant, invalide ou expire");
            return error;
        }

        // Retourne tous les utilisateurs sauf le demandeur
        List<Map<String, Object>> users = new ArrayList<>();

        for (User u : userRepository.findAll()) {
            if (!u.getId().equals(requester.getId())) {
                Map<String, Object> userMap = new HashMap<>();
                userMap.put("id", u.getId());
                userMap.put("name", u.getName());
                userMap.put("email", u.getEmail());
                users.add(userMap);
            }
        }

        return users;
    }
}