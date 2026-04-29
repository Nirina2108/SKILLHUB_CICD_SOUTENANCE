package com.example.auth.config;

import jakarta.servlet.Filter;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletRequest;
import jakarta.servlet.ServletResponse;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.Ordered;
import org.springframework.core.annotation.Order;

/**
 * Configuration CORS du service d'authentification Spring Boot.
 *
 * Cette classe est un Filter Servlet plutôt qu'une configuration WebMvc
 * (CorsRegistry) parce qu'elle doit s'exécuter AVANT la résolution de route :
 * @Order(HIGHEST_PRECEDENCE) garantit qu'elle traite les requêtes OPTIONS
 * de préflight avant que Spring ne tente de matcher une route inexistante.
 *
 * Origines autorisées : localhost:3000 (CRA dev) et localhost:5173 (Vite dev),
 * en HTTP comme en 127.0.0.1. Toute autre origine n'aura pas le header
 * Access-Control-Allow-Origin et le navigateur bloquera la réponse.
 *
 * supportsCredentials=true permet aux requêtes avec cookies/Authorization
 * de réussir ; impose donc qu'Allow-Origin renvoie une origine SPÉCIFIQUE
 * (pas le wildcard "*").
 *
 * @author Nirina
 * @version 1.1
 */
@Configuration
@Order(Ordered.HIGHEST_PRECEDENCE)
public class CorsConfig implements Filter {

    /**
     * Implémentation du filtre. Ajoute les headers CORS, court-circuite OPTIONS
     * en répondant directement 200 (préflight), et passe la requête au pipeline
     * suivant pour les autres méthodes.
     */
    @Override
    public void doFilter(ServletRequest req, ServletResponse res, FilterChain chain)
            throws java.io.IOException, jakarta.servlet.ServletException {

        HttpServletResponse response = (HttpServletResponse) res;
        HttpServletRequest request = (HttpServletRequest) req;

        String origin = request.getHeader("Origin");

        if (origin != null && (
                origin.equals("http://localhost:3000") ||
                        origin.equals("http://localhost:5173") ||
                        origin.equals("http://127.0.0.1:3000") ||
                        origin.equals("http://127.0.0.1:5173")
        )) {
            response.setHeader("Access-Control-Allow-Origin", origin);
        }

        response.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
        response.setHeader("Access-Control-Allow-Headers", "Authorization, Content-Type, Accept");
        response.setHeader("Access-Control-Allow-Credentials", "true");
        response.setHeader("Access-Control-Max-Age", "3600");

        if ("OPTIONS".equalsIgnoreCase(request.getMethod())) {
            response.setStatus(HttpServletResponse.SC_OK);
            return;
        }

        chain.doFilter(req, res);
    }

    /**
     * Enregistre le filtre CORS.
     *
     * @return filtre CORS
     */
    @Bean
    public CorsConfig corsFilter() {
        return new CorsConfig();
    }
}