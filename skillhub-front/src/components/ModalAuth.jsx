// useState : hook React pour stocker des valeurs réactives (qui déclenchent re-render).
import { useState } from 'react';
// useNavigate : redirection programmatique entre pages React Router.
import { useNavigate } from 'react-router-dom';
// Hook personnalisé qui expose login, register, utilisateur, ... du contexte global.
import { useAuth } from '../context/AuthContext';
// Composant bouton réutilisable de l'app.
import Bouton from './Bouton';
import './ModalAuth.css';

/**
 * Modal d'authentification : un overlay qui contient deux onglets,
 * "Se connecter" et "S'inscrire", avec leurs formulaires respectifs.
 *
 * Après succès, la modal redirige vers le dashboard correspondant au rôle
 * de l'utilisateur (formateur ou apprenant).
 *
 * @param {object} props
 * @param {('login'|'register')} [props.mode='login'] Onglet ouvert par défaut
 * @param {function} props.onFermer Callback de fermeture de la modal
 */
export default function ModalAuth({ mode = 'login', onFermer }) {
    // Récupère depuis le contexte les fonctions login() et register() qui parlent à l'API.
    const { login, register } = useAuth();
    const navigate = useNavigate();

    // Onglet actuellement affiché ('login' ou 'register'). Initialisé via la prop mode.
    const [onglet, setOnglet] = useState(mode);

    // États du formulaire login : deux champs simples.
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');

    // États du formulaire register : champs SÉPARÉS du login pour conserver les données
    // si l'utilisateur switch d'onglet sans valider.
    const [nom, setNom] = useState('');
    const [emailReg, setEmailReg] = useState('');
    const [passwordReg, setPasswordReg] = useState('');
    const [passwordConfirmation, setPasswordConfirmation] = useState('');
    const [role, setRole] = useState('apprenant');  // 'apprenant' par défaut

    // États communs aux deux formulaires : message succès / erreur, drapeau de chargement.
    const [erreur, setErreur] = useState('');
    const [messageOk, setMessageOk] = useState('');
    const [chargement, setChargement] = useState(false);  // empêche double-clic + affiche "Connexion..."

    /**
     * Ferme la modal au clic sur l'arrière-plan (UX standard de modal).
     * On vérifie que la cible est bien le conteneur (pas un enfant).
     * e.target = élément effectivement cliqué | e.currentTarget = élément avec onClick.
     */
    const handleOverlayClick = (e) => {
        if (e.target === e.currentTarget) {
            onFermer();
        }
    };

    /**
     * Soumet le formulaire de login. En cas de succès, ferme la modal et
     * redirige vers le bon dashboard selon le rôle. En cas d'erreur, affiche
     * le message renvoyé par le backend (ou un fallback générique).
     */
    const handleLogin = async (e) => {
        e.preventDefault();        // empêche le rechargement de page (comportement par défaut du form HTML)
        setErreur('');             // reset les messages avant de retenter
        setMessageOk('');
        setChargement(true);       // active le spinner / désactive le bouton

        try {
            // Appel via le contexte (qui appelle authService qui appelle l'API).
            const data = await login(email, password);

            onFermer();            // ferme la modal après succès

            // Redirection selon le rôle.
            if (data?.user?.role === 'formateur') {
                navigate('/dashboard/formateur');
            } else {
                navigate('/dashboard/apprenant');
            }
        } catch (error) {
            // Récupère le message d'erreur du backend, en testant plusieurs clés possibles.
            // L'opérateur || prend la 1re valeur "truthy" — utile pour un fallback en cascade.
            const msg =
                error.response?.data?.error ||
                error.response?.data?.message ||
                'Email ou mot de passe incorrect.';

            setErreur(msg);
        } finally {
            // finally s'exécute toujours (succès ou erreur) — on désactive le spinner.
            setChargement(false);
        }
    };

    /**
     * Soumet le formulaire d'inscription.
     *
     * Étapes :
     *  1. Validation côté client : confirmation du mot de passe identique.
     *  2. Appel à l'API via authService (qui stocke le token automatiquement).
     *  3. Si le backend renvoie un token et un user (auto-login), redirection
     *     vers le dashboard.
     *  4. Sinon, affichage d'un message de succès et bascule sur l'onglet login.
     *
     * Gestion d'erreurs : on essaie d'afficher les erreurs de validation Laravel
     * (objet errors) en les concaténant, sinon on tombe sur un message générique.
     */
    const handleRegister = async (e) => {
        e.preventDefault();
        setErreur('');
        setMessageOk('');

        // Validation côté client avant l'appel réseau pour éviter une requête inutile.
        if (passwordReg !== passwordConfirmation) {
            setErreur('Les mots de passe ne correspondent pas.');
            return;  // sortie anticipée : pas d'appel API
        }

        setChargement(true);

        try {
            const data = await register(nom, emailReg, passwordReg, passwordConfirmation, role);

            // Si le backend retourne un token + user, c'est un auto-login.
            if (data?.token && data?.user) {
                onFermer();

                if (data.user.role === 'formateur') {
                    navigate('/dashboard/formateur');
                } else {
                    navigate('/dashboard/apprenant');
                }
            } else {
                // Cas où le backend ne fait pas d'auto-login : on affiche un message
                // et on bascule l'onglet vers login après une courte pause.
                setMessageOk(data?.message || 'Compte créé avec succès.');
                // Reset des champs du formulaire register pour ne pas les laisser pré-remplis.
                setNom('');
                setEmailReg('');
                setPasswordReg('');
                setPasswordConfirmation('');
                setRole('apprenant');

                // Bascule visuelle vers l'onglet login après 1.2s pour laisser lire le message.
                setTimeout(() => {
                    setOnglet('login');
                    setMessageOk('');
                }, 1200);
            }
        } catch (error) {
            // Cas Laravel : objet errors avec les erreurs de validation par champ.
            // Ex : { email: ["déjà pris"], password: ["trop court"] }
            if (error.response?.data?.errors) {
                // Object.values -> [["déjà pris"], ["trop court"]]
                // .flat() -> ["déjà pris", "trop court"]
                // .join(' | ') -> "déjà pris | trop court"
                const erreurs = Object.values(error.response.data.errors)
                    .flat()
                    .join(' | ');

                setErreur(erreurs);
            } else {
                // Sinon, fallback en cascade comme dans handleLogin.
                const msg =
                    error.response?.data?.error ||
                    error.response?.data?.message ||
                    "Erreur lors de l'inscription.";

                setErreur(msg);
            }
        } finally {
            setChargement(false);
        }
    };

    // JSX : overlay (fond semi-transparent) qui contient la boîte modale au centre.
    return (
        <div className="modal-overlay" onClick={handleOverlayClick}>
            <div className="modal-boite">
                {/* Bouton croix de fermeture en haut à droite */}
                <button className="modal-fermer" onClick={onFermer}>
                    ✕
                </button>

                {/* Onglets de bascule login / register */}
                <div className="modal-onglets">
                    <button
                        // Classe conditionnelle : "modal-onglet-actif" ajouté si onglet === 'login'
                        className={`modal-onglet ${onglet === 'login' ? 'modal-onglet-actif' : ''}`}
                        onClick={() => {
                            setOnglet('login');
                            // Reset des messages au changement d'onglet pour ne pas afficher
                            // une erreur de l'autre formulaire.
                            setErreur('');
                            setMessageOk('');
                        }}
                    >
                        Se connecter
                    </button>

                    <button
                        className={`modal-onglet ${onglet === 'register' ? 'modal-onglet-actif' : ''}`}
                        onClick={() => {
                            setOnglet('register');
                            setErreur('');
                            setMessageOk('');
                        }}
                    >
                        S'inscrire
                    </button>
                </div>

                {/* Affichage conditionnel des messages : seulement si non vides */}
                {messageOk && <p className="modal-succes">{messageOk}</p>}
                {erreur && <p className="modal-erreur">{erreur}</p>}

                {/* Formulaire login : visible seulement si onglet === 'login' */}
                {onglet === 'login' && (
                    <form onSubmit={handleLogin} className="modal-formulaire">
                        <label className="modal-label">Email</label>
                        <input
                            type="email"               // valide le format email côté navigateur
                            value={email}              // input contrôlé : valeur lue depuis state
                            onChange={(e) => setEmail(e.target.value)}  // synchro state à chaque frappe
                            className="modal-input"
                            placeholder="votre@email.com"
                            required                   // bloque la soumission si vide
                        />

                        <label className="modal-label">Mot de passe</label>
                        <input
                            type="password"            // masque les caractères saisis
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="modal-input"
                            placeholder="••••••••"
                            required
                        />

                        <Bouton
                            type="submit"              // déclenche onSubmit du form parent
                            variante="principal"
                            taille="grand"
                            disabled={chargement}      // bloque le double-clic
                        >
                            {/* Texte conditionnel selon le chargement */}
                            {chargement ? 'Connexion...' : 'Se connecter'}
                        </Bouton>
                    </form>
                )}

                {/* Formulaire register : visible seulement si onglet === 'register' */}
                {onglet === 'register' && (
                    <form onSubmit={handleRegister} className="modal-formulaire">
                        <label className="modal-label">Nom complet</label>
                        <input
                            type="text"
                            value={nom}
                            onChange={(e) => setNom(e.target.value)}
                            className="modal-input"
                            placeholder="Jean Dupont"
                            required
                        />

                        <label className="modal-label">Email</label>
                        <input
                            type="email"
                            value={emailReg}
                            onChange={(e) => setEmailReg(e.target.value)}
                            className="modal-input"
                            placeholder="votre@email.com"
                            required
                        />

                        <label className="modal-label">Mot de passe</label>
                        <input
                            type="password"
                            value={passwordReg}
                            onChange={(e) => setPasswordReg(e.target.value)}
                            className="modal-input"
                            placeholder="Minimum 6 caractères"
                            required
                        />

                        <label className="modal-label">Confirmer le mot de passe</label>
                        <input
                            type="password"
                            value={passwordConfirmation}
                            onChange={(e) => setPasswordConfirmation(e.target.value)}
                            className="modal-input"
                            placeholder="Répétez votre mot de passe"
                            required
                        />

                        <label className="modal-label">Je suis</label>
                        {/* Select pour choisir le rôle */}
                        <select
                            value={role}
                            onChange={(e) => setRole(e.target.value)}
                            className="modal-select"
                        >
                            <option value="apprenant">Apprenant</option>
                            <option value="formateur">Formateur</option>
                        </select>

                        <Bouton
                            type="submit"
                            variante="principal"
                            taille="grand"
                            disabled={chargement}
                        >
                            {chargement ? 'Création...' : 'Créer mon compte'}
                        </Bouton>
                    </form>
                )}
            </div>
        </div>
    );
}
