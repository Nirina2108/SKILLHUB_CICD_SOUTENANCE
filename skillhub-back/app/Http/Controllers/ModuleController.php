<?php

namespace App\Http\Controllers;

use App\Models\Formation;
use App\Models\Inscription;
use App\Models\Module;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Tymon\JWTAuth\Facades\JWTAuth;
use Tymon\JWTAuth\Exceptions\JWTException;

/**
 * Contrôleur de gestion des modules d'une formation.
 *
 * Un module représente une "leçon" à l'intérieur d'une formation. Il a un
 * titre, un contenu textuel, et un ordre (pour la séquence d'apprentissage).
 *
 * Côté formateur : CRUD complet sur les modules de SES formations.
 * Côté apprenant : marquer un module comme terminé pour faire progresser
 * son taux d'avancement (progression dans la table inscriptions).
 */
class ModuleController extends Controller
{
    private const USER_NOT_FOUND_MESSAGE = 'Utilisateur non trouvé';
    private const TOKEN_INVALID_OR_ABSENT_MESSAGE = 'Token invalide ou absent';
    private const MODULE_NOT_FOUND_MESSAGE = 'Module introuvable';

    /**
     * Liste les modules d'une formation, triés par ordre croissant.
     * Route : GET /api/formations/{id}/modules
     *
     * Endpoint public : pas d'authentification requise.
     */
    public function index($formationId): JsonResponse
    {
        // Tri par "ordre" pour respecter la séquence pédagogique définie par le formateur.
        $modules = Module::where('formation_id', $formationId)
            ->orderBy('ordre')
            ->get();

        return response()->json($modules);
    }

    /**
     * Crée un nouveau module dans une formation.
     * Route : POST /api/formations/{id}/modules
     *
     * Accès : seul le formateur propriétaire de la formation parente.
     */
    public function store(Request $request, $formationId): JsonResponse
    {
        try {
            $user = JWTAuth::parseToken()->authenticate();

            if (! $user) {
                return response()->json([
                    'message' => self::USER_NOT_FOUND_MESSAGE
                ], 404);
            }

            // Filtrage par rôle : seul un formateur peut créer un module.
            if ($user->role !== 'formateur') {
                return response()->json([
                    'message' => 'Seul un formateur peut créer un module'
                ], 403);
            }

            // Vérification de l'existence de la formation parente.
            $formation = Formation::find($formationId);

            if (! $formation) {
                return response()->json([
                    'message' => self::MODULE_NOT_FOUND_MESSAGE
                ], 404);
            }

            // Contrôle de propriété : on ne peut ajouter de modules qu'à ses propres formations.
            if ($formation->formateur_id !== $user->id) {
                return response()->json([
                    'message' => 'Vous ne pouvez pas modifier une formation qui ne vous appartient pas'
                ], 403);
            }

            $data = $request->validate([
                'titre' => 'required|string|max:255',
                'contenu' => 'required|string',
                'ordre' => 'required|integer|min:1',
            ]);

            $module = Module::create([
                'titre' => $data['titre'],
                'contenu' => $data['contenu'],
                'ordre' => $data['ordre'],
                'formation_id' => $formationId,
            ]);

            return response()->json([
                'message' => 'Module créé avec succès',
                'module' => $module
            ], 201);

        } catch (JWTException $e) {
            return response()->json([
                'message' => self::TOKEN_INVALID_OR_ABSENT_MESSAGE
            ], 401);
        }
    }

    /**
     * Met à jour un module existant.
     * Route : PUT /api/modules/{id}
     *
     * Accès : seul le formateur propriétaire de la formation parente.
     */
    public function update(Request $request, $id): JsonResponse
    {
        try {
            $user = JWTAuth::parseToken()->authenticate();

            if (! $user) {
                return response()->json([
                    'message' => self::USER_NOT_FOUND_MESSAGE
                ], 404);
            }

            if ($user->role !== 'formateur') {
                return response()->json([
                    'message' => 'Seul un formateur peut modifier un module'
                ], 403);
            }

            $module = Module::find($id);

            if (! $module) {
                return response()->json([
                    'message' => self::MODULE_NOT_FOUND_MESSAGE
                ], 404);
            }

            // On remonte à la formation parente pour vérifier la propriété.
            $formation = Formation::find($module->formation_id);

            if (! $formation || $formation->formateur_id !== $user->id) {
                return response()->json([
                    'message' => 'Action non autorisée'
                ], 403);
            }

            $data = $request->validate([
                'titre' => 'required|string|max:255',
                'contenu' => 'required|string',
                'ordre' => 'required|integer|min:1',
            ]);

            $module->update([
                'titre' => $data['titre'],
                'contenu' => $data['contenu'],
                'ordre' => $data['ordre'],
            ]);

            return response()->json([
                'message' => 'Module mis à jour avec succès',
                'module' => $module
            ]);

        } catch (JWTException $e) {
            return response()->json([
                'message' => self::TOKEN_INVALID_OR_ABSENT_MESSAGE
            ], 401);
        }
    }

    /**
     * Supprime un module.
     * Route : DELETE /api/modules/{id}
     *
     * Accès : seul le formateur propriétaire de la formation parente.
     * Cascade : les entrées module_user (modules terminés par les apprenants) sont supprimées.
     */
    public function destroy($id): JsonResponse
    {
        try {
            $user = JWTAuth::parseToken()->authenticate();

            if (! $user) {
                return response()->json([
                    'message' => self::USER_NOT_FOUND_MESSAGE
                ], 404);
            }

            if ($user->role !== 'formateur') {
                return response()->json([
                    'message' => 'Seul un formateur peut supprimer un module'
                ], 403);
            }

            $module = Module::find($id);

            if (! $module) {
                return response()->json([
                    'message' => self::MODULE_NOT_FOUND_MESSAGE
                ], 404);
            }

            $formation = Formation::find($module->formation_id);

            if (! $formation || $formation->formateur_id !== $user->id) {
                return response()->json([
                    'message' => 'Action non autorisée'
                ], 403);
            }

            $module->delete();

            return response()->json([
                'message' => 'Module supprimé avec succès'
            ]);

        } catch (JWTException $e) {
            return response()->json([
                'message' => self::TOKEN_INVALID_OR_ABSENT_MESSAGE
            ], 401);
        }
    }

    /**
     * Liste les IDs des modules déjà terminés par l'apprenant pour une formation.
     * Route : GET /api/formations/{id}/modules-termines
     *
     * Sert au frontend à pré-cocher les modules déjà finis dans la page Apprendre.
     * Accès : apprenant uniquement.
     */
    public function mesModulesTermines($formationId): JsonResponse
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
                    'message' => 'Seul un apprenant peut consulter ses modules terminés'
                ], 403);
            }

            // pluck retourne un Collection d'IDs. La relation modulesTermines est un belongsToMany via module_user.
            $ids = $user->modulesTermines()
                ->where('formation_id', $formationId)
                ->pluck('modules.id');

            return response()->json([
                'modules_termines' => $ids
            ]);

        } catch (JWTException $e) {
            return response()->json([
                'message' => self::TOKEN_INVALID_OR_ABSENT_MESSAGE
            ], 401);
        }
    }

    /**
     * Marque un module comme terminé pour l'apprenant connecté et met à jour
     * le pourcentage de progression de son inscription.
     * Route : POST /api/modules/{id}/terminer
     *
     * Logique :
     *  1. Vérifier que l'apprenant est inscrit à la formation parente.
     *  2. Si déjà terminé, ne rien faire (idempotence).
     *  3. Sinon, attacher le module dans le pivot module_user et recalculer la progression.
     */
    public function terminer($id): JsonResponse
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
                    'message' => 'Seul un apprenant peut terminer un module'
                ], 403);
            }

            $module = Module::find($id);

            if (! $module) {
                return response()->json([
                    'message' => self::MODULE_NOT_FOUND_MESSAGE
                ], 404);
            }

            // Vérification de l'inscription à la formation parente.
            $inscription = Inscription::where('utilisateur_id', $user->id)
                ->where('formation_id', $module->formation_id)
                ->first();

            if (! $inscription) {
                return response()->json([
                    'message' => "Vous n'êtes pas inscrit à cette formation"
                ], 403);
            }

            // Idempotence : on ne crée pas un doublon si déjà terminé.
            $dejaTermine = $user->modulesTermines()
                ->where('modules.id', $module->id)
                ->exists();

            if ($dejaTermine) {
                return response()->json([
                    'message' => 'Ce module est déjà terminé',
                    'progression' => $inscription->progression
                ]);
            }

            // syncWithoutDetaching attache la relation sans toucher aux autres modules déjà terminés.
            // Le tableau associatif passe les attributs du pivot (termine = true).
            $user->modulesTermines()->syncWithoutDetaching([
                $module->id => ['termine' => true]
            ]);

            // Calcul du pourcentage de progression : modules terminés / total des modules.
            $totalModules = Module::where('formation_id', $module->formation_id)->count();

            $modulesTermines = $user->modulesTermines()
                ->where('formation_id', $module->formation_id)
                ->count();

            $progression = $totalModules > 0
                ? round(($modulesTermines / $totalModules) * 100)
                : 0;

            // Persistance du pourcentage dans l'inscription pour affichage rapide ailleurs.
            $inscription->progression = $progression;
            $inscription->save();

            return response()->json([
                'message' => 'Module terminé avec succès',
                'progression' => $inscription->progression
            ]);

        } catch (JWTException $e) {
            return response()->json([
                'message' => self::TOKEN_INVALID_OR_ABSENT_MESSAGE
            ], 401);
        }
    }
}
