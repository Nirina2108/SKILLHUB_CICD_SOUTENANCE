package com.example.auth.controller;

import com.example.auth.dto.ClientProofRequest;
import com.example.auth.dto.ClientProofResponse;
import com.example.auth.dto.LoginRequest;
import com.example.auth.dto.RegisterRequest;
import com.example.auth.service.AuthService;
import com.example.auth.service.ClientProofService;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import com.example.auth.dto.ChangePasswordRequest;

import java.util.Map;

/**
 * Contrôleur REST exposant l'API d'authentification basée sur HMAC challenge-response.
 *
 * Le flux de connexion sécurisé suit ces étapes :
 *  1. Le client appelle POST /client-proof avec email + password (en HTTPS)
 *     pour obtenir une "preuve" calculée localement (utilisé en démo).
 *  2. Le client envoie POST /login avec cette preuve, le serveur la vérifie
 *     en recalculant le HMAC attendu, puis émet un JWT en cas de succès.
 *  3. Le client appelle ensuite GET /me, POST /logout, PUT /change-password
 *     en passant le JWT dans l'en-tête Authorization.
 *
 * Endpoints :
 *  - POST /api/auth/register        : création de compte (envoie email de vérification)
 *  - GET  /api/auth/verify-email    : valide le token de vérification email
 *  - POST /api/auth/client-proof    : utilitaire de calcul de preuve côté client (démo)
 *  - POST /api/auth/login           : connexion via preuve HMAC, retourne un JWT
 *  - GET  /api/auth/me              : infos de l'utilisateur courant (lecture du JWT)
 *  - POST /api/auth/logout          : invalidation du JWT (blacklist)
 *  - PUT  /api/auth/change-password : changement de mot de passe (auth requise)
 *
 * @author Nirina
 * @version 1.0
 */
@RestController
@RequestMapping("/api/auth")
public class AuthController {

    /**
     * Service métier qui contient la logique d'authentification (validation
     * de la preuve, génération JWT, gestion des sessions, ...).
     */
    private final AuthService authService;

    /**
     * Service utilitaire qui SIMULE le calcul de preuve côté client.
     * En production réelle, ce calcul serait effectué dans le navigateur ou
     * l'app mobile pour ne jamais transmettre le mot de passe en clair.
     * Ici on l'expose côté serveur pour faciliter les démos et tests.
     */
    private final ClientProofService clientProofService;

    /**
     * Injection par constructeur (recommandé en Spring pour faciliter les tests
     * et garantir l'immutabilité des dépendances).
     */
    public AuthController(AuthService authService, ClientProofService clientProofService) {
        this.authService = authService;
        this.clientProofService = clientProofService;
    }

    /**
     * Inscription d'un nouvel utilisateur.
     * Sauvegarde le compte en base avec mot de passe haché (BCrypt) et envoie
     * un email contenant un lien de vérification (token unique).
     *
     * @param request payload contenant nom, email, password
     * @return JSON avec message de succès ou erreur de validation
     */
    @PostMapping("/register")
    public Map<String, Object> register(@RequestBody RegisterRequest request) {
        return authService.register(request);
    }

    /**
     * Validation de l'email après inscription.
     * Endpoint appelé par le lien que l'utilisateur clique dans son email.
     *
     * @param token token UUID généré à l'inscription
     * @return JSON avec message de succès ou expiration
     */
    @GetMapping("/verify-email")
    public Map<String, Object> verifyEmail(@RequestParam String token) {
        return authService.verifyEmail(token);
    }

    /**
     * Endpoint démo : calcule la preuve HMAC côté serveur à partir du
     * couple (email, password) pour faciliter les tests Postman / curl.
     * En production réelle, ce calcul est fait uniquement côté client.
     *
     * @param request payload contenant email et password
     * @return preuve complète (nonce client, timestamp, hmac)
     */
    @PostMapping("/client-proof")
    public ClientProofResponse buildClientProof(@RequestBody ClientProofRequest request) {
        return clientProofService.buildProof(request);
    }

    /**
     * Connexion avec preuve HMAC.
     * Le serveur recalcule la preuve attendue à partir du mot de passe stocké
     * (en HMAC-SHA256 avec le nonce serveur) et compare. Si égales, un JWT est émis.
     *
     * @param request payload contenant email et la preuve HMAC du client
     * @return JSON contenant le JWT et les infos utilisateur, ou erreur 401
     */
    @PostMapping("/login")
    public Map<String, Object> login(@RequestBody LoginRequest request) {
        return authService.login(request);
    }

    /**
     * Endpoint pour recuperer l utilisateur connecte.
     *
     * @param authorizationHeader header Authorization
     * @return infos utilisateur
     */
    @GetMapping("/me")
    public Map<String, Object> me(
            @RequestHeader(value = "Authorization", required = false) String authorizationHeader
    ) {
        return authService.getMe(authorizationHeader);
    }

    /**
     * Endpoint de deconnexion.
     *
     * @param authorizationHeader header Authorization
     * @return message de deconnexion
     */
    @PostMapping("/logout")
    public Map<String, Object> logout(
            @RequestHeader(value = "Authorization", required = false) String authorizationHeader
    ) {
        return authService.logout(authorizationHeader);
    }

    /**
     * Change le mot de passe de l utilisateur connecte.
     *
     * @param authorizationHeader header Authorization avec Bearer token
     * @param request ancien et nouveau mot de passe
     * @return reponse JSON
     */
    @PutMapping("/change-password")
    public Map<String, Object> changePassword(
            @RequestHeader("Authorization") String authorizationHeader,
            @RequestBody ChangePasswordRequest request) {
        return authService.changePassword(authorizationHeader, request);
    }
}