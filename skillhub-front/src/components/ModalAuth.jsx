import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
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
    const { login, register } = useAuth();
    const navigate = useNavigate();

    // Onglet actuellement affiché.
    const [onglet, setOnglet] = useState(mode);

    // Formulaire login : deux champs simples.
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');

    // Formulaire register : champs séparés du login pour permettre les deux ouverts en parallèle.
    const [nom, setNom] = useState('');
    const [emailReg, setEmailReg] = useState('');
    const [passwordReg, setPasswordReg] = useState('');
    const [passwordConfirmation, setPasswordConfirmation] = useState('');
    const [role, setRole] = useState('apprenant');

    // États communs aux deux formulaires : message de succès / erreur, drapeau de chargement.
    const [erreur, setErreur] = useState('');
    const [messageOk, setMessageOk] = useState('');
    const [chargement, setChargement] = useState(false);

    /**
     * Ferme la modal au clic sur l'arrière-plan (UX standard de modal).
     * On vérifie que la cible est bien le conteneur (pas un enfant).
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
        e.preventDefault();
        setErreur('');
        setMessageOk('');
        setChargement(true);

        try {
            const data = await login(email, password);

            onFermer();

            if (data?.user?.role === 'formateur') {
                navigate('/dashboard/formateur');
            } else {
                navigate('/dashboard/apprenant');
            }
        } catch (error) {
            const msg =
                error.response?.data?.error ||
                error.response?.data?.message ||
                'Email ou mot de passe incorrect.';

            setErreur(msg);
        } finally {
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
            return;
        }

        setChargement(true);

        try {
            const data = await register(nom, emailReg, passwordReg, passwordConfirmation, role);

            if (data?.token && data?.user) {
                // Auto-login : la modal se ferme et on redirige vers le dashboard.
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
                setNom('');
                setEmailReg('');
                setPasswordReg('');
                setPasswordConfirmation('');
                setRole('apprenant');

                setTimeout(() => {
                    setOnglet('login');
                    setMessageOk('');
                }, 1200);
            }
        } catch (error) {
            if (error.response?.data?.errors) {
                const erreurs = Object.values(error.response.data.errors)
                    .flat()
                    .join(' | ');

                setErreur(erreurs);
            } else {
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

    return (
        <div className="modal-overlay" onClick={handleOverlayClick}>
            <div className="modal-boite">
                <button className="modal-fermer" onClick={onFermer}>
                    ✕
                </button>

                <div className="modal-onglets">
                    <button
                        className={`modal-onglet ${onglet === 'login' ? 'modal-onglet-actif' : ''}`}
                        onClick={() => {
                            setOnglet('login');
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

                {messageOk && <p className="modal-succes">{messageOk}</p>}
                {erreur && <p className="modal-erreur">{erreur}</p>}

                {onglet === 'login' && (
                    <form onSubmit={handleLogin} className="modal-formulaire">
                        <label className="modal-label">Email</label>
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="modal-input"
                            placeholder="votre@email.com"
                            required
                        />

                        <label className="modal-label">Mot de passe</label>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="modal-input"
                            placeholder="••••••••"
                            required
                        />

                        <Bouton
                            type="submit"
                            variante="principal"
                            taille="grand"
                            disabled={chargement}
                        >
                            {chargement ? 'Connexion...' : 'Se connecter'}
                        </Bouton>
                    </form>
                )}

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