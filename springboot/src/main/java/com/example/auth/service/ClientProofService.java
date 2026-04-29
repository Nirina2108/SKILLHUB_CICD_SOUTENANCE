package com.example.auth.service;

import com.example.auth.dto.ClientProofRequest;
import com.example.auth.dto.ClientProofResponse;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.UUID;

/**
 * Service de simulation du calcul de preuve d'authentification côté client.
 *
 * En production réelle, ce calcul est effectué dans le navigateur ou l'app
 * mobile pour ne JAMAIS transmettre le mot de passe en clair sur le réseau.
 * Ici on l'implémente côté serveur pour faciliter les tests Postman / curl /
 * démos pendant la soutenance.
 *
 * La preuve produite contient :
 *  - un nonce client (UUID aléatoire pour empêcher le rejeu)
 *  - un timestamp Unix (anti-rejeu temporel : le serveur peut rejeter une
 *    preuve trop ancienne, même si elle a été interceptée)
 *  - le message canonique (email:nonce:timestamp)
 *  - la signature HMAC de ce message avec le password comme secret
 *
 * @author Poun
 * @version 3.2
 */
@Service
public class ClientProofService {

    /**
     * Service HMAC.
     */
    private final HmacService hmacService;

    /**
     * Constructeur.
     *
     * @param hmacService service HMAC
     */
    public ClientProofService(HmacService hmacService) {
        this.hmacService = hmacService;
    }

    /**
     * Génère une preuve client complète.
     *
     * @param request données client
     * @return preuve complète à envoyer au serveur
     */
    public ClientProofResponse buildProof(ClientProofRequest request) {
        String nonce = UUID.randomUUID().toString();
        long timestamp = Instant.now().getEpochSecond();
        String message = hmacService.buildMessage(request.getEmail(), nonce, timestamp);
        String hmac = hmacService.hmacSha256(request.getPassword(), message);

        ClientProofResponse response = new ClientProofResponse();
        response.setEmail(request.getEmail());
        response.setNonce(nonce);
        response.setTimestamp(timestamp);
        response.setMessage(message);
        response.setHmac(hmac);

        return response;
    }
}