<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Tymon\JWTAuth\Facades\JWTAuth;
use Tymon\JWTAuth\Exceptions\JWTException;

/**
 * Contrôleur d'authentification de l'application SkillHub.
 *
 * Ce contrôleur gère le cycle de vie de l'utilisateur côté authentification :
 * inscription, connexion, récupération du profil, déconnexion et upload de
 * la photo de profil. Toutes les méthodes protégées s'appuient sur un token
 * JWT (paquet tymon/jwt-auth) reçu dans l'en-tête Authorization.
 */
class AuthController extends Controller
{
    // Messages d'erreur centralisés pour éviter les "magic strings" dispersés.
    private const USER_NOT_FOUND_MESSAGE = 'Utilisateur non trouvé';
    private const TOKEN_INVALID_OR_ABSENT_MESSAGE = 'Token invalide ou absent';

    /**
     * Inscrit un nouvel utilisateur dans la base et lui retourne un token JWT.
     *
     * Étapes :
     *  1. Valide les champs (nom, email unique, mot de passe avec confirmation, rôle).
     *  2. Crée l'enregistrement User (le hash du mot de passe est fait par le mutator du modèle).
     *  3. Génère un token JWT pour que l'utilisateur soit immédiatement connecté.
     *
     * @return JsonResponse avec message, user et token (HTTP 201).
     */
    public function register(Request $request): JsonResponse
    {
        // Validation des entrées : la règle "confirmed" exige un champ password_confirmation identique.
        $request->validate([
            'nom' => 'required|string|max:255',
            'email' => 'required|email|unique:users,email',
            'password' => 'required|string|min:6|confirmed',
            'role' => 'required|in:apprenant,formateur',
        ]);

        // Création en base. Le modèle User a un mutator qui hash le password automatiquement.
        $user = User::create([
            'nom' => $request->input('nom'),
            'email' => $request->input('email'),
            'password' => $request->input('password'),
            'role' => $request->input('role'),
        ]);

        // Génère un JWT à partir de l'utilisateur fraîchement créé.
        $token = JWTAuth::fromUser($user);

        return response()->json([
            'message' => 'Utilisateur créé avec succès',
            'user' => $user,
            'token' => $token,
        ], 201);
    }

    /**
     * Connecte un utilisateur via email + mot de passe et retourne un token JWT.
     *
     * @return JsonResponse avec message, token et user, ou 401 si credentials invalides.
     */
    public function login(Request $request): JsonResponse
    {
        $request->validate([
            'email' => 'required|email',
            'password' => 'required|string',
        ]);

        // Tableau de credentials passé au guard d'authentification.
        $credentials = [
            'email' => $request->input('email'),
            'password' => $request->input('password'),
        ];

        // JWTAuth::attempt vérifie les credentials et retourne un token, ou false en cas d'échec.
        $token = JWTAuth::attempt($credentials);

        if (! $token) {
            return response()->json([
                'message' => 'Email ou mot de passe incorrect'
            ], 401);
        }

        /*
         * On récupère l'utilisateur depuis le token JWT, pas avec auth()->user(),
         * car le guard par défaut Laravel est "web" (sessions). Notre guard JWT
         * doit être interrogé explicitement via JWTAuth.
         */
        $user = JWTAuth::setToken($token)->toUser();

        return response()->json([
            'message' => 'Connexion réussie',
            'token' => $token,
            'user' => $user,
        ]);
    }

    /**
     * Renvoie l'utilisateur actuellement connecté (identifié par le token JWT).
     *
     * Utilisé par le frontend pour rafraîchir les infos utilisateur (par ex.
     * après modification de la photo).
     */
    public function profile(): JsonResponse
    {
        try {
            // Parse le token de l'en-tête Authorization, vérifie sa validité, retourne l'user.
            $user = JWTAuth::parseToken()->authenticate();

            if (! $user) {
                return response()->json([
                    'message' => self::USER_NOT_FOUND_MESSAGE
                ], 404);
            }

            return response()->json([
                'user' => $user
            ]);
        } catch (JWTException $e) {
            // Token absent, expiré, ou malformé.
            return response()->json([
                'message' => self::TOKEN_INVALID_OR_ABSENT_MESSAGE
            ], 401);
        }
    }

    /**
     * Déconnecte l'utilisateur en invalidant son token JWT côté serveur.
     *
     * Le token reste utilisable jusqu'à expiration normalement, mais l'invalidation
     * l'ajoute à une blacklist (Redis ou cache) pour être rejeté immédiatement.
     */
    public function logout(): JsonResponse
    {
        try {
            // Récupère le token courant depuis l'en-tête et l'invalide.
            JWTAuth::parseToken()->invalidate();

            return response()->json([
                'message' => 'Déconnexion réussie'
            ]);
        } catch (JWTException $e) {
            return response()->json([
                'message' => self::TOKEN_INVALID_OR_ABSENT_MESSAGE
            ], 401);
        }
    }

    /**
     * Upload de la photo de profil (jpeg/png/jpg/gif, max 2 MB).
     * Route : POST /api/profil/photo
     *
     * Sauvegarde l'image dans public/images/profils/ et persiste le chemin relatif
     * dans la colonne photo_profil de la table users.
     */
    public function uploadPhoto(Request $request): JsonResponse
    {
        try {
            // Authentification : seul un utilisateur connecté peut changer sa photo.
            $user = JWTAuth::parseToken()->authenticate();

            if (! $user) {
                return response()->json([
                    'message' => self::USER_NOT_FOUND_MESSAGE
                ], 404);
            }

            // Validation : on impose un type image et une taille max de 2 MB (2048 KB).
            $request->validate([
                'photo' => 'required|image|mimes:jpeg,png,jpg,gif|max:2048',
            ]);

            // Si l'utilisateur avait déjà une photo, on supprime l'ancienne pour ne pas accumuler.
            if ($user->photo_profil && file_exists(public_path($user->photo_profil))) {
                unlink(public_path($user->photo_profil));
            }

            // On nomme le fichier avec l'id user + timestamp pour garantir l'unicité.
            $fichier = $request->file('photo');
            $nomFichier = 'profil_' . $user->id . '_' . time() . '.' . $fichier->getClientOriginalExtension();

            // Move déplace le fichier uploadé vers le dossier public, accessible par URL.
            $fichier->move(public_path('images/profils'), $nomFichier);

            // Persistance du chemin relatif (qui sera concaténé avec le host côté frontend).
            $user->photo_profil = '/images/profils/' . $nomFichier;
            $user->save();

            return response()->json([
                'message' => 'Photo mise à jour avec succès',
                'photo_profil' => $user->photo_profil,
                'user' => $user,
            ]);
        } catch (JWTException $e) {
            return response()->json([
                'message' => self::TOKEN_INVALID_OR_ABSENT_MESSAGE
            ], 401);
        }
    }
}
