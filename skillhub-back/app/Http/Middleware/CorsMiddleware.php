<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;

/**
 * Middleware CORS personnalisé.
 *
 * Ajoute les en-têtes Access-Control-Allow-* nécessaires pour permettre au
 * frontend (servi sur localhost:5173 par Vite) d'appeler l'API Laravel
 * (servie sur localhost:8001) malgré la politique Same-Origin du navigateur.
 *
 * Ce middleware est enregistré globalement et en première position
 * (voir bootstrap/app.php : $middleware->prepend(CorsMiddleware::class)).
 *
 * Comportement :
 *  - Pour les requêtes OPTIONS (préflight CORS) : court-circuite la pipeline
 *    et renvoie directement une réponse 200 avec les en-têtes autorisés.
 *  - Pour toutes les autres requêtes : laisse passer la requête, puis ajoute
 *    les en-têtes CORS à la réponse avant de la retourner au client.
 */
class CorsMiddleware
{
    /**
     * Point d'entrée du middleware Laravel.
     *
     * @param Request $request  La requête HTTP entrante.
     * @param Closure $next     Le prochain handler de la pipeline.
     */
    public function handle(Request $request, Closure $next)
    {
        // Liste blanche des origines autorisées (lue depuis config/cors.php).
        $allowedOrigins = config('cors.allowed_origins', ['http://localhost:5173']);
        $origin = $request->header('Origin', '');

        // Si l'origine de la requête est autorisée, on l'utilise telle quelle ;
        // sinon on retombe sur la première de la liste (sécurité par défaut).
        $allowedOrigin = in_array($origin, $allowedOrigins) ? $origin : ($allowedOrigins[0] ?? '*');

        // Préflight CORS (OPTIONS) : on répond immédiatement, sans aller dans le routeur.
        // Cela évite que la requête OPTIONS atteigne une route qui ne saurait y répondre correctement.
        if ($request->isMethod('OPTIONS')) {
            return response('', 200)
                ->header('Access-Control-Allow-Origin', $allowedOrigin)
                ->header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
                ->header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With')
                ->header('Access-Control-Max-Age', '86400');
        }

        // Requête normale : on laisse la pipeline traiter, puis on ajoute les en-têtes CORS sur la réponse.
        $response = $next($request);

        $response->headers->set('Access-Control-Allow-Origin', $allowedOrigin);
        $response->headers->set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
        $response->headers->set('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');

        return $response;
    }
}
