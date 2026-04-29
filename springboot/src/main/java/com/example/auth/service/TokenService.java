package com.example.auth.service;

import com.example.auth.entity.User;
import com.example.auth.repository.UserRepository;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;

/**
 * Service de validation des tokens Bearer côté serveur.
 *
 * Contrairement à JwtService qui valide la signature du JWT, TokenService
 * vérifie un token "session" stocké en base (champ token de la table users)
 * et son expiration (token_expires_at). Cela permet d'invalider un token
 * côté serveur (logout, blacklist) sans attendre son expiration naturelle.
 *
 * Centralise la logique de validation pour éviter sa duplication dans chaque
 * contrôleur qui doit identifier l'utilisateur courant à partir du header
 * Authorization.
 *
 * @author Nirina
 * @version 1.0
 */
@Service
public class TokenService {

    /** Repository utilisateur. */
    private final UserRepository userRepository;

    /**
     * Constructeur.
     *
     * @param userRepository repository utilisateur
     */
    public TokenService(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    /**
     * Extrait et valide le token Bearer depuis le header Authorization.
     * Retourne l utilisateur si le token est valide, null sinon.
     *
     * @param authorizationHeader header Authorization
     * @return utilisateur valide ou null
     */
    public User getUserFromToken(String authorizationHeader) {
        if (authorizationHeader == null || !authorizationHeader.startsWith("Bearer ")) {
            return null;
        }

        String token = authorizationHeader.substring(7);
        User user = userRepository.findByToken(token).orElse(null);

        if (user == null) {
            return null;
        }

        if (user.getTokenExpiresAt() == null ||
                user.getTokenExpiresAt().isBefore(LocalDateTime.now())) {
            return null;
        }

        return user;
    }

    /**
     * Verifie si le header Authorization est valide (format Bearer).
     *
     * @param authorizationHeader header Authorization
     * @return true si le format est valide
     */
    public boolean hasValidFormat(String authorizationHeader) {
        return authorizationHeader != null && authorizationHeader.startsWith("Bearer ");
    }
}