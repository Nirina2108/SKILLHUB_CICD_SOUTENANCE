<?php

namespace App\Http\Controllers;

use App\Models\Formation;
use App\Models\Inscription;
use App\Services\ActivityLogService;
use Illuminate\Http\JsonResponse;
use Tymon\JWTAuth\Facades\JWTAuth;
use Tymon\JWTAuth\Exceptions\JWTException;

/**
 * Contrôleur de gestion des inscriptions des apprenants aux formations.
 *
 * Une inscription représente le lien entre un apprenant et une formation
 * qu'il suit. Elle stocke aussi le pourcentage de progression de l'apprenant
 * (mis à jour quand il marque des modules comme terminés).
 *
 * Endpoints exposés :
 *  - store    : inscrit l'apprenant connecté à une formation.
 *  - destroy  : désinscrit l'apprenant.
 *  - mesFormations : liste les formations suivies par l'apprenant connecté.
 */
class InscriptionController extends Controller
{
    private const USER_NOT_FOUND_MESSAGE = 'Utilisateur non trouvé';
    private const TOKEN_INVALID_OR_ABSENT_MESSAGE = 'Token invalide ou absent';
    private const FORMATION_NOT_FOUND_MESSAGE = 'Formation introuvable';

    /**
     * Inscrit l'apprenant connecté à une formation.
     * Route : POST /api/formations/{id}/inscription
     *
     * Renvoie 409 si l'apprenant est déjà inscrit (idempotence stricte).
     */
    public function store($formationId): JsonResponse
    {
        try {
            $user = JWTAuth::parseToken()->authenticate();

            if (! $user) {
                return response()->json([
                    'message' => self::USER_NOT_FOUND_MESSAGE
                ], 404);
            }

            // Filtrage par rôle : seul un apprenant peut s'inscrire (un formateur ne peut pas).
            if ($user->role !== 'apprenant') {
                return response()->json([
                    'message' => "Seul un apprenant peut s'inscrire à une formation"
                ], 403);
            }

            $formation = Formation::find($formationId);

            if (! $formation) {
                return response()->json([
                    'message' => self::FORMATION_NOT_FOUND_MESSAGE
                ], 404);
            }

            // Vérification de doublon : 409 Conflict si déjà inscrit.
            $dejaInscrit = Inscription::where('utilisateur_id', $user->id)
                ->where('formation_id', $formation->id)
                ->first();

            if ($dejaInscrit) {
                return response()->json([
                    'message' => 'Vous êtes déjà inscrit à cette formation'
                ], 409);
            }

            // Création de l'inscription avec progression initiale à 0%.
            $inscription = Inscription::create([
                'utilisateur_id' => $user->id,
                'formation_id' => $formation->id,
                'progression' => 0,
            ]);

            // Log Mongo (best-effort, n'empêche pas l'inscription en cas d'erreur).
            try {
                ActivityLogService::inscriptionFormation($formation->id, $user->id);
            } catch (\Throwable $e) {
                \Log::warning('ActivityLog indisponible (inscription): ' . $e->getMessage());
            }

            return response()->json([
                'message' => 'Inscription réussie',
                'inscription' => $inscription
            ], 201);

        } catch (JWTException $e) {
            return response()->json([
                'message' => self::TOKEN_INVALID_OR_ABSENT_MESSAGE
            ], 401);
        }
    }

    /**
     * Désinscrit l'apprenant connecté d'une formation.
     * Route : DELETE /api/formations/{id}/inscription
     *
     * Note : la progression est perdue (suppression dure de la ligne inscriptions).
     */
    public function destroy($formationId): JsonResponse
    {
        try {
            $user = JWTAuth::parseToken()->authenticate();

            if (! $user) {
                return response()->json([
                    'message' => self::USER_NOT_FOUND_MESSAGE
                ], 404);
            }

            if ($user->role !== 'apprenant') {
                return response()->json([
                    'message' => 'Seul un apprenant peut se désinscrire'
                ], 403);
            }

            $inscription = Inscription::where('utilisateur_id', $user->id)
                ->where('formation_id', $formationId)
                ->first();

            if (! $inscription) {
                return response()->json([
                    'message' => 'Inscription introuvable'
                ], 404);
            }

            $inscription->delete();

            return response()->json([
                'message' => 'Désinscription réussie'
            ]);

        } catch (JWTException $e) {
            return response()->json([
                'message' => self::TOKEN_INVALID_OR_ABSENT_MESSAGE
            ], 401);
        }
    }

    /**
     * Liste les formations suivies par l'apprenant connecté avec leur progression.
     * Route : GET /api/apprenant/formations
     *
     * Eager loading de la relation formation et son formateur, pour éviter N+1
     * lors de l'affichage du dashboard apprenant.
     */
    public function mesFormations(): JsonResponse
    {
        try {
            $user = JWTAuth::parseToken()->authenticate();

            if (! $user) {
                return response()->json([
                    'message' => self::USER_NOT_FOUND_MESSAGE
                ], 404);
            }

            if ($user->role !== 'apprenant') {
                return response()->json([
                    'message' => 'Seul un apprenant peut voir ses formations'
                ], 403);
            }

            // formation.formateur => relation imbriquée, ne charge que les colonnes id/nom/email du formateur.
            $inscriptions = Inscription::with('formation.formateur:id,nom,email')
                ->where('utilisateur_id', $user->id)
                ->get();

            return response()->json([
                'message' => 'Liste des formations récupérée avec succès',
                'inscriptions' => $inscriptions
            ]);

        } catch (JWTException $e) {
            return response()->json([
                'message' => self::TOKEN_INVALID_OR_ABSENT_MESSAGE
            ], 401);
        }
    }
}
