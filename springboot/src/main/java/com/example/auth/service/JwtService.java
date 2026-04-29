package com.example.auth.service;

import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.SignatureAlgorithm;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.security.Key;
import java.util.Date;

/**
 * Service de génération et validation des JSON Web Tokens (JWT).
 *
 * Algorithme : HMAC-SHA256 (HS256). La clé secrète doit faire au moins 32 caractères
 * (contrainte du standard JWT pour cet algorithme).
 *
 * Le JWT contient un payload minimaliste :
 *  - subject : email de l'utilisateur (identifiant)
 *  - issuedAt : timestamp d'émission
 *  - expiration : timestamp d'expiration (issuedAt + jwt.expiration)
 *
 * Aucune information sensible n'est stockée dans le payload (pas de mot de passe,
 * pas de rôle complet) : un JWT peut être lu par n'importe qui en clair, seule
 * la signature garantit l'intégrité.
 *
 * @author Nirina
 * @version 1.0
 */
@Service
public class JwtService {

    /**
     * Clé secrète injectée depuis application.properties (variable d'env JWT_SECRET).
     * Sert à signer ET vérifier les JWT (algorithme symétrique HS256).
     */
    @Value("${app.jwt.secret}")
    private String jwtSecret;

    /**
     * Durée de validité d'un token en millisecondes (ex : 900000 = 15 min).
     * Au-delà, le token doit être refresh ou l'utilisateur doit se reconnecter.
     */
    @Value("${app.jwt.expiration}")
    private long jwtExpiration;

    /**
     * Genere un JWT pour un utilisateur.
     *
     * @param email email de l utilisateur
     * @return token JWT signe
     */
    public String generateToken(String email) {
        Key key = Keys.hmacShaKeyFor(jwtSecret.getBytes());

        return Jwts.builder()
                .setSubject(email)
                .setIssuedAt(new Date())
                .setExpiration(new Date(System.currentTimeMillis() + jwtExpiration))
                .signWith(key, SignatureAlgorithm.HS256)
                .compact();
    }

    /**
     * Extrait l email depuis un JWT.
     *
     * @param token JWT
     * @return email de l utilisateur
     */
    public String extractEmail(String token) {
        Key key = Keys.hmacShaKeyFor(jwtSecret.getBytes());

        return Jwts.parserBuilder()
                .setSigningKey(key)
                .build()
                .parseClaimsJws(token)
                .getBody()
                .getSubject();
    }

    /**
     * Verifie si un JWT est valide.
     *
     * @param token JWT a verifier
     * @return true si valide, false sinon
     */
    public boolean isTokenValid(String token) {
        try {
            Key key = Keys.hmacShaKeyFor(jwtSecret.getBytes());

            Jwts.parserBuilder()
                    .setSigningKey(key)
                    .build()
                    .parseClaimsJws(token);

            return true;
        } catch (Exception e) {
            return false;
        }
    }
}